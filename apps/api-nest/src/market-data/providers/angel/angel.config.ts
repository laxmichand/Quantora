export interface AngelConfig {
  apiKey: string;
  clientCode: string;
  password: string;
  totp: string;
  totpSecret: string;
  refreshToken: string;
  baseUrl: string;
  scripMasterUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  isTest: boolean;
}

export const ANGEL_DEFAULTS = {
  baseUrl: 'https://apiconnect.angelone.in',
  scripMasterUrl:
    'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json',
  timeoutMs: 15000,
  maxRetries: 3,
  retryBaseDelayMs: 250,
} as const;

export function loadAngelConfig(env: NodeJS.ProcessEnv = process.env): AngelConfig {
  return {
    apiKey: env.ANGEL_API_KEY?.trim() ?? '',
    clientCode: env.ANGEL_CLIENT_CODE?.trim() ?? '',
    password: env.ANGEL_PASSWORD ?? '',
    totp: env.ANGEL_TOTP?.trim() ?? '',
    totpSecret: env.ANGEL_TOTP_SECRET?.trim() ?? '',
    refreshToken: env.ANGEL_REFRESH_TOKEN?.trim() ?? '',
    baseUrl: env.ANGEL_BASE_URL?.trim() || ANGEL_DEFAULTS.baseUrl,
    scripMasterUrl: env.ANGEL_SCRIP_MASTER_URL?.trim() || ANGEL_DEFAULTS.scripMasterUrl,
    timeoutMs: toPositiveInt(env.ANGEL_TIMEOUT_MS, ANGEL_DEFAULTS.timeoutMs),
    maxRetries: toNonNegativeInt(env.ANGEL_MAX_RETRIES, ANGEL_DEFAULTS.maxRetries),
    retryBaseDelayMs: toNonNegativeInt(
      env.ANGEL_RETRY_BASE_DELAY_MS,
      ANGEL_DEFAULTS.retryBaseDelayMs,
    ),
    isTest: env.NODE_ENV === 'test',
  };
}

export function validateAngelConfig(config: AngelConfig): string[] {
  const missing: string[] = [];
  if (!config.apiKey) missing.push('ANGEL_API_KEY');
  if (!config.clientCode) missing.push('ANGEL_CLIENT_CODE');
  if (!config.refreshToken && (!config.password || (!config.totp && !config.totpSecret))) {
    missing.push(
      'ANGEL_REFRESH_TOKEN (or ANGEL_PASSWORD + ANGEL_TOTP/ANGEL_TOTP_SECRET for initial login)',
    );
  }
  return missing;
}

export function assertAngelConfig(config: AngelConfig): void {
  const missing = validateAngelConfig(config);
  if (missing.length === 0) return;
  if (config.isTest) return;
  throw new Error(`Angel One config missing required env vars: ${missing.join(', ')}`);
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toNonNegativeInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
