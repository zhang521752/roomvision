import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// AI Gateway imports
import { generate, twoStageGenerate } from '../server/services/ai-gateway';
import { queueManager } from '../server/services/queue-manager';
import { costController } from '../server/services/cost-controller';
import { extractStructureFromUrl, aiDepthAnalysis, buildLayoutLockPrompt } from '../server/services/layout-lock';
import { getInspirations, getInspirationById, getAvailableStyles, getAvailableRoomTypes } from '../server/services/inspiration-feed';
import { pointsManager, TIER_BENEFITS, POINT_PACKAGES, RENOVATION_PASSES, RESOLUTION_COSTS, FREE_STYLES } from '../server/services/points-system';
import { authManager } from '../server/services/auth';
import { generateCodes, redeemCode, getCodeStats, getCodesByBatch, getCodesUsedByUser } from '../server/services/activation-code';
import { buildStage1Prompt, buildStage2Prompt, buildStage3Prompt, calculateRefinementCost, getRefinementDescription, executeThreeStagePipeline, executeRefinement, type RefinementOptions } from '../server/services/three-stage-pipeline';
import { generateStyleLanguage, buildUnifiedRoomPrompt, calculateWholeHouseCost, getRoomTypeOptions, executeWholeHouseGeneration, type RoomUpload } from '../server/services/whole-house';
import { buildPrompt, STYLE_MAP, type PromptInput } from '../server/services/prompt-engine';

// 创建Express应用
const app = express();

// CORS配置
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// 文件上传配置 - 使用内存存储
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      cb(new Error('仅支持 JPG、PNG、WebP 格式的图片'));
      return;
    }
    cb(null, true);
  },
});

// 认证中间件
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

// API路由
// 健康检查
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: '栖界AI API is running on Vercel',
    architecture: 'Hybrid AI Gateway (GPT-Image → Gemini3 → 豆包)',
    version: '2.0.0',
  });
});

// 认证相关
app.post('/auth/register', async (req, res) => {
  const { phone, password, nickname } = req.body;
  const result = await authManager.register(phone, password, nickname);
  if (result.success) {
    const gift = pointsManager.claimRegistrationGift(result.user!.id);
    res.json({ success: true, token: result.token, user: result.user, giftPoints: gift.points });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  const result = await authManager.login(phone, password);
  if (result.success) {
    pointsManager.dailyRecovery(result.user!.id);
    const pointsInfo = pointsManager.getUserInfo(result.user!.id);
    res.json({ success: true, token: result.token, user: result.user, pointsInfo });
  } else {
    res.status(401).json({ success: false, error: result.error });
  }
});

app.get('/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ success: false, error: '未登录' });
    return;
  }
  const result = authManager.verifyToken(token);
  if (result.valid) {
    const user = authManager.getUserById(result.userId!);
    const pointsInfo = pointsManager.getUserInfo(result.userId!);
    res.json({ success: true, user, pointsInfo });
  } else {
    res.status(401).json({ success: false, error: '登录已过期' });
  }
});

app.post('/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) authManager.logout(token);
  res.json({ success: true });
});

// 图片分析
app.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      res.status(400).json({ error: '缺少必要参数: imageUrl' });
      return;
    }

    const baseURL = process.env.OPENAI_BASE_URL;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!baseURL || !apiKey) {
      res.json({
        success: true,
        analysis: {
          roomType: '客厅',
          roomSize: '中等',
          lighting: '自然采光良好',
          currentStyle: '现代简约',
          description: '这是一个中等大小的客厅，采光良好，目前采用现代简约风格装修。',
        },
      });
      return;
    }

    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${process.env.VERCEL_URL || 'localhost'}${imageUrl}`;

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
                text: `你是一位专业的室内设计师，请仔细分析这张房间照片，识别房间类型、面积、采光情况、当前风格等信息，以JSON格式返回。`,
              },
              { type: 'image_url', image_url: { url: fullImageUrl } },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { roomType: '客厅', roomSize: '中等', lighting: '自然采光良好', currentStyle: '现代简约' };

    res.json({ success: true, analysis });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '房间识别失败，请重试' });
  }
});

// 图片生成
app.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { imageUrl, roomType, style, atmosphere, materials, lighting, budget, mode, customPrompt, styleReferenceImage, resolution, imageCount } = req.body;

    if (!roomType || !style) {
      res.status(400).json({ error: '缺少必要参数: roomType, style' });
      return;
    }

    const userId = (req as any).authUserId;
    const pointsCost = pointsManager.calculateCost(resolution || '1K', imageCount || 1);
    const benefits = pointsManager.getBenefits(userId);

    const spendCheck = await pointsManager.canSpend(userId, pointsCost);
    if (!spendCheck.allowed) {
      res.status(429).json({ success: false, error: spendCheck.reason, code: 'INSUFFICIENT_POINTS' });
      return;
    }

    const userLevel = benefits.tier === 'pass_30day' ? 'premium' : benefits.tier === 'pass_7day' ? 'pro' : 'free';

    const result = await queueManager.enqueue(
      { promptInput: { roomType, style, atmosphere, materials: materials || [], lighting, budget, hasReferenceImage: !!imageUrl, customPrompt, styleReferenceImage }, userLevel, mode, imageUrl, styleReferenceImage },
      userLevel === 'premium' ? 'premium' : userLevel === 'pro' ? 'pro' : 'free',
      async (payload) => generate(payload),
    );

    const spendResult = await pointsManager.spend(userId, pointsCost, `generate ${resolution}x${result.images.length}`);
    pointsManager.recordGeneration(userId);

    res.json({ success: true, ...result, pointsCost, remainingPoints: spendResult.remaining, tier: benefits.tier });
  } catch (error: any) {
    res.status(500).json({ success: false, error: '生成失败，请稍后重试' });
  }
});

// 灵感库
app.get('/inspirations', (req, res) => {
  const style = req.query.style as string | undefined;
  const roomType = req.query.roomType as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  const items = getInspirations({ style, roomType, limit, offset });
  res.json({ success: true, items, total: items.length });
});

app.get('/inspirations/styles', (_req, res) => {
  res.json({ success: true, styles: getAvailableStyles() });
});

app.get('/inspirations/rooms', (_req, res) => {
  res.json({ success: true, roomTypes: getAvailableRoomTypes() });
});

// 积分相关
app.get('/points/:userId', authMiddleware, (req, res) => {
  const userId = (req as any).authUserId;
  const info = pointsManager.getUserInfo(userId);
  res.json({ success: true, ...info });
});

app.post('/points/redeem-code', authMiddleware, (req, res) => {
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
    res.json({ success: true, type: 'points', pointsAdded: result.points, total: pointsResult.total, message: `成功兑换 ${result.points} 创想点` });
    return;
  }

  if (result.type === 'pass' && result.passType) {
    const passResult = pointsManager.activatePass(userId, result.passType);
    const passLabel = result.passType === 'pass_30day' ? '30日装修通行证' : '7日装修通行证';
    res.json({ success: true, type: 'pass', passType: result.passType, expiresAt: passResult.expiresAt, message: `成功激活${passLabel}` });
    return;
  }

  res.status(500).json({ success: false, error: '激活码处理异常' });
});

// 配置信息
app.get('/packages', (_req, res) => {
  res.json({ success: true, packages: POINT_PACKAGES });
});

app.get('/passes', (_req, res) => {
  res.json({ success: true, passes: RENOVATION_PASSES });
});

app.get('/benefits', (_req, res) => {
  res.json({ success: true, tiers: TIER_BENEFITS, freeStyles: FREE_STYLES, resolutions: RESOLUTION_COSTS });
});

// Vercel Serverless Function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 将Vercel请求适配到Express
  await new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) reject(err);
      else resolve(undefined);
    });
  });
}