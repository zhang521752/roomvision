import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dns from 'dns';
import dotenv from 'dotenv';

// AI Gateway imports
import { generate, twoStageGenerate } from './services/ai-gateway';
import { queueManager } from './services/queue-manager';
import { costController } from './services/cost-controller';
import { extractStructureFromUrl, aiDepthAnalysis, buildLayoutLockPrompt } from './services/layout-lock';
import { getInspirations, getInspirationById, getAvailableStyles, getAvailableRoomTypes } from './services/inspiration-feed';
import { pointsManager, TIER_BENEFITS, POINT_PACKAGES, RENOVATION_PASSES, RESOLUTION_COSTS, FREE_STYLES } from './services/points-system';
import { authManager } from './services/auth';
import { generateCodes, redeemCode, getCodeStats, getCodesByBatch, getCodesUsedByUser } from './services/activation-code';
import { buildStage1Prompt, buildStage2Prompt, buildStage3Prompt, calculateRefinementCost, getRefinementDescription, executeThreeStagePipeline, executeRefinement, type RefinementOptions } from './services/three-stage-pipeline';
import { generateStyleLanguage, buildUnifiedRoomPrompt, calculateWholeHouseCost, getRoomTypeOptions, executeWholeHouseGeneration, type RoomUpload } from './services/whole-house';
import { buildPrompt, STYLE_MAP, type PromptInput } from './services/prompt-engine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  `http://localhost:${PORT}`,
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      // Allow direct browser navigation, local health checks, and static asset requests.
      // Requests with an Origin header are still checked against the whitelist below.
      callback(null, true);
      return;
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: '请求过于频繁，请稍后再试', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: '认证请求过多，请稍后再试', code: 'AUTH_RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: '生成请求过于频繁，请稍后再试', code: 'GENERATE_RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/styles', express.static(path.join(__dirname, '../public/styles')));

const PROXY_ALLOWED_HOSTS = [
  'images.unsplash.com',
  'plus.unsplash.com',
];

function isPrivateIP(hostname: string): boolean {
  const parts = hostname.split('.');
  if (parts.length !== 4) return false;
  const nums = parts.map(Number);
  if (nums.some(isNaN)) return false;
  if (nums[0] === 10) return true;
  if (nums[0] === 172 && nums[1] >= 16 && nums[1] <= 31) return true;
  if (nums[0] === 192 && nums[1] === 168) return true;
  if (nums[0] === 127) return true;
  if (nums[0] === 0) return true;
  if (nums[0] === 169 && nums[1] === 254) return true;
  return false;
}

app.get('/api/image-proxy', async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) { res.status(400).send('Missing url'); return; }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    res.status(400).send('Invalid URL');
    return;
  }

  if (parsedUrl.protocol !== 'https:') {
    res.status(403).send('Only HTTPS URLs allowed');
    return;
  }

  if (!PROXY_ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    res.status(403).send('Domain not allowed');
    return;
  }

  // Resolve DNS first, then check resolved IPs for private ranges (prevents DNS rebinding)
  try {
    const addresses = await dns.promises.resolve4(parsedUrl.hostname);
    for (const addr of addresses) {
      if (isPrivateIP(addr)) {
        res.status(403).send('Resolved to private IP');
        return;
      }
    }
  } catch {
    // If DNS fails, try IPv6
    try {
      const addresses6 = await dns.promises.resolve6(parsedUrl.hostname);
      for (const addr of addresses6) {
        if (addr === '::1' || addr.startsWith('fc') || addr.startsWith('fd') || addr.startsWith('fe80')) {
          res.status(403).send('Resolved to private IP');
          return;
        }
      }
    } catch {
      res.status(400).send('DNS resolution failed');
      return;
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) { res.status(response.status).send('Fetch failed'); return; }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      res.status(403).send('Non-image content type');
      return;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > 10 * 1024 * 1024) {
      res.status(413).send('Image too large');
      return;
    }
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (e: any) {
    if (e.name === 'AbortError') { res.status(504).send('Upstream timeout'); return; }
    res.status(500).send('Proxy error');
  }
});

// 确保 uploads 目录存在
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 文件上传配置
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(ext) || !allowedMimes.includes(file.mimetype)) {
      cb(new Error('仅支持 JPG、PNG、WebP 格式的图片'));
      return;
    }
    cb(null, true);
  },
});

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '请先登录', code: 'AUTH_REQUIRED' });
    return;
  }
  const token = authHeader.substring(7);
  const result = authManager.verifyToken(token);
  if (!result.valid) {
    res.status(401).json({ success: false, error: '登录已过期，请重新登录', code: 'TOKEN_EXPIRED' });
    return;
  }
  (req as any).authUserId = result.userId;
  next();
}

app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image uploaded' });
    return;
  }

  res.json({
    success: true,
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
  });
});

// 统一生成接口（带队列和成本控制）
app.post('/api/generate', authMiddleware, generateLimiter, async (req, res) => {
  try {
    const {
      imageUrl,
      roomType,
      style,
      atmosphere,
      materials,
      lighting,
      budget,
      mode = 'auto',
      customPrompt = '',
      styleReferenceImage = '',
    } = req.body;

    if (!roomType || !style) {
      res.status(400).json({ error: '缺少必要参数: roomType, style' });
      return;
    }

    const userId = (req as any).authUserId;
    const resolution = req.body.resolution || '1K';
    const imageCount = req.body.imageCount || 1;
    const pointsCost = pointsManager.calculateCost(resolution, imageCount);
    const benefits = pointsManager.getBenefits(userId);
    const userLevel = benefits.tier === 'pass_30day' ? 'premium' : benefits.tier === 'pass_7day' ? 'pro' : 'free';

    if (!pointsManager.isResolutionAvailable(userId, resolution)) {
      res.status(403).json({ success: false, error: `${benefits.labelCN}不支持${resolution}分辨率，请升级`, code: 'RESOLUTION_LOCKED' });
      return;
    }

    const styleName = style.replace(/\s+interior\s*design\s*$/i, '').trim();
    if (!pointsManager.isStyleAvailable(userId, styleName)) {
      res.status(403).json({ success: false, error: '升级通行证解锁更多风格', code: 'STYLE_LOCKED' });
      return;
    }

    const spendCheck = await pointsManager.canSpend(userId, pointsCost);
    if (!spendCheck.allowed) {
      res.status(429).json({ success: false, error: spendCheck.reason, code: 'INSUFFICIENT_POINTS' });
      return;
    }

    const dailyCheck = pointsManager.canGenerateToday(userId);
    if (!dailyCheck.allowed) {
      res.status(429).json({ success: false, error: `今日生成次数已用完（${dailyCheck.limit}次/天），升级通行证可无限生成`, code: 'DAILY_LIMIT_REACHED' });
      return;
    }

    // 队列处理
    const result = await queueManager.enqueue(
      { promptInput: { roomType, style, atmosphere, materials: materials || [], lighting, budget, hasReferenceImage: !!imageUrl, customPrompt, styleReferenceImage }, userLevel, mode, imageUrl, styleReferenceImage },
      userLevel === 'premium' ? 'premium' : userLevel === 'pro' ? 'pro' : 'free',
      async (payload) => generate(payload),
    );

    const spendResult = await pointsManager.spend(userId, pointsCost, `generate ${resolution}x${result.images.length}`);
    pointsManager.recordGeneration(userId);

    res.json({
      success: true,
      ...result,
      pointsCost,
      remainingPoints: spendResult.remaining,
      tier: benefits.tier,
    });
  } catch (error: any) {
    console.error('[API] Generate error:', error.message?.substring(0, 200));
    const errMsg = (error.message || '生成失败').substring(0, 200);
    res.status(500).json({
      success: false,
      error: errMsg.includes('502') ? 'AI 服务暂时不可用(502)，请稍后重试' : errMsg.includes('timed out') ? 'AI 生成超时，请稍后重试' : '生成失败，请稍后重试',
    });
  }
});

// 两阶段生成接口
app.post('/api/generate/two-stage', authMiddleware, generateLimiter, async (req, res) => {
  try {
    const {
      imageUrl,
      roomType,
      style,
      atmosphere,
      materials,
      lighting,
      budget,
    } = req.body;

    if (!roomType || !style) {
      res.status(400).json({ error: '缺少必要参数: roomType, style' });
      return;
    }

    const userId = (req as any).authUserId;
    const resolution = req.body.resolution || '1K';
    const benefits = pointsManager.getBenefits(userId);
    const userLevel = benefits.tier === 'pass_30day' ? 'premium' : benefits.tier === 'pass_7day' ? 'pro' : 'free';

    if (!pointsManager.isResolutionAvailable(userId, resolution)) {
      res.status(403).json({ success: false, error: `${benefits.labelCN}不支持${resolution}分辨率，请升级`, code: 'RESOLUTION_LOCKED' });
      return;
    }

    const styleName = style.replace(/\s+interior\s*design\s*$/i, '').trim();
    if (!pointsManager.isStyleAvailable(userId, styleName)) {
      res.status(403).json({ success: false, error: '升级通行证解锁更多风格', code: 'STYLE_LOCKED' });
      return;
    }

    const dailyCheck = pointsManager.canGenerateToday(userId);
    if (!dailyCheck.allowed) {
      res.status(429).json({ success: false, error: `今日生成次数已用完（${dailyCheck.limit}次/天），升级通行证可无限生成`, code: 'DAILY_LIMIT_REACHED' });
      return;
    }

    const pointsCost = pointsManager.calculateCost(resolution, 2);
    const spendCheck = await pointsManager.canSpend(userId, pointsCost);
    if (!spendCheck.allowed) {
      res.status(429).json({ success: false, error: '创想点不足', code: 'INSUFFICIENT_POINTS' });
      return;
    }

    const result = await twoStageGenerate(
      { roomType, style, atmosphere, materials: materials || [], lighting, budget },
      userLevel,
    );

    const spendResult = await pointsManager.spend(userId, pointsCost, 'two-stage-generate');
    pointsManager.recordGeneration(userId);

    res.json({ success: true, ...result, pointsCost, remainingPoints: spendResult.remaining, tier: benefits.tier });
  } catch (error: any) {
    console.error('[API] Two-stage error:', error.message?.substring(0, 200));
    const errMsg = (error.message || '').substring(0, 200);
    res.status(500).json({ success: false, error: errMsg.includes('502') ? 'AI 服务暂时不可用(502)，请稍后重试' : errMsg.includes('timed out') ? 'AI 生成超时，请稍后重试' : '生成失败，请稍后重试' });
  }
});

// 超清渲染接口（付费用户单独调用）
app.post('/api/generate/ultra', authMiddleware, generateLimiter, async (req, res) => {
  try {
    const {
      imageUrl,
      roomType,
      style,
      atmosphere,
      materials,
      lighting,
      budget,
    } = req.body;

    if (!roomType || !style) {
      res.status(400).json({ error: '缺少必要参数: roomType, style' });
      return;
    }

    const userId = (req as any).authUserId;
    const benefits = pointsManager.getBenefits(userId);

    if (benefits.tier === 'free') {
      res.status(403).json({ success: false, error: '超清渲染为通行证专属功能，请升级', code: 'ULTRA_LOCKED' });
      return;
    }

    const resolution = req.body.resolution || '2K';
    if (!pointsManager.isResolutionAvailable(userId, resolution)) {
      res.status(403).json({ success: false, error: `${benefits.labelCN}不支持${resolution}分辨率，请升级`, code: 'RESOLUTION_LOCKED' });
      return;
    }

    const styleName = style.replace(/\s+interior\s*design\s*$/i, '').trim();
    if (!pointsManager.isStyleAvailable(userId, styleName)) {
      res.status(403).json({ success: false, error: '升级通行证解锁更多风格', code: 'STYLE_LOCKED' });
      return;
    }

    const pointsCost = pointsManager.calculateCost(resolution, 1);
    const spendCheck = await pointsManager.canSpend(userId, pointsCost);
    if (!spendCheck.allowed) {
      res.status(429).json({ success: false, error: spendCheck.reason, code: 'INSUFFICIENT_POINTS' });
      return;
    }

    const result = await generate({
      promptInput: { roomType, style, atmosphere, materials: materials || [], lighting, budget, hasReferenceImage: !!imageUrl, customPrompt: '' },
      userLevel: 'premium',
      mode: 'ultra_render',
      imageUrl,
    });

    await pointsManager.spend(userId, pointsCost, 'ultra-render');
    pointsManager.recordGeneration(userId);

    res.json({ success: true, ...result, pointsCost, tier: benefits.tier });
  } catch (error: any) {
    console.error('[API] Ultra render error:', error.message?.substring(0, 200));
    const errMsg = (error.message || '').substring(0, 200);
    res.status(500).json({ success: false, error: errMsg.includes('502') ? 'AI 服务暂时不可用(502)，请稍后重试' : errMsg.includes('timed out') ? 'AI 生成超时，请稍后重试' : '生成失败，请稍后重试' });
  }
});

// Provider 状态检查
app.get('/api/providers/status', authMiddleware, async (_req, res) => {
  try {
    const { getProvider } = await import('./services/providers/base');
    const providers = ['gpt-image', 'nanobananapro', 'image2-backup'];
    const status: Record<string, boolean> = {};

    for (const name of providers) {
      const provider = getProvider(name);
      status[name] = provider ? await provider.isAvailable() : false;
    }

    res.json({ success: true, providers: status });
  } catch (error: any) {
    console.error('[API] Provider status error:', error.message);
    res.status(500).json({ success: false, error: '无法获取 Provider 状态' });
  }
});

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: '栖界AI API is running',
    architecture: 'Hybrid AI Gateway (GPT-Image → Gemini3 → 豆包)',
    version: '2.0.0',
  });
});

// 成本统计
app.get('/api/cost/stats', authMiddleware, (_req, res) => {
  res.json({
    success: true,
    ...costController.getDailyStats(),
  });
});

// 剩余生成次数
app.get('/api/cost/remaining', authMiddleware, (req, res) => {
  const userId = (req as any).authUserId;
  const benefits = pointsManager.getBenefits(userId);
  const dailyGens = pointsManager.canGenerateToday(userId);
  res.json({
    success: true,
    userId,
    tier: benefits.tier,
    dailyGenerations: dailyGens,
  });
});

// 队列状态
app.get('/api/queue/status', authMiddleware, (_req, res) => {
  res.json({
    success: true,
    ...queueManager.getStatus(),
  });
});

// Layout Lock - 结构分析
app.post('/api/analyze/structure', authMiddleware, async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) { res.status(400).json({ success: false, error: '需要图片URL' }); return; }
  try {
    const structure = await extractStructureFromUrl(imageUrl, path.join(__dirname, '../uploads'));
    const aiDepth = await aiDepthAnalysis(imageUrl, PORT);
    const layoutLockPrompt = buildLayoutLockPrompt(structure, aiDepth);
    res.json({ success: true, structure, aiDepth, layoutLockPrompt });
  } catch (e: any) { const msg = (e.message || '').substring(0, 200); res.status(500).json({ success: false, error: msg.includes('502') ? 'AI 服务暂时不可用(502)，请稍后重试' : msg.includes('timed out') ? 'AI 生成超时，请稍后重试' : '分析失败，请稍后重试' }); }
});

// Inspiration Feed
app.get('/api/inspirations', (_req, res) => {
  const style = _req.query.style as string | undefined;
  const roomType = _req.query.roomType as string | undefined;
  const limit = parseInt(_req.query.limit as string) || 20;
  const offset = parseInt(_req.query.offset as string) || 0;
  const items = getInspirations({ style, roomType, limit, offset });
  res.json({ success: true, items, total: items.length });
});
app.get('/api/inspirations/styles', (_req, res) => { res.json({ success: true, styles: getAvailableStyles() }); });
app.get('/api/inspirations/rooms', (_req, res) => { res.json({ success: true, roomTypes: getAvailableRoomTypes() }); });
app.get('/api/inspirations/:id', (req, res) => {
  const item = getInspirationById(req.params.id);
  if (!item) { res.status(404).json({ success: false, error: '灵感不存在' }); return; }
  res.json({ success: true, item });
});

// Auth
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { phone, password, nickname } = req.body;
  const result = await authManager.register(phone, password, nickname);
  if (result.success) {
    const gift = pointsManager.claimRegistrationGift(result.user!.id);
    res.json({ success: true, token: result.token, user: result.user, giftPoints: gift.points });
  } else { res.status(400).json({ success: false, error: result.error }); }
});
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { phone, password } = req.body;
  const result = await authManager.login(phone, password);
  if (result.success) {
    pointsManager.dailyRecovery(result.user!.id);
    const pointsInfo = pointsManager.getUserInfo(result.user!.id);
    res.json({ success: true, token: result.token, user: result.user, pointsInfo });
  } else { res.status(401).json({ success: false, error: result.error }); }
});
app.get('/api/auth/verify', authLimiter, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ success: false, error: '未登录' }); return; }
  const result = authManager.verifyToken(token);
  if (result.valid) {
    const user = authManager.getUserById(result.userId!);
    const pointsInfo = pointsManager.getUserInfo(result.userId!);
    res.json({ success: true, user, pointsInfo });
  } else { res.status(401).json({ success: false, error: '登录已过期' }); }
});
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) authManager.logout(token);
  res.json({ success: true });
});

// Points
app.get('/api/points/:userId', authMiddleware, (req, res) => {
  const userId = (req as any).authUserId;
  const info = pointsManager.getUserInfo(userId);
  res.json({ success: true, ...info });
});
app.post('/api/points/:userId/claim-gift', authMiddleware, (req, res) => {
  const userId = (req as any).authUserId;
  const result = pointsManager.claimRegistrationGift(userId);
  res.json({ success: result.success, points: result.points });
});
app.post('/api/points/:userId/daily-recovery', authMiddleware, (req, res) => {
  const userId = (req as any).authUserId;
  const result = pointsManager.dailyRecovery(userId);
  res.json({ success: true, ...result });
});
// 激活码兑换接口（替代原充值/通行证接口，安全方案）
app.post('/api/points/redeem-code', authMiddleware, (req, res) => {
  const userId = (req as any).authUserId;
  const { code } = req.body;

  if (!code || typeof code !== 'string' || code.trim().length < 4) {
    res.status(400).json({ success: false, error: '请输入有效的激活码' });
    return;
  }

  const result = redeemCode(code, userId);

  if (!result.success) {
    res.json({ success: false, error: result.error });
    return;
  }

  if (result.type === 'points' && result.points) {
    const pointsResult = pointsManager.recharge(userId, result.points);
    console.log(`[ActivationCode] ${userId} redeemed points code: +${result.points} points`);
    res.json({
      success: true,
      type: 'points',
      pointsAdded: result.points,
      total: pointsResult.total,
      message: `成功兑换 ${result.points} 创想点`,
    });
    return;
  }

  if (result.type === 'pass' && result.passType) {
    const passResult = pointsManager.activatePass(userId, result.passType);
    const passLabel = result.passType === 'pass_30day' ? '30日装修通行证' : '7日装修通行证';
    console.log(`[ActivationCode] ${userId} redeemed pass code: ${result.passType}`);
    res.json({
      success: true,
      type: 'pass',
      passType: result.passType,
      expiresAt: passResult.expiresAt,
      message: `成功激活${passLabel}`,
    });
    return;
  }

  res.status(500).json({ success: false, error: '激活码处理异常' });
});

// 查询用户已兑换的激活码记录
app.get('/api/points/redeem-history', authMiddleware, (req, res) => {
  const userId = (req as any).authUserId;
  const records = getCodesUsedByUser(userId);
  res.json({
    success: true,
    records: records.map(r => ({
      code: r.code.slice(0, 4) + '****', // 隐藏完整码
      type: r.type,
      value: r.value,
      passType: r.passType,
      usedAt: r.usedAt,
      note: r.note,
    })),
  });
});

// 管理员：生成激活码（需要 ADMIN_SECRET 环境变量）
app.post('/api/admin/generate-codes', (req, res) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ success: false, error: '无管理员权限' });
    return;
  }

  const { type, value, passType, count, batchId, note } = req.body;

  if (!type || !['points', 'pass'].includes(type)) {
    res.status(400).json({ success: false, error: 'type 必须为 points 或 pass' });
    return;
  }
  if (!value || typeof value !== 'number' || value <= 0) {
    res.status(400).json({ success: false, error: 'value 必须为正数' });
    return;
  }
  if (type === 'pass' && !['pass_7day', 'pass_30day'].includes(passType)) {
    res.status(400).json({ success: false, error: '通行证类型必须为 pass_7day 或 pass_30day' });
    return;
  }
  if (!count || typeof count !== 'number' || count < 1 || count > 100) {
    res.status(400).json({ success: false, error: 'count 必须为 1-100 之间的整数' });
    return;
  }

  const result = generateCodes({
    type,
    value,
    passType,
    count,
    batchId,
    note: note || (type === 'pass' ? `${passType}通行证` : `${value}积分`),
  });

  console.log(`[Admin] Generated ${result.count} ${type} codes, batch: ${result.batchId}`);
  res.json({ success: true, ...result });
});

// 管理员：查看激活码统计
app.get('/api/admin/code-stats', (req, res) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ success: false, error: '无管理员权限' });
    return;
  }
  const stats = getCodeStats();
  res.json({ success: true, stats });
});

// 管理员：按批次查看激活码
app.get('/api/admin/code-batch/:batchId', (req, res) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ success: false, error: '无管理员权限' });
    return;
  }
  const codes = getCodesByBatch(req.params.batchId);
  res.json({ success: true, codes, count: codes.length });
});
app.get('/api/packages', (_req, res) => { res.json({ success: true, packages: POINT_PACKAGES }); });
app.get('/api/passes', (_req, res) => { res.json({ success: true, passes: RENOVATION_PASSES }); });
app.get('/api/benefits', (_req, res) => { res.json({ success: true, tiers: TIER_BENEFITS, freeStyles: FREE_STYLES, resolutions: RESOLUTION_COSTS }); });

// AI 识别空间接口
app.post('/api/analyze', authMiddleware, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      res.status(400).json({ error: '缺少必要参数: imageUrl' });
      return;
    }

    const baseURL = process.env.OPENAI_BASE_URL;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!baseURL || !apiKey) {
      console.warn('[API] Analyze: OPENAI_BASE_URL 或 OPENAI_API_KEY 未配置，返回模拟结果');
      res.json({
        success: true,
        analysis: {
          roomType: '客厅',
          roomSize: '中等',
          lighting: '自然采光良好',
          currentStyle: '现代简约',
          description: '这是一个中等大小的客厅，采光良好，目前采用现代简约风格装修，空间布局合理。',
        },
      });
      return;
    }

    // 构建完整的图片 URL
    const fullImageUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `http://localhost:${PORT}${imageUrl}`;

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `你是一位专业的室内设计师，请仔细分析这张房间照片，识别以下信息并以 JSON 格式返回：

1. roomType: 房间类型，必须从以下选项中选择最准确的一个：
   - 客厅 / 主卧 / 次卧 / 儿童房 / 书房 / 厨房 / 餐厅 / 卫生间 / 阳台 / 玄关 / 衣帽间 / 储物间 / 地下室 / 影音室
   注意区分：主卧（通常面积较大，可能有独立卫浴或衣帽区）vs 次卧（面积较小，通常为客卧或儿童备用房）vs 儿童房（有儿童相关装饰或家具特征）
   如果是毛坯房（未装修的空房间），请根据空间大小、窗户位置、房间比例等判断最可能的房间用途

2. roomSize: 面积大小估算（小型<10㎡ / 中等10-20㎡ / 大型>20㎡）

3. lighting: 采光情况（自然采光良好 / 自然采光一般 / 采光不足 / 混合照明 / 人工照明为主）

4. currentStyle: 当前装修风格（如：毛坯未装修、现代简约、北欧风格、工业风格、日式和风、中式传统等）

5. isBareRoom: 是否为毛坯房（true / false），判断依据：墙面是否为水泥/腻子未刷漆、地面是否为水泥/未铺装、有无成品家具和装饰

6. description: 对房间的简要描述（一句话概括房间现状，包含空间特征和用途判断依据）

请只返回 JSON，不要包含其他文字。`,
              },
              {
                type: 'image_url',
                image_url: { url: fullImageUrl },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API 返回错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 尝试从 AI 返回内容中解析 JSON
    let analysis;
    try {
      // 提取 JSON 部分（可能被 markdown 代码块包裹）
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法从 AI 响应中提取 JSON');
      }
    } catch (parseError: any) {
      console.warn('[API] Analyze: JSON 解析失败，使用默认值:', parseError.message);
      analysis = {
        roomType: '客厅',
        roomSize: '中等',
        lighting: '自然采光良好',
        currentStyle: '现代简约',
        description: content.slice(0, 100) || '无法解析房间信息',
      };
    }

    res.json({ success: true, analysis });
  } catch (error: any) {
    console.error('[API] Analyze error:', error.message);
    res.status(500).json({
      success: false,
      error: '房间识别失败，请重试',
    });
  }
});

// 微调接口
app.post('/api/refine', authMiddleware, async (req, res) => {
  try {
    const {
      imageUrl,
      roomType,
      style,
      selectedImageUrl,
      refinePrompt,
    } = req.body;

    if (!selectedImageUrl || !refinePrompt) {
      res.status(400).json({ error: '缺少必要参数: selectedImageUrl, refinePrompt' });
      return;
    }

    const userId = (req as any).authUserId;
    const refineCost = 5;
    const benefits = pointsManager.getBenefits(userId);
    // 从服务端获取真实用户等级，不信任客户端
    const userLevel = benefits.tier === 'pass_30day' ? 'premium' : benefits.tier === 'pass_7day' ? 'pro' : 'free';

    if (benefits.refinement === 0) {
      res.status(403).json({ success: false, error: '升级通行证解锁微调功能', code: 'REFINE_LOCKED' });
      return;
    }

    const spendCheck = await pointsManager.canSpend(userId, refineCost);
    if (!spendCheck.allowed) {
      res.status(429).json({ success: false, error: spendCheck.reason, code: 'INSUFFICIENT_POINTS' });
      return;
    }

    // 使用选中的方案图作为参考图，加上微调提示词生成新图
    const result = await generate({
      promptInput: {
        roomType: roomType || 'living_room',
        style: style || 'modern interior design',
        atmosphere: refinePrompt,
        materials: [],
        lighting: undefined,
        budget: undefined,
        hasReferenceImage: true,
        customPrompt: refinePrompt,
      },
      userLevel: userLevel as any,
      mode: userLevel === 'free' ? 'quick_preview' : 'auto',
      imageUrl: selectedImageUrl,
    });

    const spendResult = await pointsManager.spend(userId, refineCost, 'refine');

    res.json({
      success: true,
      ...result,
      pointsCost: refineCost,
      remainingPoints: spendResult.remaining,
    });
  } catch (error: any) {
    console.error('[API] Refine error:', error.message?.substring(0, 200));
    const errMsg = (error.message || '').substring(0, 200);
    res.status(500).json({
      success: false,
      error: errMsg.includes('502') ? 'AI 服务暂时不可用(502)，请稍后重试' : errMsg.includes('timed out') ? 'AI 生成超时，请稍后重试' : '微调生成失败，请稍后重试',
    });
  }
});

// Three-stage pipeline
app.post('/api/generate/three-stage', authMiddleware, upload.single('image'), async (req, res) => {
  const imageUrl = req.file ? '/uploads/' + req.file.filename : req.body.imageUrl;
  if (!imageUrl) { res.status(400).json({ success: false, error: '需要图片' }); return; }
  const style = req.body.style || '现代简约';
  const roomDescription = req.body.roomDescription || '';
  const userId = (req as any).authUserId;
  const benefits = pointsManager.getBenefits(userId);
  const userLevel = benefits.tier === 'free' ? 'free' : 'premium';
  const resolution = req.body.resolution || '1K';
  if (!pointsManager.isResolutionAvailable(userId, resolution)) {
    res.status(403).json({ success: false, error: `${benefits.labelCN}不支持${resolution}分辨率，请升级`, code: 'RESOLUTION_LOCKED' });
    return;
  }
  const styleName = style.replace(/\s+interior\s*design\s*$/i, '').trim();
  if (!pointsManager.isStyleAvailable(userId, styleName)) {
    res.status(403).json({ success: false, error: '升级通行证解锁更多风格', code: 'STYLE_LOCKED' });
    return;
  }
  const pointsCost = pointsManager.calculateCost(resolution, 2);
  const spendCheck = await pointsManager.canSpend(userId, pointsCost);
  if (!spendCheck.allowed) { res.status(429).json({ success: false, error: '创想点不足', code: 'INSUFFICIENT_POINTS' }); return; }
  try {
    const structure = await extractStructureFromUrl(imageUrl, path.join(__dirname, '../uploads'));
    const aiDepth = await aiDepthAnalysis(imageUrl, PORT);
    const layoutLockPrompt = buildLayoutLockPrompt(structure, aiDepth);
    const roomType = req.body.roomType || 'living_room';
    const result = await executeThreeStagePipeline(imageUrl, style, roomDescription, layoutLockPrompt, userLevel, roomType);
    const spendResult = await pointsManager.spend(userId, pointsCost, 'three-stage-pipeline');
    pointsManager.recordGeneration(userId);
    res.json({ success: true, ...result, pointsCost, remainingPoints: spendResult.remaining });
  } catch (e: any) { const msg = (e.message || '').substring(0, 200); res.status(500).json({ success: false, error: msg.includes('502') ? 'AI 服务暂时不可用(502)，请稍后重试' : msg.includes('timed out') ? 'AI 生成超时，请稍后重试' : '生成失败，请稍后重试' }); }
});

// Refinement (Stage 3)
app.post('/api/refine/ultra', authMiddleware, async (req, res) => {
  const { imageUrl, style, refinementOptions } = req.body;
  if (!imageUrl) { res.status(400).json({ success: false, error: '需要图片' }); return; }
  const userId = (req as any).authUserId;
  const options: RefinementOptions = refinementOptions || { upscale: true, detailEnhance: true, realisticTexture: true, lightingPolish: true, targetResolution: '2K' };
  const benefits = pointsManager.getBenefits(userId);
  if (benefits.tier === 'free') {
    res.status(403).json({ success: false, error: '免费版不支持精修功能，请升级通行证', code: 'REFINEMENT_LOCKED' });
    return;
  }
  if (!pointsManager.isResolutionAvailable(userId, options.targetResolution || '2K')) {
    res.status(403).json({ success: false, error: `${benefits.labelCN}不支持${options.targetResolution}分辨率，请升级`, code: 'RESOLUTION_LOCKED' });
    return;
  }
  const cost = calculateRefinementCost(options);
  const spendCheck = await pointsManager.canSpend(userId, cost);
  if (!spendCheck.allowed) { res.status(429).json({ success: false, error: '创想点不足', code: 'INSUFFICIENT_POINTS' }); return; }
  try {
    const userLevel = benefits.tier === 'free' ? 'free' : 'premium';
    const roomType = req.body.roomType || 'living_room';
    const result = await executeRefinement(imageUrl, style || '现代简约', options, userLevel, roomType);
    const spendResult = await pointsManager.spend(userId, cost, 'refinement-ultra');
    res.json({ success: true, ...result, pointsCost: cost, remainingPoints: spendResult.remaining });
  } catch (e: any) { const msg = (e.message || '').substring(0, 200); res.status(500).json({ success: false, error: msg.includes('502') ? 'AI 服务暂时不可用(502)，请稍后重试' : msg.includes('timed out') ? 'AI 生成超时，请稍后重试' : '精修失败，请稍后重试' }); }
});

// Whole-house unification
app.post('/api/whole-house/analyze', authMiddleware, upload.array('images', 8), async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const roomTypes = Array.isArray(req.body.roomTypes) ? req.body.roomTypes : [req.body.roomTypes];
  if (!files || files.length === 0) { res.status(400).json({ success: false, error: '需要上传至少一个房间照片' }); return; }
  const rooms: RoomUpload[] = files.map((f, i) => ({
    id: 'room-' + i,
    imageUrl: '/uploads/' + f.filename,
    roomType: roomTypes[i] || '客厅',
    roomTypeEn: roomTypes[i] === '卧室' ? 'bedroom' : roomTypes[i] === '厨房' ? 'kitchen' : roomTypes[i] === '卫生间' ? 'bathroom' : roomTypes[i] === '书房' ? 'study' : roomTypes[i] === '餐厅' ? 'dining' : roomTypes[i] === '阳台' ? 'balcony' : roomTypes[i] === '儿童房' ? 'kids_room' : 'living_room'
  }));
  res.json({ success: true, rooms });
});

app.post('/api/whole-house/generate', authMiddleware, async (req, res) => {
  try {
    const { rooms, style, resolution } = req.body;
    const userId = (req as any).authUserId;
    if (!rooms || rooms.length === 0) { res.status(400).json({ success: false, error: '需要房间数据' }); return; }
    if (rooms.length > 8) { res.status(400).json({ success: false, error: '单次全屋生成最多支持8个房间' }); return; }
    const benefits = pointsManager.getBenefits(userId);
    if (benefits.tier === 'free') {
      res.status(403).json({ success: false, error: '全屋统一为通行证专属功能，请升级', code: 'WHOLE_HOUSE_LOCKED' });
      return;
    }
    if (!pointsManager.isResolutionAvailable(userId, resolution || '1K')) {
      res.status(403).json({ success: false, error: `${benefits.labelCN}不支持${resolution}分辨率，请升级`, code: 'RESOLUTION_LOCKED' });
      return;
    }
    const styleName = (style || '现代简约').replace(/\s+interior\s*design\s*$/i, '').trim();
    if (!pointsManager.isStyleAvailable(userId, styleName)) {
      res.status(403).json({ success: false, error: '升级通行证解锁更多风格', code: 'STYLE_LOCKED' });
      return;
    }
    const cost = calculateWholeHouseCost(rooms.length, resolution || '1K');
    const spendCheck = await pointsManager.canSpend(userId, cost);
    if (!spendCheck.allowed) { res.status(429).json({ success: false, error: '创想点不足', code: 'INSUFFICIENT_POINTS' }); return; }
    const userLevel = benefits.tier === 'free' ? 'free' : 'premium';
    const result = await executeWholeHouseGeneration(rooms, style || '现代简约', resolution || '1K', userLevel);
    const spendResult = await pointsManager.spend(userId, cost, 'whole-house-generate');
    pointsManager.recordGeneration(userId);
    res.json({ success: true, ...result, pointsCost: cost, remainingPoints: spendResult.remaining, roomCount: rooms.length, discount: rooms.length >= 3 ? '8折' : rooms.length >= 2 ? '9折' : '无折扣' });
  } catch (e: any) { const msg = (e.message || '').substring(0, 200); res.status(500).json({ success: false, error: msg.includes('502') ? 'AI 服务暂时不可用(502)，请稍后重试' : msg.includes('timed out') ? 'AI 生成超时，请稍后重试' : '全屋生成失败，请稍后重试' }); }
});

app.get('/api/whole-house/room-types', (_req, res) => {
  res.json({ success: true, roomTypes: getRoomTypeOptions() });
});

// 前端页面：统一读取根目录最终稿，避免 Vite 与 Express 出现两个首页版本。
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => {
  console.log(`[栖界AI] Server running on port ${PORT}`);
  console.log(`[栖界AI] Architecture: Hybrid AI Gateway (GPT-Image → Gemini3 → 豆包)`);
});
