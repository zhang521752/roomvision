// Points System - 创想点积分系统
// 核心货币系统：积分获取、消耗、等级权益控制

// ========== 用户等级 ==========
export type UserTier = 'free' | 'pass_7day' | 'pass_30day';

export interface UserPoints {
  userId: string;
  tier: UserTier;
  points: number;           // 当前积分
  maxCapacity: number;      // 积分容量上限
  dailyRecovery: number;    // 每日恢复量
  lastRecoveryDate: string; // 上次恢复日期
  totalEarned: number;      // 累计获得
  totalSpent: number;       // 累计消耗
  passExpiresAt: number | null; // 通行证过期时间（timestamp）
  registeredAt: number;     // 注册时间
  registrationGiftClaimed: boolean;
}

// ========== 分辨率积分消耗 ==========
export interface ResolutionCost {
  resolution: string;
  label: string;
  points: number;
  aiCostCNY: number;
  width: number;
  height: number;
}

export const RESOLUTION_COSTS: ResolutionCost[] = [
  { resolution: '1K', label: '1K 标清', points: 5, aiCostCNY: 0.05, width: 1024, height: 1024 },
  { resolution: '2K', label: '2K 高清', points: 20, aiCostCNY: 0.10, width: 1536, height: 1024 },
  { resolution: '4K', label: '4K 超清', points: 50, aiCostCNY: 0.20, width: 2048, height: 1536 },
];

// ========== 等级权益表 ==========
export interface TierBenefits {
  tier: UserTier;
  label: string;
  labelCN: string;
  dailyRecovery: number;
  maxCapacity: number;
  availableResolutions: string[];
  aiModel: string;
  aiQuality: string;
  allStyles: boolean;
  furnitureDensity: boolean;
  lightingControls: boolean;
  colorToneControls: boolean;
  customPrompt: boolean;
  refinement: number; // 每日微调次数，-1 表示无限
  watermark: boolean;
  queuePriority: number; // 1=最高, 2=中, 3=最低
  historyStorage: 'session' | 'permanent';
  dailyGenerations: number; // 每日生成上限，-1 表示无限
}

export const TIER_BENEFITS: Record<UserTier, TierBenefits> = {
  free: {
    tier: 'free',
    label: 'Free',
    labelCN: '免费版',
    dailyRecovery: 10,
    maxCapacity: 20,
    availableResolutions: ['1K'],
    aiModel: 'GPT-Image-2 Standard',
    aiQuality: 'standard',
    allStyles: false,
    furnitureDensity: false,
    lightingControls: false,
    colorToneControls: false,
    customPrompt: false,
    refinement: 0,
    watermark: true,
    queuePriority: 3,
    historyStorage: 'session',
    dailyGenerations: 2,
  },
  pass_7day: {
    tier: 'pass_7day',
    label: '7-Day Pass',
    labelCN: '7日装修通行证',
    dailyRecovery: 100,
    maxCapacity: 500,
    availableResolutions: ['1K', '2K'],
    aiModel: 'GPT-Image-2 HD',
    aiQuality: 'high',
    allStyles: true,
    furnitureDensity: true,
    lightingControls: true,
    colorToneControls: true,
    customPrompt: true,
    refinement: 20,
    watermark: false,
    queuePriority: 2,
    historyStorage: 'permanent',
    dailyGenerations: -1,
  },
  pass_30day: {
    tier: 'pass_30day',
    label: '30-Day Pass',
    labelCN: '30日装修通行证',
    dailyRecovery: 200,
    maxCapacity: 1000,
    availableResolutions: ['1K', '2K', '4K'],
    aiModel: 'GPT-Image-2 HD',
    aiQuality: 'ultra',
    allStyles: true,
    furnitureDensity: true,
    lightingControls: true,
    colorToneControls: true,
    customPrompt: true,
    refinement: -1,
    watermark: false,
    queuePriority: 1,
    historyStorage: 'permanent',
    dailyGenerations: -1,
  },
};

// ========== 免费版可用风格 ==========
export const FREE_STYLES = ['奶油风', '现代简约', '原木风', '北欧', '工业风', '日式', '自定义'];

// ========== 积分充值套餐 ==========
export interface PointPackage {
  id: string;
  points: number;
  priceCNY: number;
  priceLabel: string;
  bonus: number; // 赠送积分
  popular: boolean;
}

export const POINT_PACKAGES: PointPackage[] = [
  { id: 'pkg_100', points: 100, priceCNY: 9.9, priceLabel: '¥9.9', bonus: 0, popular: false },
  { id: 'pkg_300', points: 300, priceCNY: 25, priceLabel: '¥25', bonus: 20, popular: false },
  { id: 'pkg_700', points: 700, priceCNY: 49, priceLabel: '¥49', bonus: 80, popular: true },
  { id: 'pkg_1500', points: 1500, priceCNY: 99, priceLabel: '¥99', bonus: 250, popular: false },
];

// ========== 装修通行证 ==========
export interface RenovationPass {
  id: string;
  tier: UserTier;
  label: string;
  priceCNY: number;
  priceLabel: string;
  durationDays: number;
  description: string;
  features: string[];
}

export const RENOVATION_PASSES: RenovationPass[] = [
  {
    id: 'pass_7day',
    tier: 'pass_7day',
    label: '7日装修通行证',
    priceCNY: 29,
    priceLabel: '¥29',
    durationDays: 7,
    description: '装修冲刺期，7天全力输出设计方案',
    features: [
      '每日 100 创想点恢复',
      '1K + 2K 分辨率',
      '全部 12 种风格',
      '自定义需求提示词',
      '每日 20 次微调',
      '无水印',
      '优先队列',
      '历史永久保存',
    ],
  },
  {
    id: 'pass_30day',
    tier: 'pass_30day',
    label: '30日装修通行证',
    priceCNY: 79,
    priceLabel: '¥79',
    durationDays: 30,
    description: '全周期覆盖，从灵感到定稿一站式搞定',
    features: [
      '每日 200 创想点恢复',
      '1K + 2K + 4K 全分辨率',
      '全部 12 种风格',
      '自定义需求提示词',
      '无限微调',
      '无水印',
      '最高优先队列',
      '历史永久保存',
    ],
  },
];

// ========== 积分管理器 ==========
// 使用内存存储（生产环境应替换为数据库）
const usersStore: Map<string, UserPoints> = new Map();

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export class PointsManager {
  private dailyGenerationsStore: Map<string, { date: string; count: number }> = new Map();
  private userLocks: Map<string, Promise<any>> = new Map();

  private withLock<T>(userId: string, fn: () => T): Promise<T> {
    const prev = this.userLocks.get(userId) || Promise.resolve();
    const next = prev.then(() => fn(), () => fn());
    this.userLocks.set(userId, next);
    next.finally(() => {
      if (this.userLocks.get(userId) === next) {
        this.userLocks.delete(userId);
      }
    });
    return next;
  }

  canGenerateToday(userId: string): { allowed: boolean; remaining: number; limit: number } {
    const user = this.getOrCreateUser(userId);
    this.checkPassExpiry(user);
    const benefits = TIER_BENEFITS[user.tier];
    const today = getTodayStr();

    const record = this.dailyGenerationsStore.get(userId);
    const currentCount = (record && record.date === today) ? record.count : 0;

    if (benefits.dailyGenerations === -1) {
      return { allowed: true, remaining: -1, limit: -1 };
    }

    return {
      allowed: currentCount < benefits.dailyGenerations,
      remaining: Math.max(0, benefits.dailyGenerations - currentCount),
      limit: benefits.dailyGenerations,
    };
  }

  recordGeneration(userId: string): void {
    const today = getTodayStr();
    const record = this.dailyGenerationsStore.get(userId);
    if (record && record.date === today) {
      record.count++;
    } else {
      this.dailyGenerationsStore.set(userId, { date: today, count: 1 });
    }
  }

  getOrCreateUser(userId: string): UserPoints {
    if (!usersStore.has(userId)) {
      usersStore.set(userId, {
        userId,
        tier: 'free',
        points: 0,
        maxCapacity: TIER_BENEFITS.free.maxCapacity,
        dailyRecovery: TIER_BENEFITS.free.dailyRecovery,
        lastRecoveryDate: '',
        totalEarned: 0,
        totalSpent: 0,
        passExpiresAt: null,
        registeredAt: Date.now(),
        registrationGiftClaimed: false,
      });
    }
    return usersStore.get(userId)!;
  }

  /**
   * 领取注册奖励
   */
  claimRegistrationGift(userId: string): { success: boolean; points: number } {
    const user = this.getOrCreateUser(userId);
    if (user.registrationGiftClaimed) {
      return { success: false, points: 0 };
    }

    const giftPoints = 10;
    user.points = Math.min(user.points + giftPoints, user.maxCapacity);
    user.totalEarned += giftPoints;
    user.registrationGiftClaimed = true;

    return { success: true, points: giftPoints };
  }

  /**
   * 内部每日恢复（不加锁，由调用方保证锁已持有）
   */
  private _dailyRecoveryInternal(user: UserPoints): { recovered: number; currentPoints: number } {
    this.checkPassExpiry(user);
    const today = getTodayStr();

    if (user.lastRecoveryDate === today) {
      return { recovered: 0, currentPoints: user.points };
    }

    const benefits = TIER_BENEFITS[user.tier];
    const recovery = benefits.dailyRecovery;
    const before = user.points;
    if (user.points >= benefits.maxCapacity) {
      user.lastRecoveryDate = today;
      return { recovered: 0, currentPoints: user.points };
    }
    user.points = Math.min(user.points + recovery, benefits.maxCapacity);
    const recovered = user.points - before;
    user.lastRecoveryDate = today;
    user.totalEarned += recovered;

    return { recovered, currentPoints: user.points };
  }

  /**
   * 每日积分恢复（公开方法）
   */
  dailyRecovery(userId: string): { recovered: number; currentPoints: number } {
    const user = this.getOrCreateUser(userId);
    return this._dailyRecoveryInternal(user);
  }

  /**
   * 检查是否可以消耗积分（带锁）
   */
  async canSpend(userId: string, points: number): Promise<{ allowed: boolean; reason?: string }> {
    return this.withLock(userId, () => {
      const user = this.getOrCreateUser(userId);
      this._dailyRecoveryInternal(user);

      if (user.points < points) {
        return { allowed: false, reason: `创想点不足，需要 ${points} 点，当前 ${user.points} 点` };
      }

      return { allowed: true };
    });
  }

  /**
   * 消耗积分（带锁，防止竞态条件）
   */
  async spend(userId: string, points: number, reason: string): Promise<{ success: boolean; remaining: number }> {
    return this.withLock(userId, () => {
      const user = this.getOrCreateUser(userId);
      // Trigger daily recovery inside lock
      this._dailyRecoveryInternal(user);

      if (user.points < points) {
        return { success: false, remaining: user.points };
      }

      user.points -= points;
      user.totalSpent += points;
      console.log(`[Points] ${userId} spent ${points} points on ${reason}, remaining: ${user.points}`);

      return { success: true, remaining: user.points };
    });
  }

  /**
   * 原子化预留+扣费（防止 TOCTOU 竞态）
   * 生成前调用：检查并立即扣费
   */
  async reserveAndSpend(userId: string, points: number, reason: string): Promise<{ success: boolean; remaining: number; reason?: string }> {
    return this.withLock(userId, () => {
      const user = this.getOrCreateUser(userId);
      this._dailyRecoveryInternal(user);

      if (user.points < points) {
        return { success: false, remaining: user.points, reason: `创想点不足，需要 ${points} 点，当前 ${user.points} 点` };
      }

      user.points -= points;
      user.totalSpent += points;
      console.log(`[Points] ${userId} reserved ${points} points for ${reason}, remaining: ${user.points}`);

      return { success: true, remaining: user.points };
    });
  }

  /**
   * 退还积分（生成失败时调用）
   */
  refund(userId: string, points: number, reason: string): { success: boolean; total: number } {
    const user = this.getOrCreateUser(userId);
    user.points += points;
    user.totalSpent = Math.max(0, user.totalSpent - points);
    console.log(`[Points] ${userId} refunded ${points} points (${reason}), total: ${user.points}`);
    return { success: true, total: user.points };
  }

  /**
   * 充值积分
   */
  recharge(userId: string, points: number): { success: boolean; total: number } {
    const user = this.getOrCreateUser(userId);
    user.points += points;
    user.totalEarned += points;
    // 充值积分不受容量限制

    console.log(`[Points] ${userId} recharged ${points} points, total: ${user.points}`);
    return { success: true, total: user.points };
  }

  /**
   * 激活通行证
   */
  activatePass(userId: string, passId: string): { success: boolean; expiresAt: number } {
    const pass = RENOVATION_PASSES.find((p) => p.id === passId);
    if (!pass) {
      return { success: false, expiresAt: 0 };
    }

    const user = this.getOrCreateUser(userId);
    const expiresAt = Date.now() + pass.durationDays * 24 * 60 * 60 * 1000;

    user.tier = pass.tier;
    user.passExpiresAt = expiresAt;
    user.maxCapacity = TIER_BENEFITS[pass.tier].maxCapacity;
    user.dailyRecovery = TIER_BENEFITS[pass.tier].dailyRecovery;

    console.log(`[Points] ${userId} activated ${pass.label}, expires at ${new Date(expiresAt).toISOString()}`);
    return { success: true, expiresAt };
  }

  /**
   * 检查通行证是否过期
   */
  checkPassExpiry(user: UserPoints): boolean {
    if (user.tier === 'free') return false;

    if (user.passExpiresAt && Date.now() > user.passExpiresAt) {
      console.log(`[Points] ${user.userId} pass expired, reverting to free`);
      user.tier = 'free';
      user.passExpiresAt = null;
      user.maxCapacity = TIER_BENEFITS.free.maxCapacity;
      user.dailyRecovery = TIER_BENEFITS.free.dailyRecovery;
      // 积分不超新上限则保留
      if (user.points > user.maxCapacity) {
        user.points = user.maxCapacity;
      }
      return true;
    }

    return false;
  }

  /**
   * 获取用户权益
   */
  getBenefits(userId: string): TierBenefits {
    const user = this.getOrCreateUser(userId);
    this.checkPassExpiry(user);
    return TIER_BENEFITS[user.tier];
  }

  /**
   * 获取用户完整信息
   */
  getUserInfo(userId: string): UserPoints & { benefits: TierBenefits; resolutionCosts: ResolutionCost[]; dailyGenerations: { allowed: boolean; remaining: number; limit: number } } {
    const user = this.getOrCreateUser(userId);
    this.dailyRecovery(userId);
    this.checkPassExpiry(user);

    const benefits = TIER_BENEFITS[user.tier];
    const availableResolutions = RESOLUTION_COSTS.filter((r) =>
      benefits.availableResolutions.includes(r.resolution),
    );

    return { ...user, benefits, resolutionCosts: availableResolutions, dailyGenerations: this.canGenerateToday(userId) };
  }

  /**
   * 计算生成消耗的积分
   */
  calculateCost(resolution: string, imageCount: number = 1): number {
    const res = RESOLUTION_COSTS.find((r) => r.resolution === resolution);
    if (!res) return 5 * imageCount;
    return res.points * imageCount;
  }

  /**
   * 检查功能是否可用
   */
  isFeatureAvailable(userId: string, feature: keyof TierBenefits): boolean {
    const benefits = this.getBenefits(userId);
    const val = benefits[feature];
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    return true;
  }

  /**
   * 检查风格是否可用
   */
  isStyleAvailable(userId: string, styleName: string): boolean {
    const benefits = this.getBenefits(userId);
    if (benefits.allStyles) return true;
    return FREE_STYLES.includes(styleName);
  }

  /**
   * 检查分辨率是否可用
   */
  isResolutionAvailable(userId: string, resolution: string): boolean {
    const benefits = this.getBenefits(userId);
    return benefits.availableResolutions.includes(resolution);
  }

  /**
   * 获取所有用户统计（管理用）
   */
  getStats() {
    let totalUsers = 0;
    let freeUsers = 0;
    let passUsers = 0;
    let totalPointsInCirculation = 0;

    usersStore.forEach((user) => {
      totalUsers++;
      totalPointsInCirculation += user.points;
      if (user.tier === 'free') freeUsers++;
      else passUsers++;
    });

    return { totalUsers, freeUsers, passUsers, totalPointsInCirculation };
  }
}

export const pointsManager = new PointsManager();
