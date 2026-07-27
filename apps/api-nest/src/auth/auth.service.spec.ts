import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;

  const testPassword = 'Test1234';
  let passwordHash: string;

  const mockUser = {
    id: 'user-123',
    email: 'test@test.com',
    passwordHash: '',
    name: 'Test User',
    role: 'user',
    isActive: true,
    isEmailVerified: true,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(testPassword + (process.env.BCRYPT_PEPPER || ''), 12);
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
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    jwt = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-123',
        email: 'new@test.com',
        name: 'New',
        role: 'user',
      });
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register({
        email: 'new@test.com',
        password: 'Test1234',
        name: 'New',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('new@test.com');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@test.com', password: 'Test1234', name: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('should return user on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@test.com', 'Test1234');
      expect(result).toBeDefined();
      expect(result.email).toBe('test@test.com');
      expect(result.passwordHash).toBeUndefined();
    });

    it('should return null for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@test.com', 'wrong');
      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('noone@test.com', 'Test1234');
      expect(result).toBeNull();
    });

    it('should return null for deleted user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isDeleted: true });

      const result = await service.validateUser('test@test.com', 'Test1234');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: 'test@test.com', password: 'Test1234' });
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException for inactive user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.login({ email: 'test@test.com', password: 'Test1234' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for unverified email', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isEmailVerified: false });

      await expect(service.login({ email: 'test@test.com', password: 'Test1234' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: 'old-refresh',
        expiresAt: new Date(Date.now() + 86400000),
        isRevoked: false,
        user: { ...mockUser, passwordHash: 'hash' },
      });
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshTokens('old-refresh');
      expect(result.accessToken).toBeDefined();
      expect(prisma.refreshToken.update).toHaveBeenCalled();
    });

    it('should throw for revoked token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: 'revoked',
        expiresAt: new Date(Date.now() + 86400000),
        isRevoked: true,
        user: mockUser,
      });

      await expect(service.refreshTokens('revoked')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for expired token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: 'expired',
        expiresAt: new Date(Date.now() - 1000),
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

      const result = await service.requestPasswordReset('nonexistent@test.com');
      expect(result.message).toBe('If an account exists, a reset link has been sent');
    });

    it('should generate reset token for existing user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});

      const result = await service.requestPasswordReset('test@test.com');
      expect(result.message).toBe('If an account exists, a reset link has been sent');
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });
});
