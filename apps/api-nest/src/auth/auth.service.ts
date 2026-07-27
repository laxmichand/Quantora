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
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Please verify your email before logging in');
    }

    this.logger.log(`User logged in: ${user.email}`);

    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.isDeleted) {
      return null;
    }

    const isValid = await bcrypt.compare(password + this.pepper, user.passwordHash);
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
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

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
