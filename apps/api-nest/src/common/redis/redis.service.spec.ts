import { Test } from '@nestjs/testing';
import { RedisService } from './redis.service';

const mockRedisClient = {
  on: jest.fn(),
  connect: jest.fn(),
  quit: jest.fn(),
  status: 'ready',
  set: jest.fn(),
  get: jest.fn(),
};

jest.mock('ioredis', () => jest.fn().mockImplementation(() => mockRedisClient));

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();
    service = module.get(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should attach an error listener on init (reconnect error spam fix)', async () => {
    mockRedisClient.connect.mockResolvedValue(undefined);
    await service.onModuleInit();
    expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should not throw when Redis is unavailable', async () => {
    mockRedisClient.connect.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });

  it('should no-op writes when Redis is not connected', async () => {
    mockRedisClient.status = 'connecting';
    await service.blacklistToken('some-jti', 60);
    expect(mockRedisClient.set).not.toHaveBeenCalled();
  });

  it('should return false for isTokenBlacklisted when Redis is down', async () => {
    mockRedisClient.status = 'connecting';
    await expect(service.isTokenBlacklisted('some-jti')).resolves.toBe(false);
  });
});
