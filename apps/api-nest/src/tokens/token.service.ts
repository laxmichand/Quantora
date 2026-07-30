import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { RedisService } from '../common/redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

const ABSOLUTE_SESSION_TIMEOUT_DAYS = 30;
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
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly refreshExpiryDays = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '7', 10);
  private readonly accessExpiryMinutes = 15;

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
  ): Promise<TokenPair> {
    const jti = this.generateJti();
    const familyId = this.generateFamilyId();

    // Create or reuse session
    let sessionId = existingSessionId;
    let sessionToken: string;

    if (sessionId) {
      // Update existing session
      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          accessTokenId: jti,
          refreshTokenId: familyId,
          refreshTokenHash: null,
          lastActivity: new Date(),
        },
      });
      sessionToken = session.sessionToken;
    } else {
      // Enforce max 2 active sessions per user — revoke oldest if at limit
      const activeSessions = await this.prisma.session.findMany({
        where: {
          userId: user.id,
          revoked: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'asc' },
      });
      if (activeSessions.length >= 2) {
        const toRevoke = activeSessions.slice(0, activeSessions.length - 1);
        for (const s of toRevoke) {
          await this.prisma.session.update({
            where: { id: s.id },
            data: { revoked: true, logoutReason: 'session_limit_exceeded', logoutTime: new Date() },
          });
          await this.redis.removeUserSession(user.id, s.id);
        }
      }

      // Create new session
      sessionToken = this.generateJti();
      const session = await this.prisma.session.create({
        data: {
          userId: user.id,
          deviceId,
          sessionToken,
          accessTokenId: jti,
          refreshTokenId: familyId,
          expiresAt: new Date(
            Date.now() +
              this.refreshExpiryDays *
                HOURS_PER_DAY *
                MINUTES_PER_HOUR *
                SECONDS_PER_MINUTE *
                MS_PER_SECOND,
          ),
          absoluteTimeout: new Date(
            Date.now() +
              ABSOLUTE_SESSION_TIMEOUT_DAYS *
                HOURS_PER_DAY *
                MINUTES_PER_HOUR *
                SECONDS_PER_MINUTE *
                MS_PER_SECOND,
          ),
        },
      });
      sessionId = session.id;
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

    // Blacklist old access token if rotating
    // Add to Redis active sessions
    await this.redis.addUserSession(user.id, sessionId!, this.refreshExpiryDays * SECONDS_PER_DAY);

    return { accessToken, refreshToken, sessionId: sessionId! };
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
      // Try to find by hash in DB
      const hash = this.hashToken(oldRefreshToken);
      const session = await this.prisma.session.findFirst({
        where: { refreshTokenHash: hash, revoked: false },
      });
      if (session) {
        // The old token is still valid in DB — revoke this session
        await this.prisma.session.update({
          where: { id: session.id },
          data: { revoked: true, logoutReason: 'token_reuse' },
        });
        await this.redis.removeUserSession(user.id, session.id);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check for reuse: look up session by old refresh token hash
    const oldHash = this.hashToken(oldRefreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: oldHash, revoked: false },
    });

    if (!session) {
      // Token was already rotated — reuse detected
      reuseDetected = true;
      this.logger.warn(`Refresh token reuse detected for user ${oldPayload.sub}`);

      // Revoke ALL sessions for this user as security measure
      await this.prisma.session.updateMany({
        where: { userId: oldPayload.sub, revoked: false },
        data: { revoked: true, logoutReason: 'token_reuse_detected' },
      });
      await this.redis.clearUserSessions(oldPayload.sub);

      throw new UnauthorizedException('Token reuse detected — all sessions revoked');
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
    const tokenPair = await this.generateTokenPair(user, deviceId, session.id);

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

    const result = await this.prisma.session.updateMany({
      where,
      data: {
        revoked: true,
        logoutReason: reason,
        logoutTime: new Date(),
      },
    });

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
    return this.prisma.session.findMany({
      where: { userId, revoked: false, expiresAt: { gt: new Date() } },
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
}
