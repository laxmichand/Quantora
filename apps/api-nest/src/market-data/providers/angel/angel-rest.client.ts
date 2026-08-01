import { Injectable, Logger } from '@nestjs/common';
import { AngelAuthService } from './angel-auth.service';
import {
  AngelApiError,
  AngelCandle,
  AngelErrorBody,
  AngelHistoricalRequest,
  AngelHistoricalResponse,
  AngelInstrument,
  AngelQuote,
  AngelQuoteResponse,
  ANGEL_ERROR_CODES,
  isAuthFailure,
} from './angel.types';
import { AngelConfig } from './angel.config';

interface AngelRequestOptions {
  method?: 'GET' | 'POST';
  query?: Record<string, string>;
  body?: Record<string, unknown>;
  skipAuth?: boolean;
}

interface AngelQuoteToken {
  exchange: string;
  symbolToken: string;
}

@Injectable()
export class AngelRestClient {
  private readonly logger = new Logger(AngelRestClient.name);
  private readonly config: AngelConfig;

  constructor(private readonly auth: AngelAuthService) {
    this.config = this.auth.getConfig();
  }

  async getInstruments(): Promise<AngelInstrument[]> {
    // OpenAPI scrip master is a public file — no auth headers required.
    return this.get<AngelInstrument[]>(this.config.scripMasterUrl, { skipAuth: true });
  }

  async getQuote(exchange: string, symbolToken: string): Promise<AngelQuote> {
    const quotes = await this.getQuotes([{ exchange, symbolToken }]);
    return quotes[`${exchange}:${symbolToken}`];
  }

  async getQuotes(tokens: AngelQuoteToken[], mode = 'FULL'): Promise<Record<string, AngelQuote>> {
    if (tokens.length === 0) return {};
    const exchangeTokens = tokens.map((t) => `${t.exchange}:${t.symbolToken}`).join(',');
    const response = await this.get<AngelQuoteResponse>(
      '/rest/secure/angelbroking/market/v1/quote',
      { query: { mode, exchangeTokens } },
    );
    return response?.data ?? {};
  }

  async getHistoricalOHLCV(request: AngelHistoricalRequest): Promise<AngelHistoricalResponse> {
    return this.get<AngelHistoricalResponse>(
      '/rest/secure/angelbroking/historical/v1/getCandleData',
      {
        query: {
          exchange: request.exchange,
          symboltoken: request.symbolToken,
          interval: request.interval,
          fromdate: request.fromDate,
          todate: request.toDate,
        },
      },
    );
  }

  async getHistoricalCandles(request: AngelHistoricalRequest): Promise<AngelCandle[]> {
    const response = await this.getHistoricalOHLCV(request);
    return this.toCandles(response);
  }

  toCandles(response: AngelHistoricalResponse): AngelCandle[] {
    const rows = response.data?.candles;
    if (!rows || rows.length === 0) return [];
    return rows.map(([timestamp, open, high, low, close, volume]) => ({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    }));
  }

  private async get<T>(
    path: string,
    opts?: Omit<AngelRequestOptions, 'method' | 'body'>,
  ): Promise<T> {
    return this.request<T>(path, { ...opts, method: 'GET' });
  }

  private async request<T>(
    path: string,
    opts: AngelRequestOptions,
    attempt = 0,
    refreshed = false,
  ): Promise<T> {
    await this.ensureAuthenticated(opts);
    const url = this.buildUrl(path, opts.query);
    const controller = new AbortController();
    const timer = setTimeout(
      () =>
        controller.abort(new Error(`Angel One request timed out after ${this.config.timeoutMs}ms`)),
      this.config.timeoutMs,
    );

    let res: Response;
    try {
      res = await fetch(url, {
        method: opts.method ?? 'GET',
        headers: this.buildHeaders(opts),
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if ((err as Error).name === 'AbortError') {
        throw new AngelApiError((err as Error).message, {
          context: path,
          retryable: false,
        });
      }
      if (attempt < this.config.maxRetries) {
        await this.backoff(attempt);
        return this.request<T>(path, opts, attempt + 1, refreshed);
      }
      throw new AngelApiError(`Angel One request to ${path} failed: ${(err as Error).message}`, {
        context: path,
        retryable: true,
      });
    }
    clearTimeout(timer);

    const body = await this.parseJson(res);

    if (res.ok) {
      const errorBody = toErrorBody(body);
      if (errorBody) {
        return this.handleError<T>(path, opts, body, res.status, errorBody, attempt, refreshed);
      }
      return body as T;
    }

    return this.handleError<T>(path, opts, body, res.status, undefined, attempt, refreshed);
  }

  private async handleError<T>(
    path: string,
    opts: AngelRequestOptions,
    body: unknown,
    status: number,
    errorBody: AngelErrorBody | undefined,
    attempt: number,
    refreshed: boolean,
  ): Promise<T> {
    const { code, message } = toErrorParts(errorBody, body);

    if (isAuthFailure(status, code, message) && !refreshed && this.auth.isRefreshable()) {
      this.logger.warn('Angel One auth failed — refreshing tokens and retrying once');
      try {
        await this.auth.refreshAccessToken();
      } catch (err) {
        throw new AngelApiError(
          `Angel One token refresh failed after auth error: ${(err as Error).message}`,
          { status, code, context: path },
        );
      }
      return this.request<T>(path, opts, attempt, true);
    }

    const retryable =
      status === ANGEL_ERROR_CODES.RATE_LIMIT || status >= ANGEL_ERROR_CODES.INTERNAL_ERROR;
    if (retryable && attempt < this.config.maxRetries) {
      await this.backoff(attempt);
      return this.request<T>(path, opts, attempt + 1, refreshed);
    }

    throw new AngelApiError(message || `Angel One responded with HTTP ${status}`, {
      status,
      code,
      context: path,
      retryable,
    });
  }

  private async ensureAuthenticated(opts: AngelRequestOptions): Promise<void> {
    if (opts.skipAuth) return;
    await this.auth.ensureAuthenticated();
  }

  private buildUrl(path: string, query?: Record<string, string>): string {
    const base = /^https?:\/\//i.test(path) ? path : `${this.config.baseUrl}${path}`;
    const url = new URL(base);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }

  private buildHeaders(opts: AngelRequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (!opts.skipAuth) {
      headers['Authorization'] = `Bearer ${this.auth.getAccessToken()}`;
      headers['X-PrivateKey'] = this.config.apiKey;
      headers['X-ClientCode'] = this.config.clientCode;
      const feedToken = this.auth.getFeedToken();
      if (feedToken) {
        headers['X-FeedToken'] = feedToken;
      }
    }
    return headers;
  }

  private async parseJson(res: Response): Promise<unknown> {
    try {
      return await res.json();
    } catch {
      return undefined;
    }
  }

  private async backoff(attempt: number): Promise<void> {
    const delay =
      Math.min(this.config.retryBaseDelayMs * 2 ** attempt, 10_000) + Math.random() * 50;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

function toErrorBody(body: unknown): AngelErrorBody | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const candidate = body as { status?: unknown; errorcode?: unknown; message?: unknown };
  if (candidate.status === false) {
    return {
      status: false,
      errorcode: typeof candidate.errorcode === 'string' ? candidate.errorcode : undefined,
      message: typeof candidate.message === 'string' ? candidate.message : undefined,
    };
  }
  return undefined;
}

function toErrorParts(
  errorBody: AngelErrorBody | undefined,
  body: unknown,
): { code?: string; message?: string } {
  if (errorBody) return { code: errorBody.errorcode, message: errorBody.message };
  return extractError(body);
}

function extractError(body: unknown): { code?: string; message?: string } {
  if (!body || typeof body !== 'object') return {};
  const candidate = body as {
    errorcode?: unknown;
    errorCode?: unknown;
    message?: unknown;
    errorDescription?: unknown;
  };
  return {
    code:
      typeof candidate.errorcode === 'string'
        ? candidate.errorcode
        : typeof candidate.errorCode === 'number'
          ? String(candidate.errorCode)
          : undefined,
    message:
      typeof candidate.message === 'string'
        ? candidate.message
        : typeof candidate.errorDescription === 'string'
          ? candidate.errorDescription
          : undefined,
  };
}
