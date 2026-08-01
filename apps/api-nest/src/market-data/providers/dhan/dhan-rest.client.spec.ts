import { Test, TestingModule } from '@nestjs/testing';
import { DhanAuthService } from './dhan-auth.service';
import { DhanRestClient } from './dhan-rest.client';
import { DhanApiError, DhanHistoricalResponse, DhanInstrument } from './dhan.types';

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as unknown as Response;
}

describe('DhanRestClient', () => {
  const ENV_BACKUP = { ...process.env };

  let module: TestingModule;
  let client: DhanRestClient;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    process.env = { ...ENV_BACKUP };
    process.env.NODE_ENV = 'test';
    process.env.DHAN_CLIENT_ID = 'client-1';
    process.env.DHAN_ACCESS_TOKEN = 'token-1';
    process.env.DHAN_REFRESH_TOKEN = 'refresh-1';
    process.env.DHAN_MAX_RETRIES = '2';
    process.env.DHAN_RETRY_BASE_DELAY_MS = '1';

    fetchMock = jest.fn();
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock as typeof fetch);

    module = await Test.createTestingModule({
      providers: [DhanAuthService, DhanRestClient],
    }).compile();
    client = module.get(DhanRestClient);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    process.env = { ...ENV_BACKUP };
    await module?.close();
  });

  describe('getInstruments', () => {
    it('returns the instrument master and sends auth headers', async () => {
      const instruments: DhanInstrument[] = [
        {
          dhanClientId: 'client-1',
          exchange: 'NSE',
          exchangeSegment: 'NSE_EQ',
          instrumentType: 'EQ',
          instrumentId: 'EQUITY',
          tradingSymbol: 'RELIANCE',
          securityId: '13',
          expiry: null,
          lotSize: 1,
          tickSize: 0.05,
          isin: 'INE002A01018',
          underlyngScrip: null,
          underlyingType: null,
          strikePrice: 0,
          segment: 'CASH',
        },
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse(instruments));

      const result = await client.getInstruments('NSE_EQ');

      expect(result).toEqual(instruments);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/instruments');
      expect(url).toContain('ExchangeSegment=NSE_EQ');
      expect(init.headers['access-token']).toBe('token-1');
      expect(init.headers['client-id']).toBe('client-1');
    });
  });

  describe('getQuote', () => {
    it('quotes a security id for an exchange segment', async () => {
      const quote = {
        securityId: '13',
        exchangeSegment: 'NSE_EQ',
        lastTradedPrice: 2764.55,
        symbol: 'RELIANCE',
        timestamp: '2024-01-05T09:15:00+05:30',
      };
      fetchMock.mockResolvedValueOnce(jsonResponse(quote));

      const result = await client.getQuote('13', 'NSE_EQ');

      expect(result.symbol).toBe('RELIANCE');
      expect(fetchMock.mock.calls[0][0]).toContain('/quote/13');
      expect(fetchMock.mock.calls[0][0]).toContain('exchangeSegment=NSE_EQ');
    });
  });

  describe('getHistoricalCandles', () => {
    it('normalizes the parallel-series response into candles', async () => {
      const response: DhanHistoricalResponse = {
        data: {
          open: [100, 101],
          high: [105, 106],
          low: [99, 100],
          close: [103, 104],
          volume: [1000, 1200],
          start: ['2024-01-01 09:15', '2024-01-02 09:15'],
          end: ['2024-01-01 15:30', '2024-01-02 15:30'],
        },
      };
      fetchMock.mockResolvedValueOnce(jsonResponse(response));

      const candles = await client.getHistoricalCandles({
        symbol: 'RELIANCE',
        securityType: 'EQUITY',
        exchange: 'NSE',
        instrument: 'EQUITY',
        fromDate: '20240101',
        toDate: '20240102',
      });

      expect(candles).toHaveLength(2);
      expect(candles[0]).toEqual({
        open: 100,
        high: 105,
        low: 99,
        close: 103,
        volume: 1000,
        start: '2024-01-01 09:15',
        end: '2024-01-01 15:30',
      });
      expect(fetchMock.mock.calls[0][0]).toContain('/historical/fromdate/20240101');
    });
  });

  describe('error handling', () => {
    it('refreshes the token once on auth failure and retries', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (url.includes('/token/refresh')) {
          return Promise.resolve(jsonResponse({ accessToken: 'refreshed-token' }));
        }
        if (
          fetchMock.mock.calls.filter((call) => !call[0].includes('/token/refresh')).length === 1
        ) {
          return Promise.resolve(
            jsonResponse({ errorCode: 701, errorDescription: 'Invalid token' }, 401),
          );
        }
        return Promise.resolve(jsonResponse({ symbol: 'RELIANCE', lastTradedPrice: 100 }));
      });

      const quote = await client.getQuote('13', 'NSE_EQ');

      expect(quote.lastTradedPrice).toBe(100);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      const headers = fetchMock.mock.calls[2][1].headers;
      expect(headers['access-token']).toBe('refreshed-token');
    });

    it('retries with backoff on 5xx responses', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ errorDescription: 'boom' }, 500));
      fetchMock.mockResolvedValueOnce(jsonResponse({ symbol: 'RELIANCE', lastTradedPrice: 100 }));

      const quote = await client.getQuote('13', 'NSE_EQ');

      expect(quote.lastTradedPrice).toBe(100);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not retry 4xx client errors beyond refresh', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ errorCode: 400, errorDescription: 'Bad request' }, 400),
      );

      await expect(client.getQuote('13', 'NSE_EQ')).rejects.toThrow(DhanApiError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('throws a typed DhanApiError with context for 5xx after exhausting retries', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ errorCode: 500, errorDescription: 'Internal' }, 500),
      );

      await expect(client.getQuote('13', 'NSE_EQ')).rejects.toMatchObject({
        name: 'DhanApiError',
        status: 500,
        retryable: true,
        context: '/quote/13',
      });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('throws a non-retryable DhanApiError when the request times out', async () => {
      process.env.DHAN_TIMEOUT_MS = '5';
      fetchMock.mockImplementation(
        () => new Promise((_resolve, reject) => setTimeout(() => reject(new Error('aborted')), 50)),
      );

      await expect(client.getQuote('13', 'NSE_EQ')).rejects.toThrow(DhanApiError);
    });
  });

  describe('getFundamentals', () => {
    it('fetches fundamentals for a symbol', async () => {
      const fundamentals = {
        basicInfo: { symbol: 'RELIANCE', companyName: 'Reliance Industries Ltd' },
        financials: { revenue: 100000 },
        ratio: { pe: 25 },
        valuation: { marketCap: 2000000 },
      };
      fetchMock.mockResolvedValueOnce(jsonResponse(fundamentals));

      const result = await client.getFundamentals('RELIANCE');

      expect(result.basicInfo.companyName).toBe('Reliance Industries Ltd');
      expect(fetchMock.mock.calls[0][0]).toContain('/fundamentals/RELIANCE');
      expect(fetchMock.mock.calls[0][0]).toContain('exchange=NSE');
    });
  });
});
