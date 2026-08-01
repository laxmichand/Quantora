export interface DhanConfig {
  clientId: string;
  accessToken: string;
  refreshToken?: string;
  clientSecret?: string;
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  isTest: boolean;
}

export const DHAN_DEFAULTS = {
  baseUrl: 'https://api.dhanhq.co/v2',
  timeoutMs: 15000,
  maxRetries: 3,
  retryBaseDelayMs: 250,
} as const;

export function loadDhanConfig(env: NodeJS.ProcessEnv = process.env): DhanConfig {
  return {
    clientId: env.DHAN_CLIENT_ID?.trim() ?? '',
    accessToken: env.DHAN_ACCESS_TOKEN?.trim() ?? '',
    refreshToken: env.DHAN_REFRESH_TOKEN?.trim() || undefined,
    clientSecret: env.DHAN_CLIENT_SECRET?.trim() || undefined,
    baseUrl: env.DHAN_BASE_URL?.trim() || DHAN_DEFAULTS.baseUrl,
    timeoutMs: toPositiveInt(env.DHAN_TIMEOUT_MS, DHAN_DEFAULTS.timeoutMs),
    maxRetries: toNonNegativeInt(env.DHAN_MAX_RETRIES, DHAN_DEFAULTS.maxRetries),
    retryBaseDelayMs: toNonNegativeInt(
      env.DHAN_RETRY_BASE_DELAY_MS,
      DHAN_DEFAULTS.retryBaseDelayMs,
    ),
    isTest: env.NODE_ENV === 'test',
  };
}

export function validateDhanConfig(config: DhanConfig): string[] {
  const missing: string[] = [];
  if (!config.clientId) missing.push('DHAN_CLIENT_ID');
  if (!config.accessToken) missing.push('DHAN_ACCESS_TOKEN');
  return missing;
}

export function assertDhanConfig(config: DhanConfig): void {
  const missing = validateDhanConfig(config);
  if (missing.length === 0) return;
  if (config.isTest) return;
  throw new Error(`DhanHQ config missing required env vars: ${missing.join(', ')}`);
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toNonNegativeInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
