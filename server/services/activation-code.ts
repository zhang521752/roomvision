// Activation Code System - 爱发电激活码系统
// 用户在爱发电购买商品后获得激活码，在应用中兑换积分或通行证

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ========== 激活码类型 ==========
export interface ActivationCode {
  code: string;             // 激活码 (格式: XXXX-XXXX-XXXX-XXXX)
  type: 'points' | 'pass'; // 积分充值 or 通行证
  value: number;            // 积分数量 或 pass_7day/pass_30day 对应的天数
  passType?: 'pass_7day' | 'pass_30day'; // 通行证类型（仅 type=pass 时有值）
  usedBy?: string;          // 使用者 userId
  usedAt?: number;          // 使用时间
  createdAt: number;        // 创建时间
  batchId: string;          // 批次ID（方便管理）
  note?: string;            // 备注（对应爱发电商品名）
}

// ========== 激活码存储 ==========
const CODES_FILE = path.join(process.cwd(), 'data', 'activation-codes.json');

function ensureDataDir() {
  const dir = path.dirname(CODES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadCodes(): ActivationCode[] {
  ensureDataDir();
  if (!fs.existsSync(CODES_FILE)) return [];
  try {
    const raw = fs.readFileSync(CODES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCodes(codes: ActivationCode[]) {
  ensureDataDir();
  fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2), 'utf-8');
}

// ========== 生成激活码 ==========
function generateCodeString(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉容易混淆的 I, O, 0, 1
  const segments: string[] = [];
  for (let s = 0; s < 4; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars[crypto.randomInt(chars.length)];
    }
    segments.push(seg);
  }
  return segments.join('-');
}

export interface GenerateCodesInput {
  type: 'points' | 'pass';
  value: number;            // 积分数量，或 pass 天数
  passType?: 'pass_7day' | 'pass_30day';
  count: number;            // 生成数量
  batchId?: string;         // 批次ID，不传则自动生成
  note?: string;            // 备注（爱发电商品名）
}

export interface GenerateCodesResult {
  codes: string[];
  batchId: string;
  count: number;
}

export function generateCodes(input: GenerateCodesInput): GenerateCodesResult {
  const existing = loadCodes();
  const existingSet = new Set(existing.map(c => c.code));
  const batchId = input.batchId || `batch_${Date.now()}`;

  const newCodes: ActivationCode[] = [];
  let attempts = 0;

  while (newCodes.length < input.count && attempts < input.count * 10) {
    attempts++;
    const codeStr = generateCodeString();
    if (existingSet.has(codeStr)) continue;

    const code: ActivationCode = {
      code: codeStr,
      type: input.type,
      value: input.value,
      passType: input.passType,
      createdAt: Date.now(),
      batchId,
      note: input.note,
    };

    newCodes.push(code);
    existingSet.add(codeStr);
  }

  saveCodes([...existing, ...newCodes]);

  return {
    codes: newCodes.map(c => c.code),
    batchId,
    count: newCodes.length,
  };
}

// ========== 兑换激活码（带锁防并发） ==========
export interface RedeemResult {
  success: boolean;
  type?: 'points' | 'pass';
  points?: number;
  passType?: 'pass_7day' | 'pass_30day';
  durationDays?: number;
  error?: string;
}

let redeemLock = false;
function acquireRedeemLock(): boolean {
  if (redeemLock) return false;
  redeemLock = true;
  return true;
}
function releaseRedeemLock() { redeemLock = false; }

export function redeemCode(code: string, userId: string): RedeemResult {
  const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');

  // 简单同步锁，防止并发兑换同一个码
  if (!acquireRedeemLock()) {
    return { success: false, error: '系统繁忙，请稍后重试' };
  }

  try {
    const codes = loadCodes();
    const idx = codes.findIndex(c => c.code === normalizedCode);

    if (idx === -1) {
      return { success: false, error: '激活码不存在，请检查是否输入正确' };
    }

    const codeRecord = codes[idx];

    if (codeRecord.usedBy) {
      return { success: false, error: '该激活码已被使用' };
    }

    // 标记为已使用
    codeRecord.usedBy = userId;
    codeRecord.usedAt = Date.now();
    saveCodes(codes);

    if (codeRecord.type === 'points') {
      return {
        success: true,
        type: 'points',
        points: codeRecord.value,
      };
    } else {
      const durationDays = codeRecord.passType === 'pass_30day' ? 30 : 7;
      return {
        success: true,
        type: 'pass',
        passType: codeRecord.passType || 'pass_7day',
        durationDays,
      };
    }
  } finally {
    releaseRedeemLock();
  }
}

// ========== 查询激活码状态 ==========
export function getCodeInfo(code: string): ActivationCode | null {
  const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');
  const codes = loadCodes();
  return codes.find(c => c.code === normalizedCode) || null;
}

// ========== 按批次查询 ==========
export function getCodesByBatch(batchId: string): ActivationCode[] {
  const codes = loadCodes();
  return codes.filter(c => c.batchId === batchId);
}

// ========== 统计 ==========
export function getCodeStats() {
  const codes = loadCodes();
  const total = codes.length;
  const used = codes.filter(c => c.usedBy).length;
  const unused = total - used;

  const byType = {
    points: { total: 0, used: 0, unused: 0 },
    pass_7day: { total: 0, used: 0, unused: 0 },
    pass_30day: { total: 0, used: 0, unused: 0 },
  };

  for (const c of codes) {
    const category = c.type === 'pass' ? (c.passType || 'pass_7day') : 'points';
    byType[category].total++;
    if (c.usedBy) byType[category].used++;
    else byType[category].unused++;
  }

  return { total, used, unused, byType };
}

// ========== 查询用户已使用的激活码 ==========
export function getCodesUsedByUser(userId: string): ActivationCode[] {
  const codes = loadCodes();
  return codes.filter(c => c.usedBy === userId);
}
