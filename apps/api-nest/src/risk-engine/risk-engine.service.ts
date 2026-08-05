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

const LOOPBACK_IPV4 = '127.0.0.1';
const LOOPBACK_IPV6 = '::1';

const SCORE_NEW_COUNTRY = 15;
const SCORE_NEW_COUNTRY_FIRST = 10;
const SCORE_NEW_CITY = 5;
const SCORE_TIMEZONE_MISMATCH = 5;
const SCORE_IMPOSSIBLE_TRAVEL = 20;
const SCORE_NEW_DEVICE = 15;
const SCORE_BLOCKED_DEVICE = 100;
const SCORE_FINGERPRINT_MISMATCH = 15;
const SCORE_TRUSTED_DEVICE = -20;
const SCORE_VPN = 15;
const SCORE_TOR = 20;
const SCORE_PROXY = 10;
const SCORE_RAPID_ATTEMPTS = 10;
const SCORE_FAILED_ATTEMPTS_IP = 10;
const SCORE_NEW_IP = 5;

const TRAVEL_DISTANCE_KM_MIN = 1_000;
const TRAVEL_TIME_HOURS_MAX = 2;
const TRAVEL_SPEED_KMH_MIN = 800;

const BEHAVIOR_WINDOW_MS = 60_000;
const RAPID_ATTEMPT_THRESHOLD = 3;
const FAILED_IP_WINDOW_MS = 15 * 60_000;
const FAILED_IP_THRESHOLD = 3;

const TOTAL_SCORE_MAX = 100;
const MFA_THRESHOLD = 20;
const BLOCK_THRESHOLD = 81;

const LEVEL_LOW_MAX = 20;
const LEVEL_MEDIUM_MAX = 50;
const LEVEL_HIGH_MAX = 80;
const IP_BLOCK_SCORE = 100;

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

    if (!ctx.ip || ctx.ip === LOOPBACK_IPV4 || ctx.ip === LOOPBACK_IPV6) {
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
        score: IP_BLOCK_SCORE,
        detail: `IP address is blocked: ${blockedIp.reason || 'No reason'}`,
      });
      return {
        score: IP_BLOCK_SCORE,
        level: 'critical',
        factors,
        requiresMfa: true,
        blocked: true,
      };
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

    totalScore = Math.min(TOTAL_SCORE_MAX, Math.max(0, totalScore));

    const level = this.scoreToLevel(totalScore);
    const requiresMfa = totalScore > MFA_THRESHOLD;
    const blocked = totalScore >= BLOCK_THRESHOLD;

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
          score: SCORE_NEW_COUNTRY,
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
            if (
              dist > TRAVEL_DISTANCE_KM_MIN &&
              timeDiffHours < TRAVEL_TIME_HOURS_MAX &&
              dist / Math.max(timeDiffHours, 0.01) > TRAVEL_SPEED_KMH_MIN
            ) {
              factors.push({
                name: 'impossible_travel',
                score: SCORE_IMPOSSIBLE_TRAVEL,
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
            score: SCORE_NEW_COUNTRY_FIRST,
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
            factors.push({
              name: 'new_city',
              score: SCORE_NEW_CITY,
              detail: `New city: ${ipInfo.city}`,
            });
          }
        }
      }
    }

    // Timezone mismatch
    if (ctx.timezone && ipInfo.timezone && ctx.timezone !== ipInfo.timezone) {
      factors.push({
        name: 'timezone_mismatch',
        score: SCORE_TIMEZONE_MISMATCH,
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
      factors.push({
        name: 'new_device',
        score: SCORE_NEW_DEVICE,
        detail: 'First login from this device',
      });
    } else if (existingDevice.status === 'blocked') {
      factors.push({
        name: 'blocked_device',
        score: SCORE_BLOCKED_DEVICE,
        detail: 'Login from a blocked device',
      });
    } else if (ctx.deviceFingerprint && existingDevice.fingerprintHash) {
      // Check fingerprint match
      if (ctx.deviceFingerprint !== existingDevice.fingerprintHash) {
        factors.push({
          name: 'fingerprint_mismatch',
          score: SCORE_FINGERPRINT_MISMATCH,
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
        score: SCORE_TRUSTED_DEVICE,
        detail: 'Device is trusted — risk reduced',
      });
    }

    return factors;
  }

  private evaluateNetworkAnomaly(ctx: RiskContext, ipInfo: IpInfo): RiskFactor[] {
    const factors: RiskFactor[] = [];

    if (ipInfo.isVpn) {
      factors.push({ name: 'vpn_detected', score: SCORE_VPN, detail: 'VPN connection detected' });
    }
    if (ipInfo.isTor) {
      factors.push({ name: 'tor_detected', score: SCORE_TOR, detail: 'TOR connection detected' });
    }
    if (ipInfo.isProxy) {
      factors.push({
        name: 'proxy_detected',
        score: SCORE_PROXY,
        detail: 'Proxy connection detected',
      });
    }

    return factors;
  }

  private async evaluateBehavioralAnomaly(ctx: RiskContext): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    // First login from this IP address
    if (ctx.ip) {
      const previousLogin = await this.prisma.loginHistory.findFirst({
        where: { userId: ctx.userId, success: true, ipAddress: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { ipAddress: true },
      });
      if (previousLogin?.ipAddress && previousLogin.ipAddress !== ctx.ip) {
        factors.push({
          name: 'new_ip',
          score: SCORE_NEW_IP,
          detail: 'Login from a new IP address',
        });
      }
    }

    // Rapid login attempts
    const recentAttempts = await this.prisma.loginHistory.count({
      where: {
        userId: ctx.userId,
        createdAt: { gte: new Date(Date.now() - BEHAVIOR_WINDOW_MS) },
      },
    });
    if (recentAttempts >= RAPID_ATTEMPT_THRESHOLD) {
      factors.push({
        name: 'rapid_attempts',
        score: SCORE_RAPID_ATTEMPTS,
        detail: `${recentAttempts} login attempts in last minute`,
      });
    }

    // Failed attempts from this IP
    const failedFromIp = await this.prisma.loginHistory.count({
      where: {
        userId: ctx.userId,
        success: false,
        ipAddress: ctx.ip,
        createdAt: { gte: new Date(Date.now() - FAILED_IP_WINDOW_MS) },
      },
    });
    if (failedFromIp >= FAILED_IP_THRESHOLD) {
      factors.push({
        name: 'failed_attempts_ip',
        score: SCORE_FAILED_ATTEMPTS_IP,
        detail: `${failedFromIp} failed attempts from this IP`,
      });
    }

    return factors;
  }

  private scoreToLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score <= LEVEL_LOW_MAX) return 'low';
    if (score <= LEVEL_MEDIUM_MAX) return 'medium';
    if (score <= LEVEL_HIGH_MAX) return 'high';
    return 'critical';
  }
}
