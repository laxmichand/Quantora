import { Injectable, Logger } from '@nestjs/common';
import { AngelAuthError, AngelApiError } from './angel.types';
import { assertAngelConfig, AngelConfig, loadAngelConfig } from './angel.config';
import { generateTotp } from './angel-totp';

interface AngelAuthBody {
  status?: boolean;
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

@Injectable()
export class AngelAuthService {
  private readonly logger = new Logger(AngelAuthService.name);
  private readonly config: AngelConfig;
  private jwtToken: string;
  private feedToken: string;
  private refreshToken: string;

  constructor() {
    this.config = loadAngelConfig();
    assertAngelConfig(this.config);
    this.refreshToken = this.config.refreshToken;
    if (this.config.isTest && !this.config.apiKey) {
      this.logger.warn(
        'Angel One running without ANGEL_API_KEY (test mode). Requests will fail until configured.',
      );
    }
  }

  getConfig(): AngelConfig {
    return this.config;
  }

  getAccessToken(): string {
    if (!this.jwtToken) {
      throw new AngelAuthError(
        'Angel One access token is not available; call ensureAuthenticated() first',
      );
    }
    return this.jwtToken;
  }

  getFeedToken(): string {
    return this.feedToken;
  }

  isRefreshable(): boolean {
    return Boolean(this.refreshToken);
  }

  canLogin(): boolean {
    return Boolean(
      this.config.apiKey &&
      this.config.clientCode &&
      this.config.password &&
      (this.config.totp || this.config.totpSecret),
    );
  }

  async ensureAuthenticated(): Promise<void> {
    if (this.jwtToken) return;
    if (this.isRefreshable()) {
      try {
        await this.refreshAccessToken();
        return;
      } catch (err) {
        this.logger.warn(
          `Angel One token refresh failed, attempting full login: ${(err as Error).message}`,
        );
      }
    }
    if (this.canLogin()) {
      await this.login();
      return;
    }
    throw new AngelAuthError(
      'Angel One is not authenticated: configure ANGEL_REFRESH_TOKEN or ANGEL_PASSWORD + ANGEL_TOTP',
    );
  }

  async login(): Promise<void> {
    if (!this.canLogin()) {
      throw new AngelAuthError(
        'Angel One login requires ANGEL_API_KEY, ANGEL_CLIENT_CODE, ANGEL_PASSWORD and ANGEL_TOTP/ANGEL_TOTP_SECRET',
      );
    }

    const totp =
      this.config.totp ||
      (this.config.totpSecret ? await generateTotp(this.config.totpSecret) : '');

    const url = `${this.config.baseUrl}/rest/auth/angelbrokingUser/v1/login`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          clientcode: this.config.clientCode,
          password: this.config.password,
          totp,
          apikey: this.config.apiKey,
        }),
      });
    } catch (err) {
      throw new AngelApiError(`Angel One login request failed: ${(err as Error).message}`, {
        context: 'login',
        retryable: true,
      });
    }

    const body = (await this.parseJson(res)) as AngelAuthBody | undefined;

    if (!res.ok || body === undefined || body.status === false) {
      throw new AngelApiError(body?.message || `Angel One login failed with status ${res.status}`, {
        status: res.status,
        code: body?.errorcode,
        context: 'login',
        retryable: false,
      });
    }

    const data = body.data;
    if (!data?.jwtToken || !data?.feedToken) {
      throw new AngelApiError('Angel One login response missing jwtToken or feedToken', {
        status: res.status,
        context: 'login',
      });
    }

    this.jwtToken = data.jwtToken;
    this.feedToken = data.feedToken;
    this.refreshToken = data.refreshToken || this.refreshToken;
    this.logger.log('Angel One authenticated');
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.isRefreshable()) {
      throw new AngelAuthError('Angel One refresh token is not configured');
    }

    const url = `${this.config.baseUrl}/rest/auth/angelbrokingUser/v1/refresh-token`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
    } catch (err) {
      throw new AngelApiError(`Angel One token refresh request failed: ${(err as Error).message}`, {
        context: 'token/refresh',
        retryable: true,
      });
    }

    const body = (await this.parseJson(res)) as AngelAuthBody | undefined;

    if (!res.ok || body === undefined || body.status === false) {
      throw new AngelApiError(
        body?.message || `Angel One token refresh failed with status ${res.status}`,
        {
          status: res.status,
          code: body?.errorcode,
          context: 'token/refresh',
          retryable: false,
        },
      );
    }

    const data = body.data;
    if (!data?.jwtToken) {
      throw new AngelApiError('Angel One token refresh response missing jwtToken', {
        status: res.status,
        context: 'token/refresh',
      });
    }

    this.jwtToken = data.jwtToken;
    if (data.refreshToken) this.refreshToken = data.refreshToken;
    this.logger.log('Angel One access token refreshed');
    return this.jwtToken;
  }

  private async parseJson(res: Response): Promise<unknown> {
    try {
      return await res.json();
    } catch {
      return undefined;
    }
  }
}
