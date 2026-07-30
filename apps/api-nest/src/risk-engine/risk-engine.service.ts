import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IpIntelligenceService, IpInfo } from '../common/services/ip-intelligence.service';

export interface RiskResult {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  requiresMfa: boolean;
  blocked: boolean;
}

export interface RiskFactor {
  name: string;
  score: number;
  detail: string;
}

export interface RiskContext {
  userId: string;
  email: string;
  ip: string;
  userAgent: string;
  deviceFingerprint?: string;
  deviceId?: string;
  country?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable()
export class RiskEngineService {
  private readonly logger = new Logger(RiskEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ipIntel: IpIntelligenceService,
  ) {}

  async evaluate(ctx: RiskContext): Promise<RiskResult> {
    const factors: RiskFactor[] = [];
    let totalScore = 0;

    if (!ctx.ip || ctx.ip === '127.0.0.1' || ctx.ip === '::1') {
      return { score: 0, level: 'low', factors: [], requiresMfa: false, blocked: false };
    }

    // Check blocked IPs
    const blockedIp = await this.prisma.blockedIp.findFirst({
      where: {
        ipAddress: ctx.ip,
        OR: [{ userId: ctx.userId }, { userId: null }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
      },
    });
    if (blockedIp) {
      factors.push({
        name: 'ip_blocked',
        score: 100,
        detail: `IP address is blocked: ${blockedIp.reason || 'No reason'}`,
      });
      const level = 'critical';
      return { score: 100, level, factors, requiresMfa: true, blocked: true };
    }

    const ipInfo = await this.ipIntel.lookup(ctx.ip);

    // 1. Geo Anomaly (max 30)
    const geoFactors = await this.evaluateGeoAnomaly(ctx, ipInfo);
    for (const f of geoFactors) {
      factors.push(f);
      totalScore += f.score;
    }

    // 2. Device Anomaly (max 25)
    const deviceFactors = await this.evaluateDeviceAnomaly(ctx);
    for (const f of deviceFactors) {
      factors.push(f);
      totalScore += f.score;
    }

    // 3. Network Anomaly (max 25)
    const networkFactors = this.evaluateNetworkAnomaly(ctx, ipInfo);
    for (const f of networkFactors) {
      factors.push(f);
      totalScore += f.score;
    }

    // 4. Behavioral Anomaly (max 20)
    const behaviorFactors = await this.evaluateBehavioralAnomaly(ctx);
    for (const f of behaviorFactors) {
      factors.push(f);
      totalScore += f.score;
    }

    // Clamp score
    totalScore = Math.min(100, Math.max(0, totalScore));

    const level = this.scoreToLevel(totalScore);
    const requiresMfa = totalScore > 20;
    const blocked = totalScore >= 81;

    this.logger.debug(`Risk score for ${ctx.email}: ${totalScore} (${level})`, factors);

    return { score: totalScore, level, factors, requiresMfa, blocked };
  }

  private async evaluateGeoAnomaly(ctx: RiskContext, ipInfo: IpInfo): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    // Check previous logins for different country
    if (ipInfo.country) {
      const previousLogins = await this.prisma.loginHistory.findFirst({
        where: { userId: ctx.userId, success: true, country: { not: ipInfo.country } },
        orderBy: { createdAt: 'desc' },
        select: { country: true, city: true, createdAt: true },
      });

      if (previousLogins) {
        // New country
        factors.push({
          name: 'new_country',
          score: 15,
          detail: `Login from new country: ${ipInfo.country}`,
        });

        // Impossible travel check — compare against previous login coordinates
        const previousLogin = await this.prisma.loginHistory.findFirst({
          where: {
            userId: ctx.userId,
            success: true,
            latitude: { not: null },
            longitude: { not: null },
          },
          orderBy: { createdAt: 'desc' },
          select: { latitude: true, longitude: true, createdAt: true },
        });
        if (previousLogin && previousLogin.latitude && previousLogin.longitude) {
          const prevLat = previousLogin.latitude;
          const prevLng = previousLogin.longitude;
          if (ctx.latitude && ctx.longitude) {
            const dist = this.ipIntel.calculateDistance(
              ctx.latitude,
              ctx.longitude,
              prevLat,
              prevLng,
            );
            const timeDiffHours =
              (Date.now() - previousLogin.createdAt.getTime()) / (1000 * 60 * 60);
            // Impossible travel: distance too far for time elapsed (> 800 km/h)
            if (dist > 1000 && timeDiffHours < 2 && dist / Math.max(timeDiffHours, 0.01) > 800) {
              factors.push({
                name: 'impossible_travel',
                score: 20,
                detail: `Travel of ${Math.round(dist)}km in ${timeDiffHours.toFixed(1)}h from previous location`,
              });
            }
          }
        }
      } else {
        const sameCountryLogins = await this.prisma.loginHistory.findFirst({
          where: { userId: ctx.userId, success: true, country: ipInfo.country },
        });
        // Same country, check new city
        if (!sameCountryLogins) {
          factors.push({
            name: 'new_country',
            score: 10,
            detail: `First login from ${ipInfo.country}`,
          });
        } else if (ipInfo.city) {
          const sameCity = await this.prisma.loginHistory.findFirst({
            where: {
              userId: ctx.userId,
              success: true,
              country: ipInfo.country,
              city: ipInfo.city,
            },
          });
          if (!sameCity) {
            factors.push({ name: 'new_city', score: 5, detail: `New city: ${ipInfo.city}` });
          }
        }
      }
    }

    // Timezone mismatch
    if (ctx.timezone && ipInfo.timezone && ctx.timezone !== ipInfo.timezone) {
      factors.push({
        name: 'timezone_mismatch',
        score: 5,
        detail: `Expected ${ctx.timezone}, got ${ipInfo.timezone}`,
      });
    }

    return factors;
  }

  private async evaluateDeviceAnomaly(ctx: RiskContext): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    if (!ctx.deviceId) {
      // No device ID sent — could be API call without fingerprint
      return factors;
    }

    // Check if device is known to this user
    const existingDevice = await this.prisma.device.findFirst({
      where: { deviceId: ctx.deviceId, userId: ctx.userId },
    });

    if (!existingDevice) {
      // New device
      factors.push({ name: 'new_device', score: 15, detail: 'First login from this device' });
    } else if (existingDevice.status === 'blocked') {
      // Blocked device — critical
      factors.push({ name: 'blocked_device', score: 100, detail: 'Login from a blocked device' });
    } else if (ctx.deviceFingerprint && existingDevice.fingerprintHash) {
      // Check fingerprint match
      if (ctx.deviceFingerprint !== existingDevice.fingerprintHash) {
        factors.push({
          name: 'fingerprint_mismatch',
          score: 15,
          detail: 'Device fingerprint does not match stored hash',
        });
      }
    }

    // Trusted device reduces risk
    if (
      existingDevice?.trustedDevice &&
      existingDevice.trustedUntil &&
      existingDevice.trustedUntil > new Date()
    ) {
      factors.push({
        name: 'trusted_device',
        score: -20,
        detail: 'Device is trusted — risk reduced',
      });
    }

    return factors;
  }

  private evaluateNetworkAnomaly(ctx: RiskContext, ipInfo: IpInfo): RiskFactor[] {
    const factors: RiskFactor[] = [];

    if (ipInfo.isVpn) {
      factors.push({ name: 'vpn_detected', score: 15, detail: 'VPN connection detected' });
    }
    if (ipInfo.isTor) {
      factors.push({ name: 'tor_detected', score: 20, detail: 'TOR connection detected' });
    }
    if (ipInfo.isProxy) {
      factors.push({ name: 'proxy_detected', score: 10, detail: 'Proxy connection detected' });
    }

    return factors;
  }

  private async evaluateBehavioralAnomaly(ctx: RiskContext): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    // Rapid login attempts
    const recentAttempts = await this.prisma.loginHistory.count({
      where: {
        userId: ctx.userId,
        createdAt: { gte: new Date(Date.now() - 60000) }, // last minute
      },
    });
    if (recentAttempts >= 3) {
      factors.push({
        name: 'rapid_attempts',
        score: 10,
        detail: `${recentAttempts} login attempts in last minute`,
      });
    }

    // Failed attempts from this IP
    const failedFromIp = await this.prisma.loginHistory.count({
      where: {
        userId: ctx.userId,
        success: false,
        ipAddress: ctx.ip,
        createdAt: { gte: new Date(Date.now() - 15 * 60000) },
      },
    });
    if (failedFromIp >= 3) {
      factors.push({
        name: 'failed_attempts_ip',
        score: 10,
        detail: `${failedFromIp} failed attempts from this IP`,
      });
    }

    return factors;
  }

  private scoreToLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score <= 20) return 'low';
    if (score <= 50) return 'medium';
    if (score <= 80) return 'high';
    return 'critical';
  }
}
