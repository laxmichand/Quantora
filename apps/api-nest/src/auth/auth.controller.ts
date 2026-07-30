import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Patch,
  Res,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MfaSetupDto, MfaVerifyDto, MfaDisableDto } from './dto/mfa.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload } from '../common/interfaces/user-payload.interface';
import { Public } from '../common/decorators/public.decorator';
import { SecurityAuditService } from '../security-audit/security-audit.service';

const ACCESS_TOKEN_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_LOGIN_HISTORY_LIMIT = 10;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly audit: SecurityAuditService,
  ) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto, req.ip, req.headers['user-agent']);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body() dto: LoginDto,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      deviceId: dto.deviceId,
      fingerprint: dto.fingerprint,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezone,
    });

    if (result.requiresMfa) {
      return {
        requiresMfa: true,
        mfaSessionToken: result.mfaSessionToken,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
      };
    }

    this.setAuthCookies(res, result.accessToken!, result.refreshToken!);
    return { user: result.user, riskScore: result.riskScore, riskLevel: result.riskLevel };
  }

  @Post('login/mfa')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MFA during login' })
  async verifyMfa(
    @Body() dto: MfaVerifyDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyMfaLogin(dto.mfaSessionToken!, dto.code, req.ip);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?._qtr;
    if (!refreshToken) {
      const oldToken = req.cookies?.refreshToken;
      if (oldToken) {
        try {
          await this.authService.logout(oldToken);
        } catch {
          /* stale token — ignore */
        }
        res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
        res.clearCookie('refreshToken', { path: '/' });
      }
      throw new UnauthorizedException('No refresh token');
    }
    try {
      const result = await this.authService.refreshTokens(
        refreshToken,
        req.ip,
        req.headers['user-agent'],
      );
      this.setAuthCookies(res, result.accessToken, result.refreshToken);
      return { user: result.user };
    } catch (e: any) {
      // Token reuse or invalid token — clear stale cookies so the client
      // doesn't loop retrying the same dead token
      this.clearAuthCookies(res);
      throw e;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?._qtr || req.cookies?.refreshToken;
    const sessionId = (req as any).sessionId;
    if (refreshToken) {
      await this.authService.logout(refreshToken, sessionId);
    }
    this.clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: UserPayload) {
    return this.authService.getProfile(user.sub);
  }

  @Get('verify-email/:token')
  @Public()
  @ApiOperation({ summary: 'Verify email address' })
  async verifyEmail(@Request() req: any) {
    return this.authService.verifyEmail(req.params.token);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Patch('reset-password')
  @Public()
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body('token') token: string, @Body('password') password: string) {
    return this.authService.resetPassword(token, password);
  }

  // ─── Google OAuth ─────────────────────────────────────────

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Request() req: any, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user, req.ip, req.headers['user-agent']);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/callback`);
  }

  // ─── MFA ──────────────────────────────────────────────────

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup MFA (generates TOTP secret + QR code)' })
  async setupMfa(@CurrentUser() user: UserPayload) {
    return this.authService.setupMfa(user.sub);
  }

  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify and enable MFA' })
  async verifyMfaSetup(@CurrentUser() user: UserPayload, @Body() dto: MfaVerifyDto) {
    await this.authService.verifyAndEnableMfa(user.sub, dto.code);
    return { message: 'MFA enabled successfully' };
  }

  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA' })
  async disableMfa(@CurrentUser() user: UserPayload, @Body() dto: MfaDisableDto) {
    await this.authService.disableMfa(user.sub, dto.password, dto.code);
    return { message: 'MFA disabled' };
  }

  // ─── Security Events ─────────────────────────────────────

  @Get('login-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get login history' })
  async getLoginHistory(@CurrentUser() user: UserPayload, @Query('limit') limit?: string) {
    return this.authService.getLoginHistory(
      user.sub,
      limit ? parseInt(limit, 10) : DEFAULT_LOGIN_HISTORY_LIMIT,
    );
  }

  @Get('security-events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get security events' })
  async getSecurityEvents(@CurrentUser() user: UserPayload) {
    return this.authService.getSecurityEvents(user.sub);
  }

  // ─── Cookies ──────────────────────────────────────────────

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('_qta', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
    });
    res.cookie('_qtr', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('_qta', { path: '/' });
    res.clearCookie('_qtr', { path: '/api/auth' });
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    res.clearCookie('refreshToken', { path: '/' });
  }
}
