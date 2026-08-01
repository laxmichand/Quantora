import {
  assertAngelConfig,
  ANGEL_DEFAULTS,
  loadAngelConfig,
  validateAngelConfig,
} from './angel.config';

describe('angel.config', () => {
  const ENV_BACKUP = { ...process.env };

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
  });

  describe('loadAngelConfig', () => {
    it('reads credentials from environment', () => {
      process.env.ANGEL_API_KEY = 'api-1';
      process.env.ANGEL_CLIENT_CODE = 'client-1';

      const config = loadAngelConfig();

      expect(config.apiKey).toBe('api-1');
      expect(config.clientCode).toBe('client-1');
      expect(config.baseUrl).toBe(ANGEL_DEFAULTS.baseUrl);
      expect(config.scripMasterUrl).toBe(ANGEL_DEFAULTS.scripMasterUrl);
      expect(config.timeoutMs).toBe(ANGEL_DEFAULTS.timeoutMs);
      expect(config.maxRetries).toBe(ANGEL_DEFAULTS.maxRetries);
    });

    it('supports refresh token, credentials, and overrides', () => {
      process.env.ANGEL_API_KEY = 'api-1';
      process.env.ANGEL_CLIENT_CODE = 'client-1';
      process.env.ANGEL_PASSWORD = 'pass-1';
      process.env.ANGEL_TOTP = 'totp-1';
      process.env.ANGEL_REFRESH_TOKEN = 'refresh-1';
      process.env.ANGEL_BASE_URL = 'https://sandbox.angelone.in';
      process.env.ANGEL_TIMEOUT_MS = '5000';
      process.env.ANGEL_MAX_RETRIES = '5';
      process.env.ANGEL_RETRY_BASE_DELAY_MS = '100';

      const config = loadAngelConfig();

      expect(config.password).toBe('pass-1');
      expect(config.totp).toBe('totp-1');
      expect(config.refreshToken).toBe('refresh-1');
      expect(config.baseUrl).toBe('https://sandbox.angelone.in');
      expect(config.timeoutMs).toBe(5000);
      expect(config.maxRetries).toBe(5);
      expect(config.retryBaseDelayMs).toBe(100);
    });

    it('trims whitespace around credentials', () => {
      process.env.ANGEL_API_KEY = '  api-1  ';
      process.env.ANGEL_CLIENT_CODE = '  client-1  ';

      const config = loadAngelConfig();

      expect(config.apiKey).toBe('api-1');
      expect(config.clientCode).toBe('client-1');
    });

    it('falls back to defaults for malformed numeric env vars', () => {
      process.env.ANGEL_TIMEOUT_MS = 'abc';
      process.env.ANGEL_MAX_RETRIES = '-1';

      const config = loadAngelConfig();

      expect(config.timeoutMs).toBe(ANGEL_DEFAULTS.timeoutMs);
      expect(config.maxRetries).toBe(ANGEL_DEFAULTS.maxRetries);
    });

    it('flags test mode from NODE_ENV', () => {
      process.env.NODE_ENV = 'test';
      expect(loadAngelConfig().isTest).toBe(true);

      process.env.NODE_ENV = 'production';
      expect(loadAngelConfig().isTest).toBe(false);
    });
  });

  describe('validateAngelConfig', () => {
    it('reports missing api key and client code', () => {
      expect(validateAngelConfig(loadAngelConfig())).toEqual([
        'ANGEL_API_KEY',
        'ANGEL_CLIENT_CODE',
        'ANGEL_REFRESH_TOKEN (or ANGEL_PASSWORD + ANGEL_TOTP for initial login)',
      ]);
    });

    it('accepts refresh-token-only bootstrap', () => {
      process.env.ANGEL_API_KEY = 'api-1';
      process.env.ANGEL_CLIENT_CODE = 'client-1';
      process.env.ANGEL_REFRESH_TOKEN = 'refresh-1';

      expect(validateAngelConfig(loadAngelConfig())).toEqual([]);
    });

    it('accepts password + totp when no refresh token is configured', () => {
      process.env.ANGEL_API_KEY = 'api-1';
      process.env.ANGEL_CLIENT_CODE = 'client-1';
      process.env.ANGEL_PASSWORD = 'pass-1';
      process.env.ANGEL_TOTP = 'totp-1';

      expect(validateAngelConfig(loadAngelConfig())).toEqual([]);
    });
  });

  describe('assertAngelConfig', () => {
    it('throws when credentials missing outside test mode', () => {
      process.env.NODE_ENV = 'production';
      process.env.ANGEL_API_KEY = '';
      process.env.ANGEL_CLIENT_CODE = '';

      expect(() => assertAngelConfig(loadAngelConfig())).toThrow(/ANGEL_API_KEY/);
      expect(() => assertAngelConfig(loadAngelConfig())).toThrow(/ANGEL_CLIENT_CODE/);
    });

    it('does not throw in test mode when credentials are missing', () => {
      process.env.NODE_ENV = 'test';
      process.env.ANGEL_API_KEY = '';
      process.env.ANGEL_CLIENT_CODE = '';

      expect(() => assertAngelConfig(loadAngelConfig())).not.toThrow();
    });

    it('does not throw when credentials are present', () => {
      process.env.NODE_ENV = 'production';
      process.env.ANGEL_API_KEY = 'api-1';
      process.env.ANGEL_CLIENT_CODE = 'client-1';
      process.env.ANGEL_REFRESH_TOKEN = 'refresh-1';

      expect(() => assertAngelConfig(loadAngelConfig())).not.toThrow();
    });
  });
});
