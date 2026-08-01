import { Injectable, Logger } from '@nestjs/common';
import { DhanAuthService } from './dhan-auth.service';
import {
  DhanApiError,
  DhanCandle,
  DhanErrorBody,
  DhanExchangeSegment,
  DhanFundamental,
  DhanHistoricalRequest,
  DhanHistoricalResponse,
  DhanInstrument,
  DhanQuote,
  DHAN_ERROR_CODES,
  isAuthFailure,
} from './dhan.types';
import { DhanConfig } from './dhan.config';

interface DhanRequestOptions {
  method?: 'GET' | 'POST';
  query?: Record<string, string>;
  body?: Record<string, unknown>;
}

@Injectable()
export class DhanRestClient {
  private readonly logger = new Logger(DhanRestClient.name);
  private readonly config: DhanConfig;

  constructor(private readonly auth: DhanAuthService) {
    this.config = this.auth.getConfig();
  }

  async getInstruments(exchangeSegment?: DhanExchangeSegment): Promise<DhanInstrument[]> {
    return this.get<DhanInstrument[]>('/instruments', {
      query: exchangeSegment ? { ExchangeSegment: exchangeSegment } : undefined,
    });
  }

  async getInstrument(scripCode: string): Promise<DhanInstrument> {
    return this.get<DhanInstrument>(`/instruments/${encodeURIComponent(scripCode)}`);
  }

  async getQuote(securityId: string, exchangeSegment: DhanExchangeSegment): Promise<DhanQuote> {
    return this.get<DhanQuote>(`/quote/${encodeURIComponent(securityId)}`, {
      query: { exchangeSegment },
    });
  }

  async getHistoricalOHLCV(request: DhanHistoricalRequest): Promise<DhanHistoricalResponse> {
    const path = [
      '/historical',
      'fromdate',
      request.fromDate,
      'todate',
      request.toDate,
      'symbol',
      encodeURIComponent(request.symbol),
      'securitytype',
      request.securityType,
      'exchange',
      request.exchange,
      'instrument',
      request.instrument,
    ].join('/');
    return this.get<DhanHistoricalResponse>(path);
  }

  async getHistoricalCandles(request: DhanHistoricalRequest): Promise<DhanCandle[]> {
    const response = await this.getHistoricalOHLCV(request);
    return this.toCandles(response);
  }

  async getFundamentals(symbol: string, exchange: 'NSE' | 'BSE' = 'NSE'): Promise<DhanFundamental> {
    return this.get<DhanFundamental>(`/fundamentals/${encodeURIComponent(symbol)}`, {
      query: { exchange },
    });
  }

  toCandles(response: DhanHistoricalResponse): DhanCandle[] {
    const { open, high, low, close, volume, start, end } = response.data ?? {};
    if (!open || !high || !low || !close || !volume || !start || !end) {
      throw new DhanApiError('DhanHQ historical response missing series data', {
        context: 'historical',
      });
    }
    const count = start.length;
    const candles: DhanCandle[] = [];
    for (let i = 0; i < count; i++) {
      candles.push({
        open: open[i] ?? 0,
        high: high[i] ?? 0,
        low: low[i] ?? 0,
        close: close[i] ?? 0,
        volume: volume[i] ?? 0,
        start: start[i],
        end: end[i] ?? start[i],
      });
    }
    return candles;
  }

  private async get<T>(
    path: string,
    opts?: Omit<DhanRequestOptions, 'method' | 'body'>,
  ): Promise<T> {
    return this.request<T>(path, { ...opts, method: 'GET' });
  }

  private async request<T>(
    path: string,
    opts: DhanRequestOptions,
    attempt = 0,
    refreshed = false,
  ): Promise<T> {
    const url = this.buildUrl(path, opts.query);
    const controller = new AbortController();
    const timer = setTimeout(
      () =>
        controller.abort(new Error(`DhanHQ request timed out after ${this.config.timeoutMs}ms`)),
      this.config.timeoutMs,
    );

    let res: Response;
    try {
      res = await fetch(url, {
        method: opts.method ?? 'GET',
        headers: this.buildHeaders(),
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new DhanApiError((err as Error).message, {
          context: path,
          retryable: false,
        });
      }
      if (attempt < this.config.maxRetries) {
        await this.backoff(attempt);
        return this.request<T>(path, opts, attempt + 1, refreshed);
      }
      throw new DhanApiError(`DhanHQ request to ${path} failed: ${(err as Error).message}`, {
        context: path,
        retryable: true,
      });
    } finally {
      clearTimeout(timer);
    }

    if (res.ok) {
      return this.parse<T>(res, path);
    }

    const body = await this.parseErrorBody(res);
    const status = res.status;
    const code = body?.errorCode;

    if (isAuthFailure(status, code) && !refreshed && this.auth.isRefreshable()) {
      this.logger.warn('DhanHQ auth failed — refreshing access token and retrying once');
      try {
        await this.auth.refreshAccessToken();
      } catch (err) {
        throw new DhanApiError(
          `DhanHQ token refresh failed after auth error: ${(err as Error).message}`,
          { status, code, context: path },
        );
      }
      return this.request<T>(path, opts, attempt, true);
    }

    const retryable =
      status === DHAN_ERROR_CODES.RATE_LIMIT || status >= DHAN_ERROR_CODES.INTERNAL_ERROR;
    if (retryable && attempt < this.config.maxRetries) {
      await this.backoff(attempt, res.headers?.get?.('retry-after') ?? undefined);
      return this.request<T>(path, opts, attempt + 1, refreshed);
    }

    throw new DhanApiError(body?.errorDescription || `DhanHQ responded with HTTP ${status}`, {
      status,
      code,
      context: path,
      retryable,
    });
  }

  private buildUrl(path: string, query?: Record<string, string>): string {
    const url = new URL(`${this.config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }

  private buildHeaders(): Record<string, string> {
    return {
      'access-token': this.auth.getAccessToken(),
      'client-id': this.config.clientId,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private async parse<T>(res: Response, path: string): Promise<T> {
    if (res.status === 204) {
      return undefined as T;
    }
    try {
      return (await res.json()) as T;
    } catch {
      throw new DhanApiError(`DhanHQ returned non-JSON body for ${path}`, {
        status: res.status,
        context: path,
      });
    }
  }

  private async parseErrorBody(res: Response): Promise<DhanErrorBody | undefined> {
    try {
      return (await res.json()) as DhanErrorBody;
    } catch {
      return undefined;
    }
  }

  private async backoff(attempt: number, retryAfterHeader?: string): Promise<void> {
    const retryAfterMs = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) * 1000 : 0;
    const delay =
      Number.isFinite(retryAfterMs) && retryAfterMs > 0
        ? retryAfterMs
        : Math.min(this.config.retryBaseDelayMs * 2 ** attempt, 10_000) + Math.random() * 50;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
