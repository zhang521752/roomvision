import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  passwordHash: string;
  createdAt: number;
  lastLoginAt: number;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

const usersStore: Map<string, User> = new Map();
const sessionsStore: Map<string, Session> = new Map();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

const AVATARS = [
  '🏠', '🎨', '✨', '🌿', '🛋️', '💡', '🏛️', '🪴',
];

export class AuthManager {
  private loginAttempts: Map<string, { count: number; lockedUntil: number }> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Clean up expired login attempts every 10 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [phone, attempt] of this.loginAttempts) {
        if (attempt.lockedUntil > 0 && attempt.lockedUntil < now) {
          this.loginAttempts.delete(phone);
        }
      }
    }, 10 * 60 * 1000);
  }

  async register(phone: string, password: string, nickname?: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    if (!phone || phone.length < 6) {
      return { success: false, error: '请输入有效的手机号' };
    }

    if (!password || password.length < 8) {
      return { success: false, error: '密码至少8位，需包含字母和数字' };
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return { success: false, error: '密码至少8位，需包含字母和数字' };
    }

    if (usersStore.has(phone)) {
      // Don't reveal that the phone is already registered (prevents user enumeration)
      return { success: false, error: '注册失败，请稍后重试或尝试登录' };
    }

    const userId = 'user_' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];

    const passwordHash = await bcrypt.hash(password, 10);

    const user: User = {
      id: userId,
      phone,
      nickname: nickname || `用户${phone.slice(-4)}`,
      avatar,
      passwordHash,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    usersStore.set(phone, user);

    const token = generateToken();
    const session: Session = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    sessionsStore.set(token, session);

    console.log(`[Auth] User registered: ${userId} (${phone})`);

    return { success: true, user, token };
  }

  async login(phone: string, password: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    const attempt = this.loginAttempts.get(phone);
    if (attempt && attempt.lockedUntil > Date.now()) {
      const remainingMinutes = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
      return { success: false, error: `登录尝试过多，请${remainingMinutes}分钟后再试` };
    }

    const user = usersStore.get(phone);
    if (!user) {
      this.recordFailedAttempt(phone);
      return { success: false, error: '手机号或密码错误' };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      this.recordFailedAttempt(phone);
      return { success: false, error: '手机号或密码错误' };
    }

    this.loginAttempts.delete(phone);

    user.lastLoginAt = Date.now();

    const token = generateToken();
    const session: Session = {
      token,
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    sessionsStore.set(token, session);

    console.log(`[Auth] User logged in: ${user.id} (${phone})`);

    return { success: true, user, token };
  }

  private recordFailedAttempt(phone: string): void {
    const attempt = this.loginAttempts.get(phone);
    if (!attempt || attempt.lockedUntil <= Date.now()) {
      this.loginAttempts.set(phone, { count: 1, lockedUntil: 0 });
    } else {
      attempt.count += 1;
    }
    const current = this.loginAttempts.get(phone)!;
    if (current.count >= 5) {
      current.lockedUntil = Date.now() + 15 * 60 * 1000;
    }
  }

  verifyToken(token: string): { valid: boolean; userId?: string } {
    const session = sessionsStore.get(token);
    if (!session) return { valid: false };

    if (Date.now() > session.expiresAt) {
      sessionsStore.delete(token);
      return { valid: false };
    }

    return { valid: true, userId: session.userId };
  }

  getUserByPhone(phone: string): User | undefined {
    return usersStore.get(phone);
  }

  getUserById(userId: string): User | undefined {
    for (const user of usersStore.values()) {
      if (user.id === userId) return user;
    }
    return undefined;
  }

  logout(token: string): void {
    sessionsStore.delete(token);
  }

  updateProfile(userId: string, updates: Partial<Pick<User, 'nickname' | 'avatar'>>): boolean {
    for (const user of usersStore.values()) {
      if (user.id === userId) {
        if (updates.nickname) user.nickname = updates.nickname;
        if (updates.avatar) user.avatar = updates.avatar;
        return true;
      }
    }
    return false;
  }

  getStats() {
    return {
      totalUsers: usersStore.size,
      activeSessions: sessionsStore.size,
    };
  }
}

export const authManager = new AuthManager();
