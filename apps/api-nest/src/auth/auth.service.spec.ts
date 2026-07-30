import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { RedisService } from '../common/redis/redis.service';
import { TokenService } from '../tokens/token.service';
import { FingerprintService } from '../fingerprint/fingerprint.service';
import { RiskEngineService } from '../risk-engine/risk-engine.service';
import { IpIntelligenceService } from '../common/services/ip-intelligence.service';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as argon2 from 'argon2';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'JBSWY3DPEHPK3PXP'),
  verify: jest.fn(() => Promise.resolve({ valid: true, delta: 0 })),
  generateURI: jest.fn(() => 'otpauth://totp/test'),
}));

const ARGON2_MEMORY_COST = 19456;
const ARGON2_TIME_COST = 2;

const TEST_ACCESS_TOKEN = 'mock-access-token';
const TEST_REFRESH_TOKEN = 'mock-refresh-token';
const TEST_SESSION_ID = 'test-session-id';

const tokenPair = {
  accessToken: TEST_ACCESS_TOKEN,
  refreshToken: TEST_REFRESH_TOKEN,
  sessionId: TEST_SESSION_ID,
};

const tokenService = new (class {
  generateTokenPair = jest.fn().mockResolvedValue(tokenPair);
  rotateRefreshToken = jest.fn().mockImplementation((token: string) => {
    if (token === 'revoked' || token === 'expired')
      throw new UnauthorizedException('Invalid refresh token');
    return Promise.resolve({ tokenPair, ...tokenPair });
  });
  revokeSession = jest.fn();
  revokeAllUserSessions = jest.fn();
  getActiveSessions = jest.fn();
})();

const mockSvc = () => ({
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  evaluate: jest.fn().mockResolvedValue({ blocked: false, level: 'low', score: 0, factors: [] }),
  register: jest.fn(),
  revokeAllUserSessions: jest.fn(),
  revokeSession: jest.fn(),
  getActiveSessions: jest.fn(),
  generateTokenPair: jest.fn().mockResolvedValue(tokenPair),
  rotateRefreshToken: jest.fn().mockResolvedValue({ tokenPair, ...tokenPair }),
  createSecurityEvent: jest.fn(),
  getLoginHistory: jest.fn(),
  getSecurityEvents: jest.fn(),
  log: jest.fn(),
  lookup: jest.fn().mockResolvedValue(null),
  getClientIp: jest.fn(),
  collect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
});

const mockLoginCtx = (overrides = {}) => ({
  ip: '127.0.0.1',
  userAgent: 'test-user-agent',
  deviceId: 'test-device-id',
  ...overrides,
});

const TEST_USER_ID = 'test-user-id';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'ValidP@ss1';
const TEST_NAME = 'Test User';

const RESET_MESSAGE = 'If an account exists, a reset link has been sent';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;

  let passwordHash: string;

  const mockUser = {
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    passwordHash: '',
    name: TEST_NAME,
    role: 'user',
    isActive: true,
    isEmailVerified: true,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    passwordHash = await argon2.hash(TEST_PASSWORD + (process.env.BCRYPT_PEPPER || ''), {
      type: argon2.argon2id,
      memoryCost: ARGON2_MEMORY_COST,
      timeCost: ARGON2_TIME_COST,
    });
  });

  beforeEach(async () => {
    mockUser.passwordHash = passwordHash;
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findFirst: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      loginHistory: {
        create: jest.fn(),
      },
      device: {
        upsert: jest.fn().mockResolvedValue({ id: 'test-device-id' }),
        update: jest.fn(),
      },
    };

    jwt = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
      verifyAsync: jest.fn().mockImplementation((token: string) => {
        if (token === 'bad-token') throw new Error('jwt invalid');
        return Promise.resolve({
          sub: TEST_USER_ID,
          sid: TEST_SESSION_ID,
          email: TEST_EMAIL,
          role: 'user',
        });
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: RedisService, useValue: mockSvc() },
        { provide: TokenService, useValue: tokenService },
        { provide: FingerprintService, useValue: mockSvc() },
        { provide: RiskEngineService, useValue: mockSvc() },
        { provide: IpIntelligenceService, useValue: mockSvc() },
        { provide: SecurityAuditService, useValue: mockSvc() },
        {
          provide: NotificationsService,
          useValue: { sendNewDeviceAlert: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const newEmail = 'new@example.com';

    it('should register a new user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: TEST_USER_ID,
        email: newEmail,
        name: 'New',
        role: 'user',
      });
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register({
        email: newEmail,
        password: TEST_PASSWORD,
        name: 'New',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(newEmail);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('should return user on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(TEST_EMAIL, TEST_PASSWORD);
      expect(result).toBeDefined();
      expect(result.email).toBe(TEST_EMAIL);
      expect(result.passwordHash).toBeUndefined();
    });

    it('should return null for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(TEST_EMAIL, 'wrong-password');
      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('unknown@example.com', TEST_PASSWORD);
      expect(result).toBeNull();
    });

    it('should return null for deleted user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isDeleted: true });

      const result = await service.validateUser(TEST_EMAIL, TEST_PASSWORD);
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login(
        { email: TEST_EMAIL, password: TEST_PASSWORD },
        mockLoginCtx(),
      );
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: TEST_EMAIL, password: 'wrong-password' }, mockLoginCtx()),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for inactive user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        service.login({ email: TEST_EMAIL, password: TEST_PASSWORD }, mockLoginCtx()),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for unverified email', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isEmailVerified: false });

      await expect(
        service.login({ email: TEST_EMAIL, password: TEST_PASSWORD }, mockLoginCtx()),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should increment failedLoginAttempts on wrong password', async () => {
      const initialAttempts = 0;
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: initialAttempts,
      });
      prisma.user.update.mockResolvedValue({});

      await expect(
        service.login({ email: TEST_EMAIL, password: 'wrong-password' }, mockLoginCtx()),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { failedLoginAttempts: initialAttempts + 1 },
      });
    });

    it('should lock account after max failed attempts', async () => {
      const MAX_ATTEMPTS = 5;
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: MAX_ATTEMPTS - 1,
      });
      prisma.user.update.mockResolvedValue({});

      await expect(
        service.login({ email: TEST_EMAIL, password: 'wrong-password' }, mockLoginCtx()),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          failedLoginAttempts: MAX_ATTEMPTS,
          lockedUntil: expect.any(Date),
        },
      });
    });

    it('should reject login when account is locked', async () => {
      const LOCK_DURATION_MS = 15 * 60 * 1000;
      const futureDate = new Date(Date.now() + LOCK_DURATION_MS);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        lockedUntil: futureDate,
      });

      await expect(
        service.login({ email: TEST_EMAIL, password: TEST_PASSWORD }, mockLoginCtx()),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reset counter on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 3,
      });
      prisma.user.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      await service.login({ email: TEST_EMAIL, password: TEST_PASSWORD }, mockLoginCtx());

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: expect.any(Date) },
      });
    });
  });

  describe('refreshTokens', () => {
    const FUTURE_MS = 86_400_000;

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
    });

    it('should refresh tokens successfully', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'refresh-token-id',
        token: 'old-refresh',
        expiresAt: new Date(Date.now() + FUTURE_MS),
        isRevoked: false,
        userAgent: 'test-user-agent',
        ipAddress: '127.0.0.1',
        user: mockUser,
      });
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshTokens('old-refresh');
      expect(result.accessToken).toBeDefined();
    });

    it('should throw for revoked token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'refresh-token-id',
        token: 'revoked',
        expiresAt: new Date(Date.now() + FUTURE_MS),
        isRevoked: true,
        user: mockUser,
      });

      await expect(service.refreshTokens('revoked')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for expired token', async () => {
      const PAST_MS = 1_000;
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'refresh-token-id',
        token: 'expired',
        expiresAt: new Date(Date.now() - PAST_MS),
        isRevoked: false,
        user: mockUser,
      });

      await expect(service.refreshTokens('expired')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke refresh token', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('some-token');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { token: 'some-token', isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});

      const result = await service.verifyEmail('valid-token');
      expect(result.message).toBe('Email verified successfully');
    });

    it('should throw for invalid token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('requestPasswordReset', () => {
    it('should always return success message (prevents email enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset('unknown@example.com');
      expect(result.message).toBe(RESET_MESSAGE);
    });

    it('should generate reset token for existing user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});

      const result = await service.requestPasswordReset(TEST_EMAIL);
      expect(result.message).toBe(RESET_MESSAGE);
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });
});
