import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityEventType } from './security-event.constants';

export interface AuditEntry {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  details?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  sessionId?: string;
  country?: string;
  city?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  riskScore?: number;
}

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId || null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId || null,
          oldValue: entry.oldValue || undefined,
          newValue: entry.newValue || undefined,
          details: entry.details || undefined,
          reason: entry.reason || null,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
          deviceId: entry.deviceId || null,
          sessionId: entry.sessionId || null,
          country: entry.country || null,
          city: entry.city || null,
          severity: entry.severity || 'info',
          riskScore: entry.riskScore || 0,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${(err as Error).message}`);
    }
  }

  async createSecurityEvent(params: {
    userId: string;
    eventType: string;
    severity?: 'info' | 'warning' | 'high' | 'critical';
    description?: string;
    metadata?: any;
    riskScore?: number;
    deviceId?: string;
    sessionId?: string;
    ipAddress?: string;
    country?: string;
    city?: string;
  }): Promise<void> {
    try {
      await this.prisma.securityEvent.create({
        data: {
          userId: params.userId,
          eventType: params.eventType,
          severity: params.severity || 'info',
          description: params.description || null,
          metadata: params.metadata || undefined,
          riskScore: params.riskScore || 0,
          deviceId: params.deviceId || null,
          sessionId: params.sessionId || null,
          ipAddress: params.ipAddress || null,
          country: params.country || null,
          city: params.city || null,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to create security event: ${(err as Error).message}`);
    }
  }

  async getSecurityEvents(userId: string, limit = 20): Promise<any[]> {
    return this.prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getLoginHistory(userId: string, limit = 20, offset = 0): Promise<any[]> {
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async acknowledgeEvent(eventId: string, userId: string): Promise<void> {
    await this.prisma.securityEvent.updateMany({
      where: { id: eventId, userId },
      data: { acknowledged: true, acknowledgedAt: new Date() },
    });
  }
}
