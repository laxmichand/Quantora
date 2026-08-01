export type AngelExchange = 'NSE' | 'BSE' | 'NFO' | 'BFO' | 'MCX' | 'CDS';

export type AngelQuoteMode = 'LTP' | 'OHLC' | 'FULL';

export type AngelInterval =
  | 'ONE_MINUTE'
  | 'THREE_MINUTE'
  | 'FIVE_MINUTE'
  | 'TEN_MINUTE'
  | 'FIFTEEN_MINUTE'
  | 'THIRTY_MINUTE'
  | 'ONE_HOUR'
  | 'ONE_DAY';

export interface AngelInstrument {
  token: string;
  symbol: string;
  name: string;
  expiry: string;
  strike: string;
  lotsize: string;
  instrumenttype: string;
  exch_seg: string;
  tick_size: string;
}

export interface AngelCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AngelHistoricalRequest {
  exchange: AngelExchange;
  symbolToken: string;
  interval: AngelInterval;
  fromDate: string;
  toDate: string;
}

export interface AngelHistoricalResponse {
  status: boolean;
  message?: string;
  errorcode?: string;
  data?: {
    candles?: Array<[string, number, number, number, number, number]>;
  };
}

export interface AngelQuote {
  symbol?: string;
  tradingSymbol?: string;
  token?: string;
  exchange?: string;
  ltp?: number;
  lastprice?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  previousclose?: number;
  netchange?: number;
  netchangepercent?: number;
  totalTradingValue?: number;
  trades?: number;
  timestamp?: string;
}

export interface AngelQuoteResponse {
  status: boolean;
  message?: string;
  errorcode?: string;
  data?: Record<string, AngelQuote>;
}

export interface AngelAuthResponse {
  status: boolean;
  message?: string;
  errorcode?: string;
  data?: {
    jwtToken?: string;
    refreshToken?: string;
    feedToken?: string;
    sid?: string;
    userSID?: string;
  };
}

export interface AngelErrorBody {
  status?: boolean;
  errorcode?: string;
  message?: string;
}

export const ANGEL_ERROR_CODES = {
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
} as const;

export class AngelApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly context: string;
  readonly retryable: boolean;

  constructor(
    message: string,
    opts: {
      status?: number;
      code?: string;
      context?: string;
      retryable?: boolean;
    } = {},
  ) {
    super(message);
    this.name = 'AngelApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.context = opts.context ?? 'angel';
    this.retryable = opts.retryable ?? false;
  }
}

export class AngelAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AngelAuthError';
  }
}

const AUTH_FAILURE_CODES = new Set(['1001', '1002', 'AB1001', 'AB1002', 'AB1011']);

export function isAuthFailure(
  status: number | undefined,
  code: string | undefined,
  message?: string,
): boolean {
  if (status === 401) return true;
  if (code && AUTH_FAILURE_CODES.has(code.toUpperCase())) return true;
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('token') &&
    (lower.includes('expired') || lower.includes('invalid') || lower.includes('session'))
  );
}
