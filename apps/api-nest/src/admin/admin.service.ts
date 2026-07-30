import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../tokens/token.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async searchSessions(query: {
    userId?: string;
    deviceId?: string;
    ip?: string;
    status?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.deviceId) where.deviceId = query.deviceId;
    if (query.ip) where.ipAddress = query.ip;
    if (query.status === 'active') where.revoked = false;
    else if (query.status === 'revoked') where.revoked = true;

    return this.prisma.session.findMany({
      where,
      orderBy: { lastActivity: 'desc' },
      take: query.limit || 50,
      include: {
        user: { select: { id: true, email: true, name: true } },
        device: { select: { deviceName: true, deviceType: true, browser: true, os: true } },
      },
    });
  }

  async searchDevices(query: {
    userId?: string;
    deviceId?: string;
    ip?: string;
    status?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.deviceId) where.deviceId = query.deviceId;
    if (query.ip) where.publicIp = query.ip;
    if (query.status) where.status = query.status;

    return this.prisma.device.findMany({
      where,
      orderBy: { lastActivity: 'desc' },
      take: query.limit || 50,
      include: {
        user: { select: { id: true, email: true, name: true } },
        sessions: { where: { revoked: false }, select: { id: true, lastActivity: true } },
      },
    });
  }

  async forceLogoutUser(adminId: string, targetUserId: string, reason?: string): Promise<number> {
    const count = await this.tokenService.revokeAllUserSessions(
      targetUserId,
      undefined,
      'admin_force_logout',
    );
    this.logger.warn(
      `Admin ${adminId} force-logged out user ${targetUserId}. Reason: ${reason || 'Not specified'}`,
    );
    return count;
  }

  async blockDevice(adminId: string, deviceId: string): Promise<void> {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('Device not found');

    await this.prisma.device.update({
      where: { id: deviceId },
      data: { status: 'blocked', riskLevel: 'critical' },
    });

    // Revoke all sessions for this device
    await this.tokenService.revokeSessionsByDeviceId(
      device.userId,
      deviceId,
      'admin_blocked_device',
    );
    this.logger.warn(
      `Admin ${adminId} blocked device ${deviceId} belonging to user ${device.userId}`,
    );
  }

  async blockIp(adminId: string, ip: string): Promise<void> {
    // Store blocked IPs (in production, use Redis or a dedicated table)
    // For now, we log it and can check during auth
    this.logger.warn(`Admin ${adminId} blocked IP ${ip}`);
  }

  async getAuditLogs(query: {
    userId?: string;
    action?: string;
    severity?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    if (query.severity) where.severity = query.severity;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit || 100,
    });
  }

  async getUserDetail(userId: string) {
    return this.prisma.user.findUnique({
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
        failedLoginAttempts: true,
        lockedUntil: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            devices: true,
            sessions: { where: { revoked: false } },
            loginHistories: true,
            securityEvents: true,
          },
        },
      },
    });
  }
}
