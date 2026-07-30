import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface IpInfo {
  ip: string;
  country?: string;
  countryCode?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  organization?: string;
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  networkType?: string;
}

const LOOPBACK_IPV4 = '127.0.0.1';
const LOOPBACK_IPV6 = '::1';
const PRIVATE_192_PREFIX = '192.168.';
const PRIVATE_10_PREFIX = '10.';

const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD_FACTOR = Math.PI / 180;
const IP_CACHE_TTL_SECONDS = 86_400;

@Injectable()
export class IpIntelligenceService {
  private readonly logger = new Logger(IpIntelligenceService.name);

  constructor(private readonly redis: RedisService) {}

  async lookup(ip: string): Promise<IpInfo> {
    // Try cache first
    const cached = await this.redis.cacheGet<IpInfo>(`ip:${ip}`);
    if (cached) return cached;

    // Build a basic IP info from headers/local data
    // In production, integrate with MaxMind GeoIP, ipapi.co, or ip2location
    const info: IpInfo = {
      ip,
      country: undefined,
      city: undefined,
      isVpn: false,
      isProxy: false,
      isTor: false,
    };

    // Try ipapi.co if configured
    const apiKey = process.env.IPAPI_KEY;
    if (
      apiKey &&
      ip !== LOOPBACK_IPV4 &&
      ip !== LOOPBACK_IPV6 &&
      !ip.startsWith(PRIVATE_192_PREFIX) &&
      !ip.startsWith(PRIVATE_10_PREFIX)
    ) {
      try {
        const response = await fetch(`https://ipapi.co/${ip}/json/?key=${apiKey}`);
        const data = (await response.json()) as any;
        if (data && !data.error) {
          info.country = data.country_name;
          info.countryCode = data.country_code;
          info.state = data.region;
          info.city = data.city;
          info.postalCode = data.postal;
          info.latitude = data.latitude;
          info.longitude = data.longitude;
          info.timezone = data.timezone;
          info.isp = data.org;
          info.organization = data.org;
          info.isVpn = data.security?.is_vpn === true;
          info.isProxy = data.security?.is_proxy === true;
          info.isTor = data.security?.is_tor === true;
          info.networkType = data.network || undefined;
        }
      } catch (err) {
        this.logger.warn(`IP lookup failed for ${ip}: ${(err as Error).message}`);
      }
    }

    await this.redis.cacheSet(`ip:${ip}`, info, IP_CACHE_TTL_SECONDS);

    return info;
  }

  async isVpn(ip: string): Promise<boolean> {
    const info = await this.lookup(ip);
    return info.isVpn;
  }

  async isTor(ip: string): Promise<boolean> {
    const info = await this.lookup(ip);
    return info.isTor;
  }

  async isProxy(ip: string): Promise<boolean> {
    const info = await this.lookup(ip);
    return info.isProxy;
  }

  /** Calculate distance between two lat/lng pairs in km (Haversine) */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = EARTH_RADIUS_KM;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * DEG_TO_RAD_FACTOR;
  }
}
