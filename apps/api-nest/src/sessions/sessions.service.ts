import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../tokens/token.service';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async getSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.tokenService.getActiveSessions(userId);
    return sessions.map((s) => ({
      id: s.id,
      deviceId: s.deviceId,
      deviceName: s.device?.deviceName || 'Unknown Device',
      deviceType: s.device?.deviceType || 'unknown',
      browser: s.device?.browser || 'Unknown',
      os: s.device?.os || 'Unknown',
      ipAddress: s.ipAddress,
      location: [s.device?.city, s.device?.country].filter(Boolean).join(', ') || 'Unknown',
      isCurrent: s.id === currentSessionId,
      loginTime: s.loginTime,
      lastActivity: s.lastActivity,
      expiresAt: s.expiresAt,
      trustedDevice: s.device?.trustedDevice || false,
    }));
  }

  async logoutSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId, revoked: false },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.tokenService.revokeSession(sessionId, 'user_logout');
    this.logger.log(`Session ${sessionId} revoked by user ${userId}`);
  }

  async logoutCurrentSession(
    userId: string,
    currentSessionId: string,
    refreshToken?: string,
  ): Promise<void> {
    if (refreshToken) {
      // Also revoke legacy refresh token
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId, isRevoked: false },
        data: { isRevoked: true },
      });
    }
    await this.tokenService.revokeSession(currentSessionId, 'user_logout');
  }

  async logoutAllSessions(userId: string, exceptSessionId?: string): Promise<number> {
    return this.tokenService.revokeAllUserSessions(userId, exceptSessionId, 'user_logout_all');
  }

  async logoutOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    return this.tokenService.revokeAllUserSessions(userId, currentSessionId, 'user_logout_others');
  }

  async logoutDeviceSessions(
    userId: string,
    deviceId: string,
    exceptSessionId?: string,
  ): Promise<number> {
    const where: any = { userId, deviceId, revoked: false };
    if (exceptSessionId) where.id = { not: exceptSessionId };

    const sessions = await this.prisma.session.findMany({ where, select: { id: true } });
    for (const session of sessions) {
      await this.tokenService.revokeSession(session.id, 'device_logout');
    }
    return sessions.length;
  }

  async getCurrentSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
      include: {
        device: {
          select: {
            id: true,
            deviceId: true,
            deviceName: true,
            deviceType: true,
            browser: true,
            browserVersion: true,
            os: true,
            osVersion: true,
            city: true,
            country: true,
            publicIp: true,
            trustedDevice: true,
            trustedUntil: true,
            loginCount: true,
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return {
      id: session.id,
      device: session.device,
      ipAddress: session.ipAddress,
      loginTime: session.loginTime,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
    };
  }
}
