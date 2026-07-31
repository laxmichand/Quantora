import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

const RETRY_BACKOFF_MS = 50;
const RETRY_MAX_MS = 2000;
const MAX_RETRIES_PER_REQUEST = 3;
const DEFAULT_MFA_TTL = 300;
const DEFAULT_CACHE_TTL = 3600;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  async onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times) => Math.min(times * RETRY_BACKOFF_MS, RETRY_MAX_MS),
      maxRetriesPerRequest: MAX_RETRIES_PER_REQUEST,
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    // Swallow reconnect error events when Redis is down (e.g. local dev without Redis)
    this.client.on('error', (err) => this.logger.debug(`Redis connection error: ${err.message}`));

    try {
      await this.client.connect();
      this.logger.log('Redis connected');
    } catch (err) {
      this.logger.warn(`Redis unavailable: ${(err as Error).message}. Running without Redis.`);
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  private isConnected(): boolean {
    return this.client?.status === 'ready';
  }

  // ─── Token Blacklist ──────────────────────────────────────

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    if (!this.isConnected()) return;
    await this.client.set(`blk:${jti}`, '1', 'EX', ttlSeconds);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    if (!this.isConnected()) return false;
    const val = await this.client.get(`blk:${jti}`);
    return val === '1';
  }

  // ─── Refresh Token Reuse Detection ────────────────────────

  async markTokenFamily(familyId: string, jti: string, ttlSeconds: number): Promise<void> {
    if (!this.isConnected()) return;
    await this.client.set(`fam:${familyId}`, jti, 'EX', ttlSeconds);
  }

  async getTokenFamily(familyId: string): Promise<string | null> {
    if (!this.isConnected()) return null;
    return this.client.get(`fam:${familyId}`);
  }

  // ─── User Active Sessions Set ─────────────────────────────

  async addUserSession(userId: string, sessionId: string, ttlSeconds: number): Promise<void> {
    if (!this.isConnected()) return;
    await this.client.sadd(`s:${userId}`, sessionId);
    await this.client.expire(`s:${userId}`, ttlSeconds);
  }

  async removeUserSession(userId: string, sessionId: string): Promise<void> {
    if (!this.isConnected()) return;
    await this.client.srem(`s:${userId}`, sessionId);
  }

  async getUserSessions(userId: string): Promise<string[]> {
    if (!this.isConnected()) return [];
    return this.client.smembers(`s:${userId}`);
  }

  async clearUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    if (!this.isConnected()) return;
    if (exceptSessionId) {
      const sessions = await this.getUserSessions(userId);
      const toRemove = sessions.filter((s) => s !== exceptSessionId);
      if (toRemove.length > 0) {
        await this.client.srem(`s:${userId}`, ...toRemove);
      }
    } else {
      await this.client.del(`s:${userId}`);
    }
  }

  // ─── User Active Devices Set ──────────────────────────────

  async addUserDevice(userId: string, deviceId: string): Promise<void> {
    if (!this.isConnected()) return;
    await this.client.sadd(`d:${userId}`, deviceId);
  }

  async removeUserDevice(userId: string, deviceId: string): Promise<void> {
    if (!this.isConnected()) return;
    await this.client.srem(`d:${userId}`, deviceId);
  }

  async getUserDeviceIds(userId: string): Promise<string[]> {
    if (!this.isConnected()) return [];
    return this.client.smembers(`d:${userId}`);
  }

  // ─── Rate Limiting ────────────────────────────────────────

  async rateLimit(
    key: string,
    maxAttempts: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    if (!this.isConnected()) return { allowed: true, remaining: maxAttempts, resetAt: 0 };
    const now = Date.now();
    const windowKey = `rl:${key}:${Math.floor(now / 1000 / windowSeconds)}`;
    const count = await this.client.incr(windowKey);
    if (count === 1) await this.client.expire(windowKey, windowSeconds);
    const ttl = await this.client.ttl(windowKey);
    return {
      allowed: count <= maxAttempts,
      remaining: Math.max(0, maxAttempts - count),
      resetAt: now + ttl * 1000, // convert seconds to ms
    };
  }

  // ─── MFA Challenge Store ──────────────────────────────────

  async setMfaChallenge(
    sessionToken: string,
    data: string,
    ttlSeconds = DEFAULT_MFA_TTL,
  ): Promise<void> {
    if (!this.isConnected()) return;
    await this.client.set(`mfa:${sessionToken}`, data, 'EX', ttlSeconds);
  }

  async getMfaChallenge(sessionToken: string): Promise<string | null> {
    if (!this.isConnected()) return null;
    return this.client.get(`mfa:${sessionToken}`);
  }

  async deleteMfaChallenge(sessionToken: string): Promise<void> {
    if (!this.isConnected()) return;
    await this.client.del(`mfa:${sessionToken}`);
  }

  // ─── Generic Cache ────────────────────────────────────────

  async cacheGet<T>(key: string): Promise<T | null> {
    if (!this.isConnected()) return null;
    const val = await this.client.get(`cache:${key}`);
    return val ? JSON.parse(val) : null;
  }

  async cacheSet(key: string, value: unknown, ttlSeconds = DEFAULT_CACHE_TTL): Promise<void> {
    if (!this.isConnected()) return;
    await this.client.set(`cache:${key}`, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async cacheDelete(key: string): Promise<void> {
    if (!this.isConnected()) return;
    await this.client.del(`cache:${key}`);
  }
}
