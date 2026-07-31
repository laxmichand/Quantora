import { Test, TestingModule } from '@nestjs/testing';
import { IpIntelligenceService } from './ip-intelligence.service';
import { RedisService } from '../redis/redis.service';

jest.mock('geoip-lite', () => ({
  lookup: jest.fn(),
}));

import * as geoip from 'geoip-lite';

const mockGeoip = geoip.lookup as jest.Mock;

describe('IpIntelligenceService', () => {
  let service: IpIntelligenceService;
  let redis: any;

  beforeEach(async () => {
    jest.resetModules();
    mockGeoip.mockReset();
    mockGeoip.mockReturnValue(null);

    redis = {
      cacheGet: jest.fn().mockResolvedValue(null),
      cacheSet: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [IpIntelligenceService, { provide: RedisService, useValue: redis }],
    }).compile();

    service = module.get<IpIntelligenceService>(IpIntelligenceService);
  });

  it('returns cached result without re-lookup', async () => {
    redis.cacheGet.mockResolvedValue({
      ip: '8.8.8.8',
      country: 'United States',
      isVpn: false,
      isProxy: false,
      isTor: false,
    });
    const info = await service.lookup('8.8.8.8');
    expect(info.country).toBe('United States');
    expect(geoip.lookup).not.toHaveBeenCalled();
  });

  it('skips geo resolution for loopback/private IPs', async () => {
    const info = await service.lookup('127.0.0.1');
    expect(info.country).toBeUndefined();
    expect(geoip.lookup).not.toHaveBeenCalled();
    expect(redis.cacheSet).toHaveBeenCalledWith('ip:127.0.0.1', info, expect.any(Number));
  });

  it('fills offline geo from geoip-lite and maps country code to full name', async () => {
    mockGeoip.mockReturnValue({
      country: 'US',
      region: 'CA',
      city: 'Mountain View',
      ll: [37.386, -122.0838],
      timezone: 'America/Los_Angeles',
    });

    const info = await service.lookup('8.8.8.8');
    expect(info.country).toBe('United States');
    expect(info.countryCode).toBe('US');
    expect(info.state).toBe('CA');
    expect(info.city).toBe('Mountain View');
    expect(info.latitude).toBe(37.386);
    expect(info.longitude).toBe(-122.0838);
    expect(info.timezone).toBe('America/Los_Angeles');
    expect(info.isVpn).toBe(false);
    expect(info.isp).toBeUndefined();
  });

  it('falls back to the raw country code when the name is unknown', async () => {
    mockGeoip.mockReturnValue({ country: 'XX', region: 'R', city: 'Nowhere' });

    const info = await service.lookup('8.8.8.8');
    expect(info.country).toBe('XX');
  });

  it('keeps VPN/proxy/TOR flags off for clean public IPs', async () => {
    mockGeoip.mockReturnValue({
      country: 'IN',
      region: 'AP',
      city: 'Vijayawada',
      ll: [16.5136, 80.6297],
      timezone: 'Asia/Kolkata',
    });

    const info = await service.lookup('49.207.200.123');
    expect(info.country).toBe('India');
    expect(info.isVpn).toBe(false);
    expect(info.isProxy).toBe(false);
    expect(info.isTor).toBe(false);
  });
});
