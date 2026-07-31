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

  const originalKey = process.env.IPAPI_KEY;

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

  afterAll(() => {
    if (originalKey === undefined) delete process.env.IPAPI_KEY;
    else process.env.IPAPI_KEY = originalKey;
  });

  it('returns cached result without re-lookup', async () => {
    redis.cacheGet.mockResolvedValue({
      ip: '8.8.8.8',
      country: 'US',
      isVpn: false,
      isProxy: false,
      isTor: false,
    });
    const info = await service.lookup('8.8.8.8');
    expect(info.country).toBe('US');
    expect(geoip.lookup).not.toHaveBeenCalled();
  });

  it('skips geo resolution for loopback/private IPs', async () => {
    delete process.env.IPAPI_KEY;
    const info = await service.lookup('127.0.0.1');
    expect(info.country).toBeUndefined();
    expect(geoip.lookup).not.toHaveBeenCalled();
    expect(redis.cacheSet).toHaveBeenCalledWith('ip:127.0.0.1', info, expect.any(Number));
  });

  it('fills offline geo from geoip-lite when no IPAPI key is configured', async () => {
    delete process.env.IPAPI_KEY;
    mockGeoip.mockReturnValue({
      country: 'US',
      region: 'CA',
      city: 'Mountain View',
      ll: [37.386, -122.0838],
      timezone: 'America/Los_Angeles',
    });

    const info = await service.lookup('8.8.8.8');
    expect(info.country).toBe('US');
    expect(info.state).toBe('CA');
    expect(info.city).toBe('Mountain View');
    expect(info.latitude).toBe(37.386);
    expect(info.longitude).toBe(-122.0838);
    expect(info.timezone).toBe('America/Los_Angeles');
    expect(info.isVpn).toBe(false);
    expect(info.isp).toBeUndefined();
  });

  it('enriches with ipapi.co data (full country name, ISP, VPN/TOR flags) when a key is set', async () => {
    process.env.IPAPI_KEY = 'test-key';
    mockGeoip.mockReturnValue({
      country: 'DE',
      region: 'BE',
      city: 'Berlin',
      ll: [52.52, 13.405],
      timezone: 'Europe/Berlin',
    });

    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({
        country_name: 'Germany',
        country_code: 'DE',
        region: 'Berlin',
        city: 'Berlin',
        postal: '10115',
        latitude: 52.52,
        longitude: 13.405,
        timezone: 'Europe/Berlin',
        org: 'Example ISP',
        network: 'cable',
        security: { is_vpn: true, is_proxy: false, is_tor: false },
      }),
    } as any);

    try {
      const info = await service.lookup('8.8.8.8');
      expect(fetchMock).toHaveBeenCalledWith('https://ipapi.co/8.8.8.8/json/?key=test-key');
      expect(info.country).toBe('Germany');
      expect(info.countryCode).toBe('DE');
      expect(info.postalCode).toBe('10115');
      expect(info.isp).toBe('Example ISP');
      expect(info.networkType).toBe('cable');
      expect(info.isVpn).toBe(true);
      expect(info.isTor).toBe(false);
      expect(redis.cacheSet).toHaveBeenCalled();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('falls back to offline geo when the ipapi call fails', async () => {
    process.env.IPAPI_KEY = 'test-key';
    mockGeoip.mockReturnValue({
      country: 'US',
      region: 'CA',
      ll: [37.386, -122.0838],
    });

    const fetchMock = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));

    try {
      const info = await service.lookup('8.8.8.8');
      expect(info.country).toBe('US');
      expect(info.state).toBe('CA');
      expect(info.isVpn).toBe(false);
    } finally {
      fetchMock.mockRestore();
    }
  });
});
