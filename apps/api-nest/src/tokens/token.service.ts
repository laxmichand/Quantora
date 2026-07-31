import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { RedisService } from '../common/redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

const MAX_ACTIVE_SESSIONS = 2;
const ABSOLUTE_SESSION_TIMEOUT_DAYS = 30;
const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
const DEFAULT_REFRESH_TOKEN_EXPIRY_DAYS = 7;
const SESSION_LOCK_TIMEOUT_MS = 20_000;
const SESSION_LOCK_MAX_WAIT_MS = 20_000;
const SECONDS_PER_DAY = 86_400;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  sid: string;
  did: string;
  type: 'access' | 'refresh';
  family?: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  /** Set when an existing session was evicted to make room for the new session. */
  evictedSessionId?: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly refreshExpiryDays = parseInt(
    process.env.REFRESH_TOKEN_EXPIRY_DAYS || `${DEFAULT_REFRESH_TOKEN_EXPIRY_DAYS}`,
    10,
  );
  private readonly accessExpiryMinutes = ACCESS_TOKEN_EXPIRY_MINUTES;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  generateJti(): string {
    return randomBytes(24).toString('hex');
  }

  generateFamilyId(): string {
    return randomBytes(16).toString('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async generateTokenPair(
    user: { id: string; email: string; name: string; role: string },
    deviceId: string,
    existingSessionId?: string,
    ip?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const jti = this.generateJti();
    const familyId = this.generateFamilyId();
    const now = new Date();

    // Create or reuse session
    let sessionId = existingSessionId;
    let sessionToken: string;
    let evictedSessionId: string | undefined;
    let previousAccessTokenId: string | undefined;

    if (sessionId) {
      // Rotate within an existing session (e.g. token refresh). Never applies
      // the session limit here — we are not creating a new session.
      const existing = await this.prisma.session.findUnique({
        where: { id: sessionId },
        select: { sessionToken: true, accessTokenId: true },
      });
      if (!existing) throw new UnauthorizedException('Session not found');
      previousAccessTokenId = existing.accessTokenId ?? undefined;
      sessionToken = existing.sessionToken;

      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          accessTokenId: jti,
          refreshTokenId: familyId,
          refreshTokenHash: null,
          lastActivity: now,
          ipAddress: ip || undefined,
          userAgent: userAgent || undefined,
        },
      });
    } else {
      // Create a brand-new session, enforcing the global per-user limit.
      // The transaction + row lock serialize concurrent logins for the same
      // user so the invariant ACTIVE_SESSIONS(userId) <= 2 always holds.
      const created = await this.prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM "users" WHERE id = ${user.id} FOR UPDATE`;

          const activeSessions = await tx.session.findMany({
            where: {
              userId: user.id,
              revoked: false,
              expiresAt: { gt: now },
              OR: [{ absoluteTimeout: null }, { absoluteTimeout: { gt: now } }],
            },
            orderBy: [{ lastActivity: 'asc' }, { createdAt: 'asc' }],
          });

          let evicted: { id: string; accessTokenId: string | null } | null = null;
          if (activeSessions.length >= MAX_ACTIVE_SESSIONS) {
            // Oldest active session first — evict exactly ONE.
            evicted = activeSessions[0];
            await tx.session.update({
              where: { id: evicted.id },
              data: { revoked: true, logoutReason: 'session_limit_exceeded', logoutTime: now },
            });
          }

          const newSessionToken = this.generateJti();
          const session = await tx.session.create({
            data: {
              userId: user.id,
              deviceId,
              sessionToken: newSessionToken,
              accessTokenId: jti,
              refreshTokenId: familyId,
              expiresAt: this.sessionExpiry(now),
              absoluteTimeout: this.absoluteTimeout(now),
              ipAddress: ip || undefined,
              userAgent: userAgent || undefined,
            },
          });

          return { session, evicted };
        },
        {
          // Concurrent logins for the same user serialize on the user row
          // lock; allow the queued transactions enough time to acquire it.
          timeout: SESSION_LOCK_TIMEOUT_MS,
          maxWait: SESSION_LOCK_MAX_WAIT_MS,
        },
      );

      sessionId = created.session.id;
      sessionToken = created.session.sessionToken;
      evictedSessionId = created.evicted?.id;
      previousAccessTokenId = created.evicted?.accessTokenId ?? undefined;
    }

    // Build access token
    const accessPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti,
      sid: sessionId!,
      did: deviceId,
      type: 'access',
    };

    // Build refresh token payload
    const refreshPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: this.generateJti(),
      sid: sessionId!,
      did: deviceId,
      family: familyId,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...accessPayload },
        { expiresIn: `${this.accessExpiryMinutes}m` },
      ),
      this.jwtService.signAsync({ ...refreshPayload }, { expiresIn: `${this.refreshExpiryDays}d` }),
    ]);

    // Update session with refresh token hash
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: this.hashToken(refreshToken),
      },
    });

    // Invalidate the previous access token so a rotated/replaced token cannot
    // be used any longer.
    if (previousAccessTokenId) {
      await this.redis.blacklistToken(
        previousAccessTokenId,
        this.refreshExpiryDays * SECONDS_PER_DAY,
      );
    }

    // Drop an evicted session from the Redis active-session set.
    if (evictedSessionId) {
      await this.redis.removeUserSession(user.id, evictedSessionId);
    }

    // Add to Redis active sessions
    await this.redis.addUserSession(user.id, sessionId!, this.refreshExpiryDays * SECONDS_PER_DAY);

    return { accessToken, refreshToken, sessionId: sessionId!, evictedSessionId };
  }

  async rotateRefreshToken(
    oldRefreshToken: string,
    user: { id: string; email: string; name: string; role: string },
    deviceId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{ tokenPair: TokenPair; reuseDetected: boolean }> {
    let reuseDetected = false;

    // Verify old token
    let oldPayload: TokenPayload;
    try {
      oldPayload = (await this.jwtService.verifyAsync(oldRefreshToken)) as TokenPayload;
      if (oldPayload.type !== 'refresh') {
        throw new UnauthorizedException('Not a refresh token');
      }
    } catch {
      // Signature/expiry verification failed. If the token still matches a
      // stored hash it belongs to a real session — revoke ONLY that session.
      const hash = this.hashToken(oldRefreshToken);
      const session = await this.prisma.session.findFirst({
        where: { refreshTokenHash: hash, revoked: false },
        select: { id: true },
      });
      if (session) {
        await this.revokeSession(session.id, 'token_reuse');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check for reuse: look up session by old refresh token hash
    const oldHash = this.hashToken(oldRefreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: oldHash, revoked: false },
    });

    if (!session) {
      // Token was already rotated. If it matches a previous hash, this is a
      // genuine reuse of THAT session's token — revoke only that session.
      // Other sessions (other platforms/devices) remain valid.
      const reusedSession = await this.prisma.session.findFirst({
        where: { previousRefreshTokenHash: oldHash, revoked: false },
        select: { id: true },
      });

      if (reusedSession) {
        reuseDetected = true;
        this.logger.warn(
          `Refresh token reuse detected for session ${reusedSession.id} (user ${oldPayload.sub})`,
        );
        await this.revokeSession(reusedSession.id, 'token_reuse');
      }

      throw new UnauthorizedException('Refresh token has expired or already been used');
    }

    // Store previous hash for detection
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        previousRefreshTokenHash: oldHash,
        refreshTokenHash: null,
        lastActivity: new Date(),
        ipAddress: ip || session.ipAddress,
        userAgent: userAgent || session.userAgent,
      },
    });

    // Generate new token pair (reuses same session)
    const tokenPair = await this.generateTokenPair(user, deviceId, session.id, ip, userAgent);

    // Blacklist old token
    if (oldPayload.jti) {
      await this.redis.blacklistToken(oldPayload.jti, this.refreshExpiryDays * SECONDS_PER_DAY);
    }
    await this.redis.markTokenFamily(
      oldPayload.family || session.id,
      this.hashToken(tokenPair.refreshToken),
      this.refreshExpiryDays * SECONDS_PER_DAY,
    );

    return { tokenPair, reuseDetected };
  }

  async revokeSession(
    sessionId: string,
    reason = 'user_logout',
    revokedBy?: string,
    revokedIp?: string,
  ): Promise<void> {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.revoked) return;

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        revoked: true,
        logoutReason: reason,
        logoutTime: new Date(),
        revokedBy: revokedBy || session.userId,
        revokedIp: revokedIp || session.ipAddress,
      },
    });

    await this.redis.removeUserSession(session.userId, sessionId);

    // Blacklist session's access token
    if (session.accessTokenId) {
      await this.redis.blacklistToken(
        session.accessTokenId,
        this.refreshExpiryDays * SECONDS_PER_DAY,
      );
    }
  }

  async revokeAllUserSessions(
    userId: string,
    exceptSessionId?: string,
    reason = 'user_logout_all',
  ): Promise<number> {
    const where: any = { userId, revoked: false };
    if (exceptSessionId) {
      where.id = { not: exceptSessionId };
    }

    // Resolve the affected sessions BEFORE revoking them so their access
    // tokens can be blacklisted (a post-revoke query with revoked: false
    // would return nothing).
    const sessions = await this.prisma.session.findMany({
      where: { ...where },
      select: { id: true, accessTokenId: true },
    });

    const result = await this.prisma.session.updateMany({
      where,
      data: {
        revoked: true,
        logoutReason: reason,
        logoutTime: new Date(),
      },
    });

    // Blacklist every revoked session's access token so a 401 follows
    // immediately instead of lingering for the access-token lifetime.
    for (const s of sessions) {
      if (s.accessTokenId) {
        await this.redis.blacklistToken(s.accessTokenId, this.refreshExpiryDays * SECONDS_PER_DAY);
      }
    }

    await this.redis.clearUserSessions(userId, exceptSessionId);

    return result.count;
  }

  async revokeSessionsByDeviceId(
    userId: string,
    deviceId: string,
    reason = 'device_removed',
  ): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { userId, deviceId, revoked: false },
      data: {
        revoked: true,
        logoutReason: reason,
        logoutTime: new Date(),
      },
    });

    // Get session IDs to remove from Redis
    const sessions = await this.prisma.session.findMany({
      where: { userId, deviceId },
      select: { id: true },
    });
    for (const s of sessions) {
      await this.redis.removeUserSession(userId, s.id);
    }

    return result.count;
  }

  async getActiveSessions(userId: string): Promise<any[]> {
    const now = new Date();
    return this.prisma.session.findMany({
      where: {
        userId,
        revoked: false,
        expiresAt: { gt: now },
        OR: [{ absoluteTimeout: null }, { absoluteTimeout: { gt: now } }],
      },
      orderBy: { lastActivity: 'desc' },
      include: {
        device: {
          select: {
            id: true,
            deviceId: true,
            deviceName: true,
            deviceType: true,
            browser: true,
            os: true,
            city: true,
            country: true,
            publicIp: true,
            trustedDevice: true,
          },
        },
      },
    });
  }

  private sessionExpiry(from: Date): Date {
    return new Date(
      from.getTime() +
        this.refreshExpiryDays *
          HOURS_PER_DAY *
          MINUTES_PER_HOUR *
          SECONDS_PER_MINUTE *
          MS_PER_SECOND,
    );
  }

  private absoluteTimeout(from: Date): Date {
    return new Date(
      from.getTime() +
        ABSOLUTE_SESSION_TIMEOUT_DAYS *
          HOURS_PER_DAY *
          MINUTES_PER_HOUR *
          SECONDS_PER_MINUTE *
          MS_PER_SECOND,
    );
  }
}
