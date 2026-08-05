import { AngelAuthService } from './angel-auth.service';
import { AngelApiError, AngelAuthError } from './angel.types';

describe('AngelAuthService', () => {
  const ENV_BACKUP = { ...process.env };

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
    jest.restoreAllMocks();
  });

  function setValidEnv(): void {
    process.env.NODE_ENV = 'test';
    process.env.ANGEL_API_KEY = 'api-1';
    process.env.ANGEL_CLIENT_CODE = 'client-1';
  }

  describe('constructor', () => {
    it('loads credentials from env', () => {
      setValidEnv();

      const service = new AngelAuthService();

      expect(service.getConfig().apiKey).toBe('api-1');
      expect(service.getConfig().clientCode).toBe('client-1');
    });

    it('does not throw when env missing in test mode', () => {
      process.env.NODE_ENV = 'test';
      process.env.ANGEL_API_KEY = '';
      process.env.ANGEL_CLIENT_CODE = '';

      expect(() => new AngelAuthService()).not.toThrow();
    });

    it('throws when env missing outside test mode (fail fast)', () => {
      process.env.NODE_ENV = 'production';
      process.env.ANGEL_API_KEY = '';
      process.env.ANGEL_CLIENT_CODE = '';

      expect(() => new AngelAuthService()).toThrow(/ANGEL_API_KEY/);
    });
  });

  describe('getAccessToken', () => {
    it('throws when not authenticated yet', () => {
      setValidEnv();

      const service = new AngelAuthService();

      expect(() => service.getAccessToken()).toThrow(AngelAuthError);
    });
  });

  describe('isRefreshable / canLogin', () => {
    it('is refreshable only when a refresh token is configured', () => {
      setValidEnv();
      expect(new AngelAuthService().isRefreshable()).toBe(false);

      process.env.ANGEL_REFRESH_TOKEN = 'refresh-1';
      expect(new AngelAuthService().isRefreshable()).toBe(true);
    });

    it('can login only when api key, client code, password and totp are present', () => {
      setValidEnv();
      expect(new AngelAuthService().canLogin()).toBe(false);

      process.env.ANGEL_PASSWORD = 'pass-1';
      process.env.ANGEL_TOTP = 'totp-1';
      expect(new AngelAuthService().canLogin()).toBe(true);
    });

    it('can login with password and a totp secret (no manual totp)', () => {
      setValidEnv();
      process.env.ANGEL_PASSWORD = 'pass-1';
      process.env.ANGEL_TOTP_SECRET = 'BDII3L372XF32BLNNFTWN4AVN4';
      expect(new AngelAuthService().canLogin()).toBe(true);
    });
  });

  describe('login', () => {
    it('throws when credentials are incomplete', async () => {
      setValidEnv();

      await expect(new AngelAuthService().login()).rejects.toThrow(AngelAuthError);
    });

    it('requests a token from /login and stores jwt, feed and refresh tokens', async () => {
      setValidEnv();
      process.env.ANGEL_PASSWORD = 'pass-1';
      process.env.ANGEL_TOTP = 'totp-1';

      const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: true,
          data: {
            jwtToken: 'jwt-1',
            refreshToken: 'refresh-1',
            feedToken: 'feed-1',
            sid: 'sid-1',
            userSID: 'userSID-1',
          },
        }),
      } as unknown as Response);

      const service = new AngelAuthService();

      await service.login();

      expect(service.getAccessToken()).toBe('jwt-1');
      expect(service.getFeedToken()).toBe('feed-1');
      expect(service.isRefreshable()).toBe(true);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/rest/auth/angelbrokingUser/v1/login');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init!.body as string)).toEqual({
        clientcode: 'client-1',
        password: 'pass-1',
        totp: 'totp-1',
        apikey: 'api-1',
      });
    });

    it('generates the totp from ANGEL_TOTP_SECRET when no explicit totp is set', async () => {
      setValidEnv();
      process.env.ANGEL_PASSWORD = 'pass-1';
      process.env.ANGEL_TOTP_SECRET = 'BDII3L372XF32BLNNFTWN4AVN4';

      const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: true,
          data: { jwtToken: 'jwt-1', refreshToken: 'refresh-1', feedToken: 'feed-1' },
        }),
      } as unknown as Response);

      const service = new AngelAuthService();
      await service.login();

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/rest/auth/angelbrokingUser/v1/login');
      const body = JSON.parse(init!.body as string);
      expect(body.totp).toMatch(/^\d{6}$/);
      expect(body.totp).not.toBe('');
      expect(body.clientcode).toBe('client-1');
      expect(body.password).toBe('pass-1');
    });

    it('throws AngelApiError when the login endpoint rejects', async () => {
      setValidEnv();
      process.env.ANGEL_PASSWORD = 'pass-1';
      process.env.ANGEL_TOTP = 'totp-1';

      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

      await expect(new AngelAuthService().login()).rejects.toThrow(AngelApiError);
    });

    it('throws AngelApiError on non-2xx response', async () => {
      setValidEnv();
      process.env.ANGEL_PASSWORD = 'pass-1';
      process.env.ANGEL_TOTP = 'totp-1';

      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ status: false, errorcode: 'AB1001', message: 'Invalid credentials' }),
      } as unknown as Response);

      await expect(new AngelAuthService().login()).rejects.toThrow(AngelApiError);
    });
  });

  describe('refreshAccessToken', () => {
    it('throws when no refresh token is configured', async () => {
      setValidEnv();

      await expect(new AngelAuthService().refreshAccessToken()).rejects.toThrow(AngelAuthError);
    });

    it('requests a new token from /refresh-token and stores it', async () => {
      setValidEnv();
      process.env.ANGEL_REFRESH_TOKEN = 'refresh-1';

      const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: true, data: { jwtToken: 'jwt-refreshed' } }),
      } as unknown as Response);

      const service = new AngelAuthService();

      const token = await service.refreshAccessToken();

      expect(token).toBe('jwt-refreshed');
      expect(service.getAccessToken()).toBe('jwt-refreshed');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/rest/auth/angelbrokingUser/v1/refresh-token');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init!.body as string)).toEqual({ refreshToken: 'refresh-1' });
    });

    it('never logs credentials', async () => {
      setValidEnv();
      process.env.ANGEL_REFRESH_TOKEN = 'refresh-1';
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: true, data: { jwtToken: 'jwt-refreshed' } }),
      } as unknown as Response);

      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const service = new AngelAuthService();

      await service.refreshAccessToken();

      const logged = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(logged).not.toContain('refresh-1');
      expect(logged).not.toContain('jwt-refreshed');
    });

    it('throws AngelApiError when the refresh endpoint rejects', async () => {
      setValidEnv();
      process.env.ANGEL_REFRESH_TOKEN = 'refresh-1';

      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

      await expect(new AngelAuthService().refreshAccessToken()).rejects.toThrow(AngelApiError);
    });

    it('throws AngelApiError on non-2xx response', async () => {
      setValidEnv();
      process.env.ANGEL_REFRESH_TOKEN = 'refresh-1';

      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ status: false, errorcode: 'AB1001', message: 'Invalid token' }),
      } as unknown as Response);

      await expect(new AngelAuthService().refreshAccessToken()).rejects.toThrow(AngelApiError);
    });
  });
});
