import { Test, TestingModule } from '@nestjs/testing';
import { AngelAuthService } from './angel-auth.service';
import { AngelRestClient } from './angel-rest.client';
import { AngelApiError, AngelHistoricalResponse, AngelInstrument } from './angel.types';

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as unknown as Response;
}

describe('AngelRestClient', () => {
  const ENV_BACKUP = { ...process.env };

  let module: TestingModule;
  let client: AngelRestClient;
  let auth: AngelAuthService;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    process.env = { ...ENV_BACKUP };
    process.env.NODE_ENV = 'test';
    process.env.ANGEL_API_KEY = 'api-1';
    process.env.ANGEL_CLIENT_CODE = 'client-1';
    process.env.ANGEL_REFRESH_TOKEN = 'refresh-1';
    process.env.ANGEL_MAX_RETRIES = '2';
    process.env.ANGEL_RETRY_BASE_DELAY_MS = '1';

    fetchMock = jest.fn();
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock as typeof fetch);

    module = await Test.createTestingModule({
      providers: [AngelAuthService, AngelRestClient],
    }).compile();
    auth = module.get(AngelAuthService);
    client = module.get(AngelRestClient);

    // Pre-authenticate so market calls start with a valid token.
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: true, data: { jwtToken: 'jwt-init' } }));
    await auth.refreshAccessToken();
    fetchMock.mockClear();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    process.env = { ...ENV_BACKUP };
    await module?.close();
  });

  describe('getInstruments', () => {
    it('fetches the public scrip master without auth headers', async () => {
      const instruments: AngelInstrument[] = [
        {
          token: '1333',
          symbol: 'RELIANCE-EQ',
          name: 'RELIANCE',
          expiry: '',
          strike: '',
          lotsize: '1',
          instrumenttype: 'EQ',
          exch_seg: 'NSE',
          tick_size: '0.05',
        },
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse(instruments));

      const result = await client.getInstruments();

      expect(result).toEqual(instruments);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('margincalculator.angelbroking.com');
      expect(init.headers['Authorization']).toBeUndefined();
      expect(init.headers['X-FeedToken']).toBeUndefined();
    });
  });

  describe('getQuote', () => {
    it('quotes a symbol token and sends Angel market headers', async () => {
      const quote = { symbol: 'RELIANCE', ltp: 2764.55, open: 2750, close: 2700 };
      fetchMock.mockResolvedValueOnce(jsonResponse({ status: true, data: { 'NSE:1333': quote } }));

      const result = await client.getQuote('NSE', '1333');

      expect(result.symbol).toBe('RELIANCE');
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/rest/secure/angelbroking/market/v1/quote');
      expect(url).toContain('mode=FULL');
      expect(url).toContain('exchangeTokens=NSE%3A1333');
      expect(init.headers['Authorization']).toBe('Bearer jwt-init');
      expect(init.headers['X-PrivateKey']).toBe('api-1');
      expect(init.headers['X-ClientCode']).toBe('client-1');
    });
  });

  describe('getHistoricalCandles', () => {
    it('normalizes the candle-rows response', async () => {
      const response: AngelHistoricalResponse = {
        status: true,
        data: {
          candles: [
            ['2024-01-01T09:15:00+05:30', 100, 105, 99, 103, 1000],
            ['2024-01-02T09:15:00+05:30', 101, 106, 100, 104, 1200],
          ],
        },
      };
      fetchMock.mockResolvedValueOnce(jsonResponse(response));

      const candles = await client.getHistoricalCandles({
        exchange: 'NSE',
        symbolToken: '1333',
        interval: 'ONE_DAY',
        fromDate: '2024-01-01 09:15',
        toDate: '2024-01-02 15:30',
      });

      expect(candles).toHaveLength(2);
      expect(candles[0]).toEqual({
        timestamp: '2024-01-01T09:15:00+05:30',
        open: 100,
        high: 105,
        low: 99,
        close: 103,
        volume: 1000,
      });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/rest/secure/angelbroking/historical/v1/getCandleData');
      expect(url).toContain('exchange=NSE');
      expect(url).toContain('symboltoken=1333');
      expect(url).toContain('interval=ONE_DAY');
    });

    it('returns an empty list when no candles are present', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ status: true, data: { candles: [] } }));

      const candles = await client.getHistoricalCandles({
        exchange: 'NSE',
        symbolToken: '1333',
        interval: 'ONE_DAY',
        fromDate: '2024-01-01 09:15',
        toDate: '2024-01-02 15:30',
      });

      expect(candles).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('refreshes the token once on auth failure and retries', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.includes('/rest/auth/angelbrokingUser/v1/refresh-token')) {
          return Promise.resolve(jsonResponse({ status: true, data: { jwtToken: 'jwt-2' } }));
        }
        if (
          fetchMock.mock.calls.filter(
            (call) => !call[0].includes('/rest/auth/angelbrokingUser/v1/refresh-token'),
          ).length === 1
        ) {
          return Promise.resolve(
            jsonResponse({ status: false, errorcode: 'AB1001', message: 'Token expired' }, 401),
          );
        }
        return Promise.resolve(jsonResponse({ status: true, data: { 'NSE:1333': { ltp: 100 } } }));
      });

      const quote = await client.getQuote('NSE', '1333');

      expect(quote.ltp).toBe(100);
      const marketCalls = fetchMock.mock.calls.filter(
        (call) => !call[0].includes('/rest/auth/angelbrokingUser/v1/refresh-token'),
      );
      expect(marketCalls).toHaveLength(2);
      expect(marketCalls[1][1].headers['Authorization']).toBe('Bearer jwt-2');
    });

    it('treats status:false envelopes as errors and refreshes once', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.includes('/rest/auth/angelbrokingUser/v1/refresh-token')) {
          return Promise.resolve(jsonResponse({ status: true, data: { jwtToken: 'jwt-3' } }));
        }
        if (
          fetchMock.mock.calls.filter(
            (call) => !call[0].includes('/rest/auth/angelbrokingUser/v1/refresh-token'),
          ).length === 1
        ) {
          return Promise.resolve(
            jsonResponse({ status: false, errorcode: 'AB1001', message: 'Token expired' }),
          );
        }
        return Promise.resolve(jsonResponse({ status: true, data: { 'NSE:1333': { ltp: 90 } } }));
      });

      const quote = await client.getQuote('NSE', '1333');

      expect(quote.ltp).toBe(90);
    });

    it('retries with backoff on 5xx responses', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ status: false, message: 'boom' }, 500));
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ status: true, data: { 'NSE:1333': { ltp: 100 } } }),
      );

      const quote = await client.getQuote('NSE', '1333');

      expect(quote.ltp).toBe(100);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not retry 4xx client errors beyond refresh', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ status: false, errorcode: 'AB9002', message: 'Bad request' }, 400),
      );

      await expect(client.getQuote('NSE', '1333')).rejects.toThrow(AngelApiError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('throws a typed AngelApiError with context for 5xx after exhausting retries', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ status: false, message: 'Internal' }, 500));

      await expect(client.getQuote('NSE', '1333')).rejects.toMatchObject({
        name: 'AngelApiError',
        status: 500,
        retryable: true,
        context: '/rest/secure/angelbroking/market/v1/quote',
      });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('throws a non-retryable AngelApiError when the request times out', async () => {
      process.env.ANGEL_TIMEOUT_MS = '5';
      fetchMock.mockImplementation(
        () => new Promise((_resolve, reject) => setTimeout(() => reject(new Error('aborted')), 50)),
      );

      await expect(client.getQuote('NSE', '1333')).rejects.toThrow(AngelApiError);
    });
  });
});
