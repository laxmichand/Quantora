import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as otplib from 'otplib';
import { toDataURL } from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { TokenService } from '../tokens/token.service';
import { FingerprintService, DeviceFingerprint } from '../fingerprint/fingerprint.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RiskEngineService, RiskContext } from '../risk-engine/risk-engine.service';
import { IpIntelligenceService, IpInfo } from '../common/services/ip-intelligence.service';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import { SecurityEventType } from '../security-audit/security-event.constants';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserPayload } from '../common/interfaces/user-payload.interface';
import { parseUserAgent } from '../common/utils/user-agent.parser';
import { UAParser } from 'ua-parser-js';
import { randomBytes } from 'crypto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MIN = 15;
const MINUTE_MS = 60_000;

const ARGON_MEMORY_COST = 19456;
const ARGON_TIME_COST = 2;

const MFA_CHALLENGE_TTL = 300;
const MFA_RATE_LIMIT_ATTEMPTS = 5;
const MFA_RATE_LIMIT_WINDOW_SECONDS = 60;
const MFA_SETUP_TTL = 600;
const BACKUP_CODE_COUNT = 8;
const BACKUP_CODE_BYTES = 4;

const LOGIN_HISTORY_RETENTION_DAYS = 30;
const LOGIN_HISTORY_MAX_ENTRIES = 20;

const loginHistoryCutoff = () =>
  new Date(Date.now() - LOGIN_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000);

/** Request headers that describe the device/client, captured server-side. */
export interface DeviceRequestHeaders {
  acceptLanguage?: string;
  acceptEncoding?: string;
  acceptHeader?: string;
  referer?: string;
  origin?: string;
}

interface RecordLoginParams {
  userId: string | null;
  email: string;
  success: boolean;
  ip?: string;
  userAgent?: string;
  provider?: string;
  failureReason?: string | null;
  extra?: {
    riskScore?: number;
    riskLevel?: string;
    riskFactors?: any[];
    deviceId?: string;
    sessionId?: string;
    country?: string;
    city?: string;
    isNewDevice?: boolean;
    isNewCountry?: boolean;
    isNewIp?: boolean;
    vpnDetected?: boolean;
    proxyDetected?: boolean;
    torDetected?: boolean;
    deviceName?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    timezone?: string;
    loginMethod?: string;
    isp?: string;
    ispOrganization?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface LoginContext {
  ip?: string;
  userAgent?: string;
  deviceId?: string;
  fingerprint?: Partial<DeviceFingerprint>;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  headers?: DeviceRequestHeaders;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly pepper = process.env.BCRYPT_PEPPER || '';

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
    private tokenService: TokenService,
    private fingerprintService: FingerprintService,
    private riskEngine: RiskEngineService,
    private ipIntel: IpIntelligenceService,
    private audit: SecurityAuditService,
    private notifications: NotificationsService,
  ) {}

  async register(
    dto: RegisterDto,
    ip?: string,
    userAgent?: string,
    headers?: DeviceRequestHeaders,
  ): Promise<{ accessToken: string; refreshToken: string; user: AuthResponseDto['user'] }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password + this.pepper, {
      type: argon2.argon2id,
      memoryCost: ARGON_MEMORY_COST,
      timeCost: ARGON_TIME_COST,
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        provider: 'local',
        isEmailVerified: true,
        preferences: { create: { language: 'en', theme: 'slate' } },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    this.logger.log(`User registered: ${user.email}`);

    // Register/create device record
    const ipInfo = ip
      ? await this.ipIntel.lookup(ip).catch((err) => {
          this.logger.debug('IP intelligence lookup failed during register');
          return undefined;
        })
      : undefined;
    let devicePk: string;
    try {
      const device = await this.registerOrUpdateDevice(user.id, {
        deviceId: dto.deviceId || randomBytes(16).toString('hex'),
        fingerprint: dto.fingerprint,
        ip,
        userAgent,
        ipInfo,
        headers,
        loginMethod: 'local',
      });
      devicePk = device.id;
    } catch (err) {
      this.logger.warn(`Device registration failed: ${(err as Error).message}`);
      throw err;
    }

    const { accessToken, refreshToken, sessionId, evictedSessionId } =
      await this.tokenService.generateTokenPair(user, devicePk, undefined, ip, userAgent);

    if (evictedSessionId) {
      await this.audit.createSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.SESSION_REVOKED,
        severity: 'warning',
        description: 'Oldest session revoked because the active-session limit was reached',
        deviceId: devicePk,
        sessionId,
        ipAddress: ip,
        metadata: {
          revokedSessionId: evictedSessionId,
          newSessionId: sessionId,
          reason: 'MAX_ACTIVE_SESSIONS_EXCEEDED',
          deviceId: devicePk,
        },
      });
    }

    await this.audit.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      entity: 'user',
      entityId: user.id,
      ipAddress: ip,
      userAgent,
      severity: 'info',
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async login(
    dto: LoginDto,
    ctx: LoginContext,
  ): Promise<{
    accessToken?: string;
    refreshToken?: string;
    user?: AuthResponseDto['user'];
    requiresMfa?: boolean;
    mfaSessionToken?: string;
    blocked?: boolean;
    riskScore?: number;
    riskLevel?: string;
  }> {
    const ip = ctx.ip;
    const userAgent = ctx.userAgent;
    const deviceId = ctx.deviceId;

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.isDeleted) {
      await this.recordLogin({
        userId: null,
        email: dto.email,
        success: false,
        ip,
        userAgent,
        provider: 'local',
        failureReason: 'Invalid credentials',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check lockout
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / MINUTE_MS);
      await this.recordLogin({
        userId: user.id,
        email: user.email,
        success: false,
        ip,
        userAgent,
        provider: 'local',
        failureReason: 'Account locked',
      });
      throw new ForbiddenException(`Account locked. Try again in ${remaining} minutes`);
    }

    if (!user.isActive) {
      await this.recordLogin({
        userId: user.id,
        email: user.email,
        success: false,
        ip,
        userAgent,
        provider: 'local',
        failureReason: 'Account deactivated',
      });
      throw new ForbiddenException('Account is deactivated');
    }

    // Verify password
    const isValid = await argon2.verify(user.passwordHash!, dto.password + this.pepper);
    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: attempts,
            lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MIN * MINUTE_MS),
          },
        });
        await this.recordLogin({
          userId: user.id,
          email: user.email,
          success: false,
          ip,
          userAgent,
          provider: 'local',
          failureReason: 'Account locked',
        });
        await this.audit.createSecurityEvent({
          userId: user.id,
          eventType: SecurityEventType.ACCOUNT_LOCKED,
          severity: 'high',
          description: 'Account locked due to too many failed attempts',
          ipAddress: ip,
        });
        throw new ForbiddenException(
          `Account locked. Try again in ${LOCKOUT_DURATION_MIN} minutes`,
        );
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts },
      });
      await this.recordLogin({
        userId: user.id,
        email: user.email,
        success: false,
        ip,
        userAgent,
        provider: 'local',
        failureReason: 'Invalid credentials',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      await this.recordLogin({
        userId: user.id,
        email: user.email,
        success: false,
        ip,
        userAgent,
        provider: 'local',
        failureReason: 'Email not verified',
      });
      throw new ForbiddenException('Please verify your email before logging in');
    }

    // ─── Password verified — begin device + risk evaluation ───────────
    // These steps are independent — run them concurrently to cut
    // round-trips against the database/IP service.
    const clientDeviceId = deviceId || randomBytes(16).toString('hex');
    const [ipInfo] = await Promise.all([
      this.ipIntel.lookup(ip || '').catch(() => {
        this.logger.debug('IP intelligence lookup failed');
        return undefined;
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
      }),
    ]);

    // Evaluate risk BEFORE the device is upserted — otherwise the device
    // already exists and the 'new_device' factor never fires on first login.
    const riskCtx: RiskContext = {
      userId: user.id,
      email: user.email,
      ip: ip || '',
      userAgent: userAgent || '',
      deviceFingerprint: ctx.fingerprint
        ? this.fingerprintService.hash(ctx.fingerprint)
        : undefined,
      deviceId: clientDeviceId,
      country: ipInfo?.country,
      city: ipInfo?.city,
      timezone: ctx.timezone,
      latitude: ctx.latitude,
      longitude: ctx.longitude,
    };

    const riskResult = await this.riskEngine.evaluate(riskCtx);

    const device = await this.registerOrUpdateDevice(user.id, {
      deviceId: clientDeviceId,
      fingerprint: ctx.fingerprint,
      ip,
      userAgent,
      ipInfo,
      headers: ctx.headers,
      loginMethod: 'local',
    });
    const deviceRecordId = device.id;

    // Update device risk score
    if (deviceRecordId) {
      await this.prisma.device.update({
        where: { id: deviceRecordId },
        data: {
          riskScore: riskResult.score,
          riskLevel: riskResult.level,
          lastLogin: new Date(),
          loginCount: { increment: 1 },
        },
      });
    }

    const isNewDevice = riskResult.factors.some((f) => f.name === 'new_device');
    const isNewIp = riskResult.factors.some((f) => f.name === 'new_ip');

    // Block critical risk
    if (riskResult.blocked) {
      await this.recordLogin({
        userId: user.id,
        email: user.email,
        success: false,
        ip,
        userAgent,
        provider: 'local',
        failureReason: 'Login blocked by risk engine',
      });
      await this.audit.createSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.CRITICAL_LOGIN_BLOCKED,
        severity: 'critical',
        description: `Login blocked: ${riskResult.factors.map((f) => f.name).join(', ')}`,
        riskScore: riskResult.score,
        deviceId: deviceRecordId,
        ipAddress: ip,
        country: ipInfo?.country,
        city: ipInfo?.city,
        metadata: { factors: riskResult.factors },
      });
      throw new ForbiddenException(
        'This login was blocked for security reasons. Please contact support.',
      );
    }

    // Require MFA for medium+ risk or if user has MFA enabled
    if (riskResult.requiresMfa || user.mfaEnabled) {
      if (user.mfaEnabled) {
        // Generate MFA challenge stored in Redis
        const mfaSessionToken = randomBytes(24).toString('hex');
        await this.redis.setMfaChallenge(
          mfaSessionToken,
          JSON.stringify({
            userId: user.id,
            email: user.email,
            riskResult,
            deviceRecordId,
            ip,
            userAgent,
            completed: false,
          }),
          MFA_CHALLENGE_TTL,
        );

        await this.recordLogin({
          userId: user.id,
          email: user.email,
          success: true,
          ip,
          userAgent,
          provider: 'local',
          extra: {
            riskScore: riskResult.score,
            riskLevel: riskResult.level,
            riskFactors: riskResult.factors,
            deviceId: deviceRecordId,
            country: ipInfo?.country,
            city: ipInfo?.city,
            isNewDevice,
            isNewIp,
            timezone: ctx.timezone,
            isp: ipInfo?.isp,
            ispOrganization: ipInfo?.organization,
            latitude: ipInfo?.latitude,
            longitude: ipInfo?.longitude,
            vpnDetected: ipInfo?.isVpn || false,
            torDetected: ipInfo?.isTor || false,
            proxyDetected: ipInfo?.isProxy || false,
          },
        });

        if (riskResult.level === 'high') {
          await this.audit.createSecurityEvent({
            userId: user.id,
            eventType: SecurityEventType.HIGH_RISK_LOGIN,
            severity: 'high',
            description: `High risk login - MFA required. Factors: ${riskResult.factors.map((f) => f.name).join(', ')}`,
            riskScore: riskResult.score,
            deviceId: deviceRecordId,
            ipAddress: ip,
            country: ipInfo?.country,
            city: ipInfo?.city,
          });
        }

        return {
          requiresMfa: true,
          mfaSessionToken,
          riskScore: riskResult.score,
          riskLevel: riskResult.level,
        };
      }
    }

    // ─── Full login — generate tokens ─────────────────────────────────
    // Every login creates an independent session. The global limit
    // (MAX 2 active sessions per user) is enforced atomically inside
    // generateTokenPair — the oldest active session is evicted if the
    // user already has 2 active sessions. Sessions are never silently
    // replaced merely because the login came from another platform.
    const tokenPair = await this.tokenService.generateTokenPair(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      deviceRecordId,
      undefined,
      ip,
      userAgent,
    );

    if (tokenPair.evictedSessionId) {
      await this.audit.createSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.SESSION_REVOKED,
        severity: 'warning',
        description: 'Oldest session revoked because the active-session limit was reached',
        deviceId: deviceRecordId,
        sessionId: tokenPair.sessionId,
        ipAddress: ip,
        country: ipInfo?.country,
        city: ipInfo?.city,
        metadata: {
          revokedSessionId: tokenPair.evictedSessionId,
          newSessionId: tokenPair.sessionId,
          reason: 'MAX_ACTIVE_SESSIONS_EXCEEDED',
          platform: userAgent ? parseUserAgent(userAgent).os : undefined,
          deviceId: deviceRecordId,
        },
      });
    }

    // Record login history
    await this.recordLogin({
      userId: user.id,
      email: user.email,
      success: true,
      ip,
      userAgent,
      provider: 'local',
      extra: {
        riskScore: riskResult.score,
        riskLevel: riskResult.level,
        riskFactors: riskResult.factors,
        deviceId: deviceRecordId,
        sessionId: tokenPair.sessionId,
        country: ipInfo?.country,
        city: ipInfo?.city,
        isNewDevice,
        isNewIp,
        isNewCountry: riskResult.factors.some((f) => f.name === 'new_country'),
        timezone: ctx.timezone,
        isp: ipInfo?.isp,
        ispOrganization: ipInfo?.organization,
        latitude: ipInfo?.latitude,
        longitude: ipInfo?.longitude,
        vpnDetected: ipInfo?.isVpn || false,
        torDetected: ipInfo?.isTor || false,
        proxyDetected: ipInfo?.isProxy || false,
      },
    });

    // Create security events for new device/new country
    if (isNewDevice) {
      await this.audit.createSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.NEW_DEVICE,
        severity: 'warning',
        description: `New device login: ${deviceId || 'unknown'}`,
        riskScore: riskResult.score,
        deviceId: deviceRecordId,
        sessionId: tokenPair.sessionId,
        ipAddress: ip,
        country: ipInfo?.country,
        city: ipInfo?.city,
      });
      this.notifications
        .sendNewDeviceAlert({
          userId: user.id,
          userEmail: user.email,
          deviceName: ctx.fingerprint?.deviceName,
          deviceType: ctx.fingerprint?.deviceType,
          browser: ctx.fingerprint?.browser,
          os: ctx.fingerprint?.os,
          ip: ip || 'unknown',
          location: [ipInfo?.city, ipInfo?.country].filter(Boolean).join(', ') || 'Unknown',
          time: new Date(),
        })
        .catch((err) => this.logger.error('Failed to send new device alert', err));
    }
    if (riskResult.factors.some((f) => f.name === 'new_country')) {
      await this.audit.createSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.NEW_COUNTRY,
        severity: 'warning',
        description: `Login from new country: ${ipInfo?.country || 'unknown'}`,
        deviceId: deviceRecordId,
        sessionId: tokenPair.sessionId,
        ipAddress: ip,
        country: ipInfo?.country,
        city: ipInfo?.city,
      });
    }

    await this.audit.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'user',
      entityId: user.id,
      details: { riskScore: riskResult.score, riskLevel: riskResult.level, isNewDevice },
      ipAddress: ip,
      userAgent,
      deviceId: deviceRecordId,
      sessionId: tokenPair.sessionId,
      country: ipInfo?.country,
      city: ipInfo?.city,
      severity: 'info',
    });

    this.logger.log(
      `User logged in: ${user.email} [risk: ${riskResult.level}/${riskResult.score}]`,
    );

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      riskScore: riskResult.score,
      riskLevel: riskResult.level,
    };
  }

  async verifyMfaLogin(
    mfaSessionToken: string,
    code: string,
    ip?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: AuthResponseDto['user'];
  }> {
    // Rate limit MFA attempts (5 attempts per minute per IP)
    if (ip) {
      const allowed = await this.redis.rateLimit(
        `mfa:${ip}`,
        MFA_RATE_LIMIT_ATTEMPTS,
        MFA_RATE_LIMIT_WINDOW_SECONDS,
      );
      if (!allowed) throw new UnauthorizedException('Too many MFA attempts. Try again later.');
    }

    const data = await this.redis.getMfaChallenge(mfaSessionToken);
    if (!data) throw new UnauthorizedException('MFA session expired or invalid');

    const challenge = JSON.parse(data);
    const user = await this.prisma.user.findUnique({ where: { id: challenge.userId } });
    if (!user || !user.mfaSecret) throw new UnauthorizedException('MFA not configured');

    const mfaResult = await otplib.verify({ token: code, secret: user.mfaSecret });
    const isValid = mfaResult.valid;
    if (!isValid) {
      await this.audit.createSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.MFA_FAILED,
        severity: 'warning',
        description: 'MFA verification failed during login',
      });
      throw new UnauthorizedException('Invalid MFA code');
    }

    // Clear MFA challenge
    await this.redis.deleteMfaChallenge(mfaSessionToken);

    // Generate tokens (independent session per login — limit enforced in generateTokenPair)
    const tokenPair = await this.tokenService.generateTokenPair(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      challenge.deviceRecordId,
      undefined,
      challenge.ip,
      challenge.userAgent,
    );

    if (tokenPair.evictedSessionId) {
      await this.audit.createSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.SESSION_REVOKED,
        severity: 'warning',
        description: 'Oldest session revoked because the active-session limit was reached',
        deviceId: challenge.deviceRecordId,
        sessionId: tokenPair.sessionId,
        ipAddress: challenge.ip,
        metadata: {
          revokedSessionId: tokenPair.evictedSessionId,
          newSessionId: tokenPair.sessionId,
          reason: 'MAX_ACTIVE_SESSIONS_EXCEEDED',
          platform: challenge.userAgent ? parseUserAgent(challenge.userAgent).os : undefined,
          deviceId: challenge.deviceRecordId,
        },
      });
    }

    await this.recordLogin({
      userId: user.id,
      email: user.email,
      success: true,
      ip: challenge.ip,
      userAgent: challenge.userAgent,
      provider: 'local',
      extra: {
        riskScore: challenge.riskResult?.score,
        riskLevel: challenge.riskResult?.level,
        deviceId: challenge.deviceRecordId,
        sessionId: tokenPair.sessionId,
      },
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async refreshTokens(
    refreshToken: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: AuthResponseDto['user'] }> {
    let payload: UserPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isDeleted || !user.isActive) {
      throw new UnauthorizedException('Account unavailable');
    }

    const result = await this.tokenService.rotateRefreshToken(
      refreshToken,
      { id: user.id, email: user.email, name: user.name, role: user.role },
      payload.did || 'unknown',
      ip,
      userAgent,
    );

    await this.audit.log({
      userId: user.id,
      action: 'TOKEN_REFRESH',
      entity: 'session',
      entityId: result.tokenPair.sessionId,
      ipAddress: ip,
      userAgent,
      deviceId: payload.did,
      severity: 'info',
    });

    return {
      accessToken: result.tokenPair.accessToken,
      refreshToken: result.tokenPair.refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async logout(refreshToken: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.tokenService.revokeSession(sessionId, 'user_logout');
    }
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  // ─── MFA Setup ──────────────────────────────────────────────

  async setupMfa(
    userId: string,
  ): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const secret = otplib.generateSecret();
    const otpauth = otplib.generateURI({
      strategy: 'totp',
      issuer: 'Quantora',
      label: user.email,
      secret,
    });
    const qrCode = await toDataURL(otpauth);

    // Generate backup codes
    const backupCodes = Array.from({ length: BACKUP_CODE_COUNT }, () =>
      randomBytes(BACKUP_CODE_BYTES).toString('hex'),
    );

    // Store temporarily — user must verify to enable
    await this.redis.cacheSet(`mfa_setup:${userId}`, { secret, backupCodes }, MFA_SETUP_TTL);

    return { secret, qrCode, backupCodes };
  }

  async verifyAndEnableMfa(userId: string, code: string): Promise<void> {
    const data = await this.redis.cacheGet<{ secret: string; backupCodes: string[] }>(
      `mfa_setup:${userId}`,
    );
    if (!data) throw new UnauthorizedException('MFA setup expired. Please start again.');

    const mfaResult = await otplib.verify({ token: code, secret: data.secret });
    if (!mfaResult.valid) throw new UnauthorizedException('Invalid MFA code');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: data.secret,
        mfaMethod: 'totp',
        backupCodes: JSON.stringify(data.backupCodes),
      },
    });

    await this.redis.cacheDelete(`mfa_setup:${userId}`);

    await this.audit.createSecurityEvent({
      userId,
      eventType: SecurityEventType.MFA_ENABLED,
      severity: 'info',
      description: 'MFA enabled via TOTP',
    });
  }

  async disableMfa(userId: string, password: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('User not found');

    const pwValid = await argon2.verify(user.passwordHash, password + this.pepper);
    if (!pwValid) throw new UnauthorizedException('Invalid password');

    // Verify TOTP or backup code
    let codeValid = false;
    if (user.mfaSecret) {
      const mfaResult = await otplib.verify({ token: code, secret: user.mfaSecret });
      if (mfaResult.valid) codeValid = true;
    }
    if (!codeValid && user.backupCodes) {
      const codes: string[] = JSON.parse(user.backupCodes);
      const idx = codes.indexOf(code);
      if (idx >= 0) {
        codes.splice(idx, 1);
        await this.prisma.user.update({
          where: { id: userId },
          data: { backupCodes: JSON.stringify(codes) },
        });
        codeValid = true;
      }
    }

    if (!codeValid) throw new UnauthorizedException('Invalid MFA code or backup code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null, mfaMethod: null, backupCodes: null },
    });

    await this.audit.createSecurityEvent({
      userId,
      eventType: SecurityEventType.MFA_DISABLED,
      severity: 'warning',
      description: 'MFA disabled',
    });
  }

  // ─── Helpers ────────────────────────────────────────────────

  private async registerOrUpdateDevice(
    userId: string,
    ctx: {
      deviceId: string;
      fingerprint?: Partial<DeviceFingerprint>;
      ip?: string;
      userAgent?: string;
      ipInfo?: IpInfo;
      headers?: DeviceRequestHeaders;
      loginMethod?: string;
    },
  ) {
    const fingerprintHash = ctx.fingerprint ? this.fingerprintService.hash(ctx.fingerprint) : null;

    // Derive client-identifying fields from the User-Agent server-side.
    // These are authoritative: anything the browser reports can be spoofed,
    // but the UA is still the standard cross-client authority.
    const ua = ctx.userAgent ? new UAParser(ctx.userAgent).getResult() : undefined;
    const deviceName =
      [ua?.device?.vendor, ua?.device?.model].filter(Boolean).join(' ') ||
      ctx.fingerprint?.deviceName ||
      undefined;

    const payload = {
      deviceName,
      deviceType: ua?.device?.type || ctx.fingerprint?.deviceType || undefined,
      browser: ua?.browser?.name || ctx.fingerprint?.browser || undefined,
      browserVersion: ua?.browser?.version || ctx.fingerprint?.browserVersion || undefined,
      engine: ua?.engine?.name || ctx.fingerprint?.engine || undefined,
      engineVersion: ua?.engine?.version || ctx.fingerprint?.engineVersion || undefined,
      os: ua?.os?.name || ctx.fingerprint?.os || undefined,
      osVersion: ua?.os?.version || ctx.fingerprint?.osVersion || undefined,
      cpuArchitecture: ua?.cpu?.architecture || ctx.fingerprint?.cpuArchitecture || undefined,
      manufacturer: ua?.device?.vendor || ctx.fingerprint?.manufacturer || undefined,
      model: ua?.device?.model || ctx.fingerprint?.model || undefined,

      platform: ctx.fingerprint?.platform || undefined,
      hostname: ctx.fingerprint?.hostname || undefined,
      hardwareConcurrency: ctx.fingerprint?.hardwareConcurrency ?? undefined,
      deviceMemory: ctx.fingerprint?.deviceMemory ?? undefined,
      screenResolution: ctx.fingerprint?.screenResolution || undefined,
      viewport: ctx.fingerprint?.viewport || undefined,
      pixelRatio: ctx.fingerprint?.pixelRatio ?? undefined,
      timezone: ctx.fingerprint?.timezone || undefined,
      language: ctx.fingerprint?.language || undefined,
      languages: ctx.fingerprint?.languages?.length ? ctx.fingerprint.languages : undefined,

      webglVendor: ctx.fingerprint?.webglVendor || undefined,
      webglRenderer: ctx.fingerprint?.webglRenderer || undefined,
      canvasFingerprint: ctx.fingerprint?.canvasFingerprint || undefined,
      audioFingerprint: ctx.fingerprint?.audioFingerprint || undefined,
      fontsHash: ctx.fingerprint?.fontsHash || undefined,
      pluginsHash: ctx.fingerprint?.pluginsHash || undefined,
      touchSupport: ctx.fingerprint?.touchSupport ?? undefined,
      cookiesEnabled: ctx.fingerprint?.cookiesEnabled ?? undefined,
      localStorage: ctx.fingerprint?.localStorage ?? undefined,
      sessionStorage: ctx.fingerprint?.sessionStorage ?? undefined,
      batterySupported: ctx.fingerprint?.batterySupported ?? undefined,
      batteryLevel: ctx.fingerprint?.batteryLevel ?? undefined,
      charging: ctx.fingerprint?.charging ?? undefined,
      connectionDownlink: ctx.fingerprint?.connectionDownlink ?? undefined,
      effectiveNetworkType: ctx.fingerprint?.effectiveNetworkType || undefined,

      publicIp: ctx.ip || undefined,
      userAgent: ctx.userAgent || undefined,
      acceptLanguage: ctx.headers?.acceptLanguage || undefined,
      acceptEncoding: ctx.headers?.acceptEncoding || undefined,
      acceptHeader: ctx.headers?.acceptHeader || undefined,
      referer: ctx.headers?.referer || undefined,
      origin: ctx.headers?.origin || undefined,

      loginMethod: ctx.loginMethod || 'local',
    };

    return this.prisma.device.upsert({
      where: { deviceId: ctx.deviceId },
      create: {
        userId,
        deviceId: ctx.deviceId,
        fingerprintHash,
        ...payload,
        country: ctx.ipInfo?.country,
        state: ctx.ipInfo?.state,
        city: ctx.ipInfo?.city,
        postalCode: ctx.ipInfo?.postalCode,
        latitude: ctx.ipInfo?.latitude,
        longitude: ctx.ipInfo?.longitude,
        isp: ctx.ipInfo?.isp,
        networkType: ctx.ipInfo?.networkType,
        vpnDetected: ctx.ipInfo?.isVpn ?? false,
        proxyDetected: ctx.ipInfo?.isProxy ?? false,
        torDetected: ctx.ipInfo?.isTor ?? false,
        firstLogin: new Date(),
        lastLogin: new Date(),
        lastActivity: new Date(),
      },
      update: {
        ...payload,
        fingerprintHash: fingerprintHash || undefined,
        country: ctx.ipInfo?.country || undefined,
        state: ctx.ipInfo?.state || undefined,
        city: ctx.ipInfo?.city || undefined,
        postalCode: ctx.ipInfo?.postalCode || undefined,
        latitude: ctx.ipInfo?.latitude ?? undefined,
        longitude: ctx.ipInfo?.longitude ?? undefined,
        isp: ctx.ipInfo?.isp || undefined,
        networkType: ctx.ipInfo?.networkType || undefined,
        vpnDetected: ctx.ipInfo?.isVpn ?? undefined,
        proxyDetected: ctx.ipInfo?.isProxy ?? undefined,
        torDetected: ctx.ipInfo?.isTor ?? undefined,
        lastActivity: new Date(),
      },
    });
  }

  private async recordLogin(params: RecordLoginParams) {
    const {
      userId,
      email,
      success,
      ip,
      userAgent,
      provider = 'local',
      failureReason,
      extra = {},
    } = params;
    try {
      // Derive client/device fields server-side from the User-Agent so login
      // history rows are enriched even when the client sends no fingerprint.
      const ua = userAgent ? new UAParser(userAgent).getResult() : undefined;
      const deviceName =
        [ua?.device?.vendor, ua?.device?.model].filter(Boolean).join(' ') || undefined;
      await this.prisma.loginHistory.create({
        data: {
          userId: typeof userId === 'string' ? userId : null,
          email,
          success,
          provider,
          failureReason,
          loginMethod: extra.loginMethod || (provider === 'local' ? 'local' : provider),
          ipAddress: ip,
          userAgent,
          deviceId: extra.deviceId,
          sessionId: extra.sessionId,
          deviceName: extra.deviceName || deviceName,
          deviceType: extra.deviceType || ua?.device?.type || undefined,
          browser: extra.browser || ua?.browser?.name || undefined,
          os: extra.os || ua?.os?.name || undefined,
          timezone: extra.timezone,
          country: extra.country,
          city: extra.city,
          isp: extra.isp,
          ispOrganization: extra.ispOrganization,
          latitude: extra.latitude,
          longitude: extra.longitude,
          riskScore: extra.riskScore || 0,
          riskLevel: extra.riskLevel || 'low',
          riskFactors: extra.riskFactors || undefined,
          isNewDevice: extra.isNewDevice || false,
          isNewCountry: extra.isNewCountry || false,
          isNewIp: extra.isNewIp || false,
          vpnDetected: extra.vpnDetected || false,
          proxyDetected: extra.proxyDetected || false,
          torDetected: extra.torDetected || false,
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to record login history: ${e}`);
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        mfaEnabled: true,
        mfaMethod: true,
        lastLoginAt: true,
        createdAt: true,
        preferences: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async getLoginHistory(userId: string, limit = 10) {
    return this.audit.getLoginHistory(userId, limit);
  }

  async getSecurityEvents(userId: string) {
    return this.audit.getSecurityEvents(userId);
  }

  async acknowledgeSecurityEvent(eventId: string, userId: string): Promise<void> {
    await this.audit.acknowledgeEvent(eventId, userId);
  }

  /**
   * Global cleanup of login history:
   * 1. Removes all entries older than LOGIN_HISTORY_RETENTION_DAYS (30 days)
   * 2. Keeps only the latest LOGIN_HISTORY_MAX_ENTRIES (20) per user
   */
  async cleanupLoginHistory(): Promise<{ deleted: number }> {
    const cutoff = loginHistoryCutoff();

    // Delete expired entries (older than 30 days)
    const expired = await this.prisma.loginHistory.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    // For each user, keep only the latest LOGIN_HISTORY_MAX_ENTRIES entries
    // and delete the rest
    const overLimit = await this.prisma.$queryRaw<{ id: string }[]>`
      DELETE FROM login_history lh
      USING (
        SELECT id, row_number() OVER (
          PARTITION BY user_id ORDER BY created_at DESC
        ) AS rn
        FROM login_history
        WHERE user_id IS NOT NULL AND created_at >= ${cutoff}
      ) ranked
      WHERE lh.id = ranked.id AND ranked.rn > ${LOGIN_HISTORY_MAX_ENTRIES}
      RETURNING lh.id
    `;

    const deleted = expired.count + overLimit.length;
    if (deleted > 0) {
      this.logger.log(`Login history cleanup removed ${deleted} records`);
    }
    return { deleted };
  }

  async googleLogin(
    profile: {
      email: string;
      name: string;
      picture?: string;
      provider: string;
      providerId: string;
    },
    ip?: string,
    userAgent?: string,
  ) {
    // Same pattern with device registration at login — extract to reuse
    let user = await this.prisma.user.findUnique({ where: { email: profile.email } });
    if (user && (user.isDeleted || !user.isActive))
      throw new ForbiddenException('Account unavailable');

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          provider: 'google',
          isEmailVerified: true,
          oauthAccounts: {
            create: {
              provider: profile.provider,
              providerId: profile.providerId,
              email: profile.email,
              name: profile.name,
              avatarUrl: profile.picture,
            },
          },
          preferences: { create: { language: 'en', theme: 'slate' } },
        },
      });
    } else {
      const existingOAuth = await this.prisma.oAuthAccount.findUnique({
        where: {
          provider_providerId: { provider: profile.provider, providerId: profile.providerId },
        },
      });
      if (!existingOAuth) {
        await this.prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: profile.provider,
            providerId: profile.providerId,
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.picture,
          },
        });
      }
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const tokenPair = await this.tokenService.generateTokenPair(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      'google-oauth',
      undefined,
      ip,
      userAgent,
    );

    if (tokenPair.evictedSessionId) {
      await this.audit.createSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.SESSION_REVOKED,
        severity: 'warning',
        description: 'Oldest session revoked because the active-session limit was reached',
        deviceId: 'google-oauth',
        sessionId: tokenPair.sessionId,
        ipAddress: ip,
        metadata: {
          revokedSessionId: tokenPair.evictedSessionId,
          newSessionId: tokenPair.sessionId,
          reason: 'MAX_ACTIVE_SESSIONS_EXCEEDED',
          platform: userAgent ? parseUserAgent(userAgent).os : undefined,
          deviceId: 'google-oauth',
        },
      });
    }

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.isDeleted || !user.passwordHash) return null;
    const isValid = await argon2.verify(user.passwordHash, password + this.pepper);
    if (!isValid) return null;
    const { passwordHash, ...result } = user;
    return result;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token, isDeleted: false },
    });
    if (!user) throw new UnauthorizedException('Invalid verification token');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });
    return { message: 'Email verified successfully' };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.isDeleted)
      return { message: 'If an account exists, a reset link has been sent' };
    const resetToken = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: resetToken },
    });
    return { message: 'If an account exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token, isDeleted: false },
    });
    if (!user) throw new UnauthorizedException('Invalid or expired reset token');

    const passwordHash = await argon2.hash(newPassword + this.pepper, {
      type: argon2.argon2id,
      memoryCost: ARGON_MEMORY_COST,
      timeCost: ARGON_TIME_COST,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, emailVerifyToken: null },
    });

    // Revoke all sessions on password reset
    await this.tokenService.revokeAllUserSessions(user.id, undefined, 'password_reset');

    await this.audit.createSecurityEvent({
      userId: user.id,
      eventType: SecurityEventType.PASSWORD_RESET,
      severity: 'warning',
      description: 'Password was reset',
    });

    return { message: 'Password reset successfully' };
  }
}
