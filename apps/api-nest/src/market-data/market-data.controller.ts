import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AngelRestClient } from './providers/angel/angel-rest.client';
import {
  AngelCandle,
  AngelExchange,
  AngelInstrument,
  AngelInterval,
  AngelQuote,
} from './providers/angel/angel.types';

const CACHE_TTL_MS = 60_000;
const DEFAULT_INTERVAL: AngelInterval = 'ONE_DAY';
const DEFAULT_CANDLE_DAYS = 30;

interface ResolvedSymbol {
  exchange: string;
  token: string;
  instrument: AngelInstrument;
}

@Controller('market')
@Public()
export class MarketDataController {
  private cachedInstruments: AngelInstrument[] | null = null;
  private cacheTime = 0;

  constructor(private readonly angel: AngelRestClient) {}

  @Get('instruments')
  async instruments(
    @Query('exchange') exchange?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): Promise<{ total: number; instruments: AngelInstrument[] }> {
    const all = await this.getInstruments();

    let rows = all;
    if (exchange) {
      const wanted = exchange.toUpperCase();
      rows = rows.filter((i) => i.exch_seg.toUpperCase() === wanted);
    }
    if (search) {
      const q = search.toUpperCase();
      rows = rows.filter((i) => `${i.symbol} ${i.name}`.toUpperCase().includes(q));
    }

    const parsedLimit = Number.parseInt(limit ?? '50', 10);
    const max = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 500) : 50;
    return { total: rows.length, instruments: rows.slice(0, max) };
  }

  @Get('instruments/:symbol')
  async bySymbol(
    @Param('symbol') symbol: string,
  ): Promise<{ found: boolean; symbol: string; instrument?: AngelInstrument }> {
    const all = await this.getInstruments();
    const wanted = symbol.toUpperCase();
    const instrument = all.find((i) => i.symbol.toUpperCase() === wanted);
    if (!instrument) return { found: false, symbol: wanted };
    return { found: true, symbol: wanted, instrument };
  }

  @Get('quotes')
  async quotes(
    @Query('symbols') symbols?: string,
  ): Promise<{ found: boolean; symbols: string[]; quotes: Record<string, AngelQuote> }> {
    const wanted = (symbols ?? '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (wanted.length === 0) return { found: false, symbols: [], quotes: {} };

    const all = await this.getInstruments();
    const bySymbol = new Map<string, ResolvedSymbol>();
    for (const instrument of all) {
      const key = instrument.symbol.toUpperCase();
      if (!bySymbol.has(key)) {
        bySymbol.set(key, this.toResolvedSymbol(instrument));
      }
    }

    const resolved = wanted.filter((s) => bySymbol.has(s));
    const quotes = resolved.length
      ? await this.angel.getQuotes(
          resolved.map((s) => {
            const r = bySymbol.get(s)!;
            return { exchange: r.exchange, symbolToken: r.token };
          }),
        )
      : {};
    return { found: resolved.length > 0, symbols: resolved, quotes };
  }

  @Get('quotes/:symbol')
  async quote(
    @Param('symbol') symbol: string,
  ): Promise<{ found: boolean; symbol: string; quote?: AngelQuote; instrument?: AngelInstrument }> {
    const wanted = symbol.toUpperCase();
    const resolved = await this.resolveSymbol(wanted);
    if (!resolved) return { found: false, symbol: wanted };
    const quote = await this.angel.getQuote(resolved.exchange, resolved.token);
    return { found: true, symbol: wanted, quote, instrument: resolved.instrument };
  }

  @Get('candles/:symbol')
  async candles(
    @Param('symbol') symbol: string,
    @Query('interval') interval?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<{
    found: boolean;
    symbol: string;
    interval: AngelInterval;
    candles: AngelCandle[];
    instrument?: AngelInstrument;
  }> {
    const wanted = symbol.toUpperCase();
    const resolved = await this.resolveSymbol(wanted);
    if (!resolved) return { found: false, symbol: wanted, interval: DEFAULT_INTERVAL, candles: [] };

    const parsedInterval = this.parseInterval(interval);
    const exchange = this.toAngelExchange(resolved.instrument.exch_seg);
    if (!exchange) {
      return {
        found: false,
        symbol: wanted,
        interval: parsedInterval,
        candles: [],
        instrument: resolved.instrument,
      };
    }
    const end = toDate ?? new Date().toISOString().slice(0, 10);
    const start =
      fromDate ??
      new Date(Date.now() - DEFAULT_CANDLE_DAYS * 86_400_000).toISOString().slice(0, 10);

    const candles = await this.angel.getHistoricalCandles({
      exchange,
      symbolToken: resolved.token,
      interval: parsedInterval,
      fromDate: start,
      toDate: end,
    });
    return {
      found: true,
      symbol: wanted,
      interval: parsedInterval,
      candles,
      instrument: resolved.instrument,
    };
  }

  private toResolvedSymbol(instrument: AngelInstrument): ResolvedSymbol {
    return {
      exchange: instrument.exch_seg.toUpperCase(),
      token: instrument.token,
      instrument,
    };
  }

  private async resolveSymbol(symbol: string): Promise<ResolvedSymbol | undefined> {
    const all = await this.getInstruments();
    const wanted = symbol.toUpperCase();
    const instrument = all.find((i) => i.symbol.toUpperCase() === wanted);
    if (!instrument) return undefined;
    return this.toResolvedSymbol(instrument);
  }

  private parseInterval(value?: string): AngelInterval {
    const allowed: AngelInterval[] = [
      'ONE_MINUTE',
      'THREE_MINUTE',
      'FIVE_MINUTE',
      'TEN_MINUTE',
      'FIFTEEN_MINUTE',
      'THIRTY_MINUTE',
      'ONE_HOUR',
      'ONE_DAY',
    ];
    const candidate = (value ?? '').toUpperCase();
    return (
      allowed.includes(candidate as AngelInterval) ? candidate : DEFAULT_INTERVAL
    ) as AngelInterval;
  }

  private toAngelExchange(value: string): AngelExchange | undefined {
    const exchanges: AngelExchange[] = ['NSE', 'BSE', 'NFO', 'BFO', 'MCX', 'CDS'];
    const candidate = value.toUpperCase();
    return exchanges.includes(candidate as AngelExchange)
      ? (candidate as AngelExchange)
      : undefined;
  }

  private async getInstruments(): Promise<AngelInstrument[]> {
    if (this.cachedInstruments && Date.now() - this.cacheTime < CACHE_TTL_MS) {
      return this.cachedInstruments;
    }
    const data = await this.angel.getInstruments();
    this.cachedInstruments = data;
    this.cacheTime = Date.now();
    return data;
  }
}
