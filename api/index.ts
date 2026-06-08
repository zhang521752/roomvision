import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';

// 创建Express应用
const app = express();

// CORS配置
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// 简化版API - 仅提供基本功能
// 健康检查
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: '栖界AI API is running on Vercel',
    version: '2.0.0',
  });
});

// 灵感库 - 使用本地图片
const STYLE_IMAGES: Record<string, string> = {
  '现代简约': '/styles/现代简约.png',
  '北欧': '/styles/北欧风格.png',
  '工业风': '/styles/工业风格.png',
  '日式': '/styles/日式和风.png',
  '极简主义': '/styles/极简主义.png',
  '波西米亚': '/styles/波西米亚.png',
  '装饰艺术': '/styles/装饰艺术.png',
  '轻奢': '/styles/轻奢风格.png',
  '乡村田园': '/styles/乡村田园.png',
  '新中式': '/styles/新中式.png',
  '原木风': '/styles/日式和风.png',
  '奶油风': '/styles/奶油风.png',
};

const INSPIRATIONS = [
  { id: 'insp-001', imageUrl: '/styles/现代简约.png', style: '现代简约', roomType: '客厅', title: '现代简约客厅', description: '简洁线条与中性色调' },
  { id: 'insp-002', imageUrl: '/styles/北欧风格.png', style: '北欧', roomType: '客厅', title: '北欧温馨客厅', description: '白色基调搭配天然木质' },
  { id: 'insp-003', imageUrl: '/styles/北欧风01.png', style: '北欧', roomType: '客厅', title: '北欧风客厅01', description: 'Hygge式的温暖' },
  { id: 'insp-004', imageUrl: '/styles/北欧风02.png', style: '北欧', roomType: '卧室', title: '北欧风卧室', description: '简约舒适' },
  { id: 'insp-005', imageUrl: '/styles/新中式.png', style: '新中式', roomType: '客厅', title: '新中式客厅', description: '东方韵味与现代结合' },
  { id: 'insp-006', imageUrl: '/styles/新中式01.png', style: '新中式', roomType: '客厅', title: '新中式客厅01', description: '传统元素现代演绎' },
  { id: 'insp-007', imageUrl: '/styles/工业风格.png', style: '工业风', roomType: '客厅', title: '工业风客厅', description: '裸露材质与金属元素' },
  { id: 'insp-008', imageUrl: '/styles/工业风01.png', style: '工业风', roomType: '客厅', title: '工业风客厅01', description: '复古工业感' },
  { id: 'insp-009', imageUrl: '/styles/日式和风.png', style: '日式', roomType: '客厅', title: '日式客厅', description: '禅意与自然材质' },
  { id: 'insp-010', imageUrl: '/styles/日式01.png', style: '日式', roomType: '卧室', title: '日式卧室', description: '榻榻米与木质' },
  { id: 'insp-011', imageUrl: '/styles/极简主义.png', style: '极简主义', roomType: '客厅', title: '极简客厅', description: '少即是多' },
  { id: 'insp-012', imageUrl: '/styles/奶油风.png', style: '奶油风', roomType: '客厅', title: '奶油风客厅', description: '温暖柔和色调' },
  { id: 'insp-013', imageUrl: '/styles/奶油风01.png', style: '奶油风', roomType: '卧室', title: '奶油风卧室', description: '温馨治愈' },
  { id: 'insp-014', imageUrl: '/styles/乡村田园.png', style: '乡村田园', roomType: '客厅', title: '乡村田园客厅', description: '自然质朴' },
  { id: 'insp-015', imageUrl: '/styles/乡村田园01.png', style: '乡村田园', roomType: '卧室', title: '田园卧室', description: '花卉与木质' },
  { id: 'insp-016', imageUrl: '/styles/原木风01.png', style: '原木风', roomType: '客厅', title: '原木风客厅', description: '天然木质温暖' },
  { id: 'insp-017', imageUrl: '/styles/波西米亚.png', style: '波西米亚', roomType: '客厅', title: '波西米亚客厅', description: '自由奔放风格' },
  { id: 'insp-018', imageUrl: '/styles/装饰艺术.png', style: '装饰艺术', roomType: '客厅', title: '装饰艺术客厅', description: '华丽复古' },
  { id: 'insp-019', imageUrl: '/styles/轻奢风格.png', style: '轻奢', roomType: '客厅', title: '轻奢客厅', description: '精致优雅' },
  { id: 'insp-020', imageUrl: '/styles/极简主义01.png', style: '极简主义', roomType: '卧室', title: '极简卧室', description: '纯净空间' },
];

// 灵感库API
app.get('/inspirations', (req, res) => {
  const style = req.query.style as string | undefined;
  const roomType = req.query.roomType as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  
  let items = INSPIRATIONS;
  if (style) {
    items = items.filter(item => item.style === style);
  }
  if (roomType) {
    items = items.filter(item => item.roomType === roomType);
  }
  items = items.slice(0, limit);
  
  res.json({ success: true, items, total: items.length });
});

app.get('/inspirations/styles', (_req, res) => {
  const styles = Object.keys(STYLE_IMAGES);
  res.json({ success: true, styles });
});

app.get('/inspirations/rooms', (_req, res) => {
  const roomTypes = ['客厅', '卧室', '厨房', '餐厅', '书房', '卫生间', '阳台'];
  res.json({ success: true, roomTypes });
});

// 模拟用户存储
const usersStore: Map<string, any> = new Map();
const sessionsStore: Map<string, any> = new Map();

// 认证相关
app.post('/auth/register', async (req, res) => {
  const { phone, password, nickname } = req.body;
  if (!phone || phone.length < 6) {
    res.status(400).json({ success: false, error: '请输入有效的手机号' });
    return;
  }
  const userId = `user_${Date.now()}`;
  const token = `token_${Math.random().toString(36).substring(2)}`;
  const user = {
    id: userId,
    phone,
    nickname: nickname || '用户',
    avatar: '🏠',
    createdAt: Date.now(),
  };
  usersStore.set(userId, user);
  sessionsStore.set(token, { userId, createdAt: Date.now(), expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  res.json({ success: true, token, user, giftPoints: 100 });
});

app.post('/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  // 简化版：任意手机号都可登录
  const userId = `user_${phone}`;
  const token = `token_${Math.random().toString(36).substring(2)}`;
  const user = usersStore.get(userId) || {
    id: userId,
    phone,
    nickname: '用户',
    avatar: '🏠',
    createdAt: Date.now(),
  };
  usersStore.set(userId, user);
  sessionsStore.set(token, { userId, createdAt: Date.now(), expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  res.json({ success: true, token, user, pointsInfo: { points: 100, tier: 'free' } });
});

app.get('/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ success: false, error: '未登录' });
    return;
  }
  const session = sessionsStore.get(token);
  if (!session || session.expiresAt < Date.now()) {
    res.status(401).json({ success: false, error: '登录已过期' });
    return;
  }
  const user = usersStore.get(session.userId);
  res.json({ success: true, user, pointsInfo: { points: 100, tier: 'free' } });
});

// 图片分析 - 模拟返回
app.post('/analyze', (req, res) => {
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
});

// 图片生成 - 模拟返回（实际需要API key）
app.post('/generate', (req, res) => {
  const { roomType, style } = req.body;
  
  // 使用配置的API进行实际生成
  const baseURL = process.env.IMAGE2_BASE_URL || process.env.OPENAI_BASE_URL;
  const apiKey = process.env.IMAGE2_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!baseURL || !apiKey) {
    // 没有API配置时返回模拟数据
    res.json({
      success: true,
      images: [
        { url: '/styles/' + (STYLE_IMAGES[style] || '现代简约.png').split('/').pop(), prompt: `${style} ${roomType}` }
      ],
      pointsCost: 10,
      remainingPoints: 90,
      tier: 'free',
    });
    return;
  }
  
  // 实际调用API
  res.json({
    success: true,
    message: 'API配置正确，可以进行实际生成',
    config: { baseURL: baseURL.substring(0, 30) + '...', hasApiKey: true },
  });
});

// 积分相关
app.get('/points/:userId', (req, res) => {
  res.json({ success: true, points: 100, tier: 'free', dailyRecovery: 10 });
});

app.post('/points/redeem-code', (req, res) => {
  const { code } = req.body;
  res.json({ success: true, type: 'points', pointsAdded: 50, total: 150, message: '成功兑换 50 创想点' });
});

// 配置信息
app.get('/packages', (_req, res) => {
  res.json({ success: true, packages: [{ id: 'pkg_100', points: 100, price: 9.9 }] });
});

app.get('/passes', (_req, res) => {
  res.json({ success: true, passes: [{ id: 'pass_7day', days: 7, price: 19.9 }] });
});

app.get('/benefits', (_req, res) => {
  res.json({ success: true, tiers: { free: { dailyPoints: 10 }, premium: { dailyPoints: 50 } } });
});

// Vercel Serverless Function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) reject(err);
      else resolve(undefined);
    });
  });
}