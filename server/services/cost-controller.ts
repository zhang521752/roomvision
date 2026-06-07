export type ProviderType = 'gpt-image' | 'nanobananapro' | 'image2-backup' | 'mock';

export interface CostRecord {
  id: string;
  provider: ProviderType;
  quality: string;
  userId: string;
  userLevel: string;
  imageCount: number;
  cost: number;
  timestamp: number;
  promptLength: number;
  duration: number;
}

const COST_PER_IMAGE: Record<ProviderType, Record<string, number>> = {
  'gpt-image': {
    standard: 0.02,
    ultra: 0.08,
    high: 0.04,
    medium: 0.04,
    low: 0.02,
  },
  'nanobananapro': {
    standard: 0.015,
    ultra: 0.06,
    high: 0.03,
    medium: 0.03,
    low: 0.015,
  },
  'image2-backup': {
    standard: 0.02,
    ultra: 0.07,
    high: 0.035,
    medium: 0.035,
    low: 0.02,
  },
  'mock': {
    ultra: 0,
    high: 0,
    medium: 0,
    low: 0,
  },
};

const FREE_USER_LIMITS = {
  dailyGenerations: 5,
  maxResolution: '1024x1024',
  allowedProviders: ['gpt-image', 'nanobananapro', 'image2-backup', 'mock'] as ProviderType[],
  maxCostPerGeneration: 0.1,
};

const PRO_USER_LIMITS = {
  dailyGenerations: 50,
  maxResolution: '1792x1024',
  allowedProviders: ['gpt-image', 'nanobananapro', 'image2-backup', 'mock'] as ProviderType[],
  maxCostPerGeneration: 0.5,
};

export class CostController {
  private records: CostRecord[] = [];
  private dailyCounts: Record<string, number> = {};
  private todayDate = new Date().toDateString();
  private recordCounter = 0;

  calculateCost(provider: ProviderType, quality: string, imageCount: number): number {
    const providerCosts = COST_PER_IMAGE[provider];
    const costPerImage = providerCosts[quality] || providerCosts.medium || 0;
    return +(costPerImage * imageCount).toFixed(4);
  }

  canGenerate(userId: string, userLevel: string, provider: ProviderType, estimatedCost: number): {
    allowed: boolean;
    reason?: string;
  } {
    this.checkDayReset();

    const userKey = userId;
    const dailyCount = this.dailyCounts[userKey] || 0;

    if (userLevel === 'free') {
      if (dailyCount >= FREE_USER_LIMITS.dailyGenerations) {
        return { allowed: false, reason: '今日免费次数已用完，请升级到 Pro' };
      }
      if (!FREE_USER_LIMITS.allowedProviders.includes(provider)) {
        return { allowed: false, reason: '免费用户不支持此 Provider，请升级到 Pro' };
      }
      if (estimatedCost > FREE_USER_LIMITS.maxCostPerGeneration) {
        return { allowed: false, reason: '超出免费用户的单次费用限制' };
      }
    }

    if (userLevel === 'pro' || userLevel === 'premium') {
      if (dailyCount >= PRO_USER_LIMITS.dailyGenerations) {
        return { allowed: false, reason: '今日生成次数已达上限' };
      }
      if (estimatedCost > PRO_USER_LIMITS.maxCostPerGeneration) {
        return { allowed: false, reason: '超出单次费用限制' };
      }
    }

    return { allowed: true };
  }

  recordUsage(record: Omit<CostRecord, 'id'>): CostRecord {
    this.checkDayReset();

    const fullRecord: CostRecord = {
      ...record,
      id: `cost-${Date.now()}-${++this.recordCounter}`,
    };

    this.records.push(fullRecord);

    // Keep only last 10000 records to prevent memory leak
    if (this.records.length > 10000) {
      this.records = this.records.slice(-5000);
    }

    const userKey = record.userId;
    this.dailyCounts[userKey] = (this.dailyCounts[userKey] || 0) + 1;

    console.log(`[Cost] ${fullRecord.id}: ${record.provider}/${record.quality} x${record.imageCount} = $${record.cost} (${record.userId}/${record.userLevel})`);

    return fullRecord;
  }

  getDailyStats() {
    this.checkDayReset();
    return {
      date: this.todayDate,
      totalCost: +this.records
        .filter(r => new Date(r.timestamp).toDateString() === this.todayDate)
        .reduce((sum, r) => sum + r.cost, 0)
        .toFixed(4),
      dailyCounts: { ...this.dailyCounts },
      byProvider: this.getCostByProvider(),
      byUserLevel: this.getCostByUserLevel(),
    };
  }

  private getCostByProvider() {
    const result: Record<string, { count: number; cost: number }> = {};
    const todayRecords = this.records.filter(r => new Date(r.timestamp).toDateString() === this.todayDate);
    for (const r of todayRecords) {
      if (!result[r.provider]) {
        result[r.provider] = { count: 0, cost: 0 };
      }
      result[r.provider].count += r.imageCount;
      result[r.provider].cost += r.cost;
    }
    return result;
  }

  private getCostByUserLevel() {
    const result: Record<string, { count: number; cost: number }> = {};
    const todayRecords = this.records.filter(r => new Date(r.timestamp).toDateString() === this.todayDate);
    for (const r of todayRecords) {
      if (!result[r.userLevel]) {
        result[r.userLevel] = { count: 0, cost: 0 };
      }
      result[r.userLevel].count += r.imageCount;
      result[r.userLevel].cost += r.cost;
    }
    return result;
  }

  private checkDayReset() {
    const today = new Date().toDateString();
    if (today !== this.todayDate) {
      this.todayDate = today;
      this.dailyCounts = {};
      console.log('[Cost] Daily reset');
    }
  }

  getRemainingGenerations(userId: string, userLevel: string): number {
    this.checkDayReset();
    const limits = userLevel === 'free' ? FREE_USER_LIMITS : PRO_USER_LIMITS;
    const used = this.dailyCounts[userId] || 0;
    return Math.max(0, limits.dailyGenerations - used);
  }

  getAllRecords(): CostRecord[] {
    return [...this.records];
  }
}

export const costController = new CostController();
