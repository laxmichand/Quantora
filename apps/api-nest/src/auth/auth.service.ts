import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserPayload } from '../common/interfaces/user-payload.interface';
import { randomBytes } from 'crypto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MIN = 15;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly pepper = process.env.BCRYPT_PEPPER || '';
  private readonly refreshExpiryDays = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '7', 10);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password + this.pepper, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        provider: 'local',
        isEmailVerified: false,
        emailVerifyToken: randomBytes(32).toString('hex'),
        preferences: {
          create: { language: 'en', theme: 'slate' },
        },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    this.logger.log(`User registered: ${user.email}`);
    return this.generateTokens(user);
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.isDeleted) {
      await this.recordLogin(null, dto.email, false, ip, userAgent, 'local', 'Invalid credentials');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check lockout
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      await this.recordLogin(user.id, user.email, false, ip, userAgent, 'local', 'Account locked');
      throw new ForbiddenException(`Account locked. Try again in ${remaining} minutes`);
    }

    if (!user.isActive) {
      await this.recordLogin(user.id, user.email, false, ip, userAgent, 'local', 'Account deactivated');
      throw new ForbiddenException('Account is deactivated');
    }

    // Verify password
    const isValid = await bcrypt.compare(dto.password + this.pepper, user.passwordHash!);
    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MIN * 60 * 1000);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: attempts, lockedUntil },
        });
        await this.recordLogin(user.id, user.email, false, ip, userAgent, 'local', 'Account locked');
        throw new ForbiddenException(`Account locked. Try again in ${LOCKOUT_DURATION_MIN} minutes`);
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts },
      });
      await this.recordLogin(user.id, user.email, false, ip, userAgent, 'local', 'Invalid credentials');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      await this.recordLogin(user.id, user.email, false, ip, userAgent, 'local', 'Email not verified');
      throw new ForbiddenException('Please verify your email before logging in');
    }

    // Success — reset lockout counter
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    await this.recordLogin(user.id, user.email, true, ip, userAgent, 'local', null);
    this.logger.log(`User logged in: ${user.email}`);

    return this.generateTokens(user);
  }

  async googleLogin(profile: {
    email: string;
    name: string;
    picture?: string;
    provider: string;
    providerId: string;
  }, ip?: string, userAgent?: string): Promise<AuthResponseDto> {
    // Find existing user by email or OAuth account
    let user = await this.prisma.user.findUnique({ where: { email: profile.email } });
    if (user && user.isDeleted) {
      throw new ForbiddenException('Account unavailable');
    }

    if (!user) {
      // Create new user via OAuth
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
          preferences: {
            create: { language: 'en', theme: 'slate' },
          },
        },
      });
    } else {
      // Link OAuth account to existing user
      const existingOAuth = await this.prisma.oAuthAccount.findUnique({
        where: { provider_providerId: { provider: profile.provider, providerId: profile.providerId } },
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

    // Mark last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.recordLogin(user.id, user.email, true, ip, userAgent, 'google', null);
    this.logger.log(`User logged in via Google: ${user.email}`);

    return this.generateTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  }

  async getLoginHistory(userId: string, limit = 10) {
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        success: true,
        ipAddress: true,
        userAgent: true,
        provider: true,
        failureReason: true,
        createdAt: true,
      },
    });
  }

  private async recordLogin(
    userIdOrEmail: string | null,
    email: string,
    success: boolean,
    ip?: string,
    userAgent?: string,
    provider = 'local',
    failureReason?: string | null,
  ) {
    try {
      await this.prisma.loginHistory.create({
        data: {
          userId: typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@') ? null : userIdOrEmail,
          email,
          success,
          ipAddress: ip,
          userAgent,
          provider,
          failureReason,
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to record login history: ${e}`);
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.isDeleted) {
      return null;
    }

    const isValid = await bcrypt.compare(password + this.pepper, user.passwordHash!);
    if (!isValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.isRevoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > stored.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (stored.user.isDeleted || !stored.user.isActive) {
      throw new UnauthorizedException('Account unavailable');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true },
    });

    const { passwordHash, ...user } = stored.user;
    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken, isRevoked: false },
      data: { isRevoked: true },
    });
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
        createdAt: true,
        preferences: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    name: string;
    role: string;
  }): Promise<AuthResponseDto> {
    const payload: UserPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(payload, { expiresIn: `${this.refreshExpiryDays}d` }),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + this.refreshExpiryDays * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token, isDeleted: false },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });

    this.logger.log(`Email verified: ${user.email}`);
    return { message: 'Email verified successfully' };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.isDeleted) {
      return { message: 'If an account exists, a reset link has been sent' };
    }

    const resetToken = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: resetToken },
    });

    this.logger.log(`Password reset requested for: ${email}`);
    return { message: 'If an account exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token, isDeleted: false },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword + this.pepper, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, emailVerifyToken: null },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });

    this.logger.log(`Password reset completed for: ${user.email}`);
    return { message: 'Password reset successfully' };
  }
}
