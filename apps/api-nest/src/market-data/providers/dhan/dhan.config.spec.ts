import { assertDhanConfig, DHAN_DEFAULTS, loadDhanConfig, validateDhanConfig } from './dhan.config';

describe('dhan.config', () => {
  const ENV_BACKUP = { ...process.env };

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
  });

  describe('loadDhanConfig', () => {
    it('reads credentials from environment', () => {
      process.env.DHAN_CLIENT_ID = 'client-1';
      process.env.DHAN_ACCESS_TOKEN = 'token-1';

      const config = loadDhanConfig();

      expect(config.clientId).toBe('client-1');
      expect(config.accessToken).toBe('token-1');
      expect(config.baseUrl).toBe(DHAN_DEFAULTS.baseUrl);
      expect(config.timeoutMs).toBe(DHAN_DEFAULTS.timeoutMs);
      expect(config.maxRetries).toBe(DHAN_DEFAULTS.maxRetries);
    });

    it('supports optional refresh token, secret, and overrides', () => {
      process.env.DHAN_CLIENT_ID = 'client-1';
      process.env.DHAN_ACCESS_TOKEN = 'token-1';
      process.env.DHAN_REFRESH_TOKEN = 'refresh-1';
      process.env.DHAN_CLIENT_SECRET = 'secret-1';
      process.env.DHAN_BASE_URL = 'https://sandbox.dhan.co/v2';
      process.env.DHAN_TIMEOUT_MS = '5000';
      process.env.DHAN_MAX_RETRIES = '5';
      process.env.DHAN_RETRY_BASE_DELAY_MS = '100';

      const config = loadDhanConfig();

      expect(config.refreshToken).toBe('refresh-1');
      expect(config.clientSecret).toBe('secret-1');
      expect(config.baseUrl).toBe('https://sandbox.dhan.co/v2');
      expect(config.timeoutMs).toBe(5000);
      expect(config.maxRetries).toBe(5);
      expect(config.retryBaseDelayMs).toBe(100);
    });

    it('trims whitespace around credentials', () => {
      process.env.DHAN_CLIENT_ID = '  client-1  ';
      process.env.DHAN_ACCESS_TOKEN = '  token-1  ';

      const config = loadDhanConfig();

      expect(config.clientId).toBe('client-1');
      expect(config.accessToken).toBe('token-1');
    });

    it('falls back to defaults for malformed numeric env vars', () => {
      process.env.DHAN_TIMEOUT_MS = 'abc';
      process.env.DHAN_MAX_RETRIES = '-1';

      const config = loadDhanConfig();

      expect(config.timeoutMs).toBe(DHAN_DEFAULTS.timeoutMs);
      expect(config.maxRetries).toBe(DHAN_DEFAULTS.maxRetries);
    });

    it('flags test mode from NODE_ENV', () => {
      process.env.NODE_ENV = 'test';
      expect(loadDhanConfig().isTest).toBe(true);

      process.env.NODE_ENV = 'production';
      expect(loadDhanConfig().isTest).toBe(false);
    });
  });

  describe('validateDhanConfig', () => {
    it('reports missing client id and access token', () => {
      expect(validateDhanConfig(loadDhanConfig())).toEqual(['DHAN_CLIENT_ID', 'DHAN_ACCESS_TOKEN']);
    });

    it('returns empty array when credentials present', () => {
      process.env.DHAN_CLIENT_ID = 'client-1';
      process.env.DHAN_ACCESS_TOKEN = 'token-1';

      expect(validateDhanConfig(loadDhanConfig())).toEqual([]);
    });
  });

  describe('assertDhanConfig', () => {
    it('throws when credentials missing outside test mode', () => {
      process.env.NODE_ENV = 'production';
      process.env.DHAN_CLIENT_ID = '';
      process.env.DHAN_ACCESS_TOKEN = '';

      expect(() => assertDhanConfig(loadDhanConfig())).toThrow(/DHAN_CLIENT_ID/);
      expect(() => assertDhanConfig(loadDhanConfig())).toThrow(/DHAN_ACCESS_TOKEN/);
    });

    it('does not throw in test mode when credentials are missing', () => {
      process.env.NODE_ENV = 'test';
      process.env.DHAN_CLIENT_ID = '';
      process.env.DHAN_ACCESS_TOKEN = '';

      expect(() => assertDhanConfig(loadDhanConfig())).not.toThrow();
    });

    it('does not throw when credentials are present', () => {
      process.env.NODE_ENV = 'production';
      process.env.DHAN_CLIENT_ID = 'client-1';
      process.env.DHAN_ACCESS_TOKEN = 'token-1';

      expect(() => assertDhanConfig(loadDhanConfig())).not.toThrow();
    });
  });
});
