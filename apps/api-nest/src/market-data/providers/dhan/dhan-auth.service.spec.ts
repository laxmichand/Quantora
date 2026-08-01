import { DhanAuthService } from './dhan-auth.service';
import { DhanApiError, DhanAuthError } from './dhan.types';

describe('DhanAuthService', () => {
  const ENV_BACKUP = { ...process.env };

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
    jest.restoreAllMocks();
  });

  function setValidEnv(): void {
    process.env.NODE_ENV = 'test';
    process.env.DHAN_CLIENT_ID = 'client-1';
    process.env.DHAN_ACCESS_TOKEN = 'token-1';
  }

  describe('constructor', () => {
    it('loads credentials from env', () => {
      setValidEnv();

      const service = new DhanAuthService();

      expect(service.getAccessToken()).toBe('token-1');
      expect(service.getConfig().clientId).toBe('client-1');
    });

    it('does not throw when env missing in test mode', () => {
      process.env.NODE_ENV = 'test';
      process.env.DHAN_CLIENT_ID = '';
      process.env.DHAN_ACCESS_TOKEN = '';

      expect(() => new DhanAuthService()).not.toThrow();
    });

    it('throws when env missing outside test mode (fail fast)', () => {
      process.env.NODE_ENV = 'production';
      process.env.DHAN_CLIENT_ID = '';
      process.env.DHAN_ACCESS_TOKEN = '';

      expect(() => new DhanAuthService()).toThrow(/DHAN_CLIENT_ID/);
    });
  });

  describe('getAccessToken', () => {
    it('throws when no token is configured', () => {
      process.env.NODE_ENV = 'test';
      process.env.DHAN_CLIENT_ID = 'client-1';
      process.env.DHAN_ACCESS_TOKEN = '';

      const service = new DhanAuthService();

      expect(() => service.getAccessToken()).toThrow(DhanAuthError);
    });
  });

  describe('isRefreshable', () => {
    it('is true only when a refresh token is configured', () => {
      setValidEnv();
      expect(new DhanAuthService().isRefreshable()).toBe(false);

      process.env.DHAN_REFRESH_TOKEN = 'refresh-1';
      expect(new DhanAuthService().isRefreshable()).toBe(true);
    });
  });

  describe('refreshAccessToken', () => {
    it('throws when no refresh token is configured', async () => {
      setValidEnv();

      await expect(new DhanAuthService().refreshAccessToken()).rejects.toThrow(DhanAuthError);
    });

    it('requests a new token from /token/refresh and stores it', async () => {
      setValidEnv();
      process.env.DHAN_REFRESH_TOKEN = 'refresh-1';

      const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'refreshed-token' }),
      } as unknown as Response);

      const service = new DhanAuthService();

      const token = await service.refreshAccessToken();

      expect(token).toBe('refreshed-token');
      expect(service.getAccessToken()).toBe('refreshed-token');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/token/refresh');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init!.body as string)).toEqual({ refreshToken: 'refresh-1' });
    });

    it('never logs credentials', async () => {
      setValidEnv();
      process.env.DHAN_REFRESH_TOKEN = 'refresh-1';
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'refreshed-token' }),
      } as unknown as Response);

      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const service = new DhanAuthService();

      await service.refreshAccessToken();

      const logged = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(logged).not.toContain('token-1');
      expect(logged).not.toContain('refresh-1');
    });

    it('throws DhanApiError when the refresh endpoint rejects', async () => {
      setValidEnv();
      process.env.DHAN_REFRESH_TOKEN = 'refresh-1';

      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

      await expect(new DhanAuthService().refreshAccessToken()).rejects.toThrow(DhanApiError);
    });

    it('throws DhanApiError on non-2xx response', async () => {
      setValidEnv();
      process.env.DHAN_REFRESH_TOKEN = 'refresh-1';

      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ errorCode: 701, errorDescription: 'Invalid token' }),
      } as unknown as Response);

      await expect(new DhanAuthService().refreshAccessToken()).rejects.toThrow(DhanApiError);
    });
  });
});
