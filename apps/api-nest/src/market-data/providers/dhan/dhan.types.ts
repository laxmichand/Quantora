export type DhanExchangeSegment =
  | 'NSE_EQ'
  | 'NSE_FNO'
  | 'BSE_EQ'
  | 'BSE_FNO'
  | 'MCX_COMM'
  | 'IDX_I'
  | 'NSE_CURRENCY'
  | 'BSE_CURRENCY';

export type DhanSecurityType =
  'EQUITY' | 'FUTIDX' | 'OPTIDX' | 'FUTSTK' | 'OPTSTK' | 'FUTCOM' | 'OPTCOM' | 'FUTCUR' | 'OPTCUR';

export type DhanInstrumentType = 'EQUITY' | 'INDEX' | 'FUTURES' | 'OPTIONS' | 'CURRENCY';

export interface DhanInstrument {
  dhanClientId: string;
  exchange: string;
  exchangeSegment: string;
  instrumentType: string;
  instrumentId: string;
  tradingSymbol: string;
  securityId: string;
  expiry: string | null;
  lotSize: number;
  tickSize: number;
  isin: string | null;
  underlyngScrip: string | null;
  underlyingType: string | null;
  strikePrice: number;
  segment: string;
}

export interface DhanQuoteBidAsk {
  price: number;
  quantity: number;
  orders: number;
}

export interface DhanQuote {
  securityId: string;
  exchangeSegment: string;
  instrumentId: string;
  lastTradedPrice: number;
  lastTradedQuantity: number;
  volume: number;
  avgTradedPrice: number;
  open: number;
  high: number;
  low: number;
  close: number;
  netChange: number;
  netChangePerc: number;
  totalTradedValue: number;
  previousClose: number;
  symbol: string;
  timestamp: string;
  bid?: DhanQuoteBidAsk;
  ask?: DhanQuoteBidAsk;
}

export interface DhanHistoricalSeries {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  start: string[];
  end: string[];
}

export interface DhanHistoricalResponse {
  data: DhanHistoricalSeries;
}

export interface DhanCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  start: string;
  end: string;
}

export interface DhanHistoricalRequest {
  symbol: string;
  securityType: DhanSecurityType;
  exchange: 'NSE' | 'BSE' | 'MCX';
  instrument: DhanInstrumentType;
  fromDate: string;
  toDate: string;
}

export interface DhanFundamentalBasicInfo {
  symbol?: string;
  companyName?: string;
  industry?: string;
  listingDate?: string;
  isin?: string;
  faceValue?: number;
  noOfShares?: number;
}

export interface DhanFundamentalFinancials {
  revenue?: number;
  netProfit?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  bookValue?: number;
  dividendYield?: number;
}

export interface DhanFundamentalRatios {
  pe?: number;
  pb?: number;
  roe?: number;
  roa?: number;
  eps?: number;
  sectorPe?: number;
  peg?: number;
}

export interface DhanFundamentalValuation {
  marketCap?: number;
  enterpriseValue?: number;
  evEbitda?: number;
  dividendYield?: number;
}

export interface DhanFundamental {
  basicInfo: DhanFundamentalBasicInfo;
  financials: DhanFundamentalFinancials;
  ratio: DhanFundamentalRatios;
  valuation: DhanFundamentalValuation;
}

export interface DhanErrorBody {
  errorCode?: number;
  errorDescription?: string;
}

export class DhanApiError extends Error {
  readonly status?: number;
  readonly code?: number;
  readonly context: string;
  readonly retryable: boolean;

  constructor(
    message: string,
    opts: {
      status?: number;
      code?: number;
      context?: string;
      retryable?: boolean;
    } = {},
  ) {
    super(message);
    this.name = 'DhanApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.context = opts.context ?? 'dhan';
    this.retryable = opts.retryable ?? false;
  }
}

export class DhanAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DhanAuthError';
  }
}

export const DHAN_ERROR_CODES = {
  UNAUTHORIZED: 401,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
  INVALID_CLIENT_ID: 700,
  INVALID_ACCESS_TOKEN: 701,
  ACCESS_TOKEN_EXPIRED: 702,
} as const;

export function isAuthFailure(status?: number, code?: number): boolean {
  return (
    status === DHAN_ERROR_CODES.UNAUTHORIZED ||
    code === DHAN_ERROR_CODES.INVALID_CLIENT_ID ||
    code === DHAN_ERROR_CODES.INVALID_ACCESS_TOKEN ||
    code === DHAN_ERROR_CODES.ACCESS_TOKEN_EXPIRED
  );
}
