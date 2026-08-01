import { Injectable, Logger } from '@nestjs/common';
import { DhanAuthError, DhanApiError, DhanErrorBody } from './dhan.types';
import { assertDhanConfig, DhanConfig, loadDhanConfig } from './dhan.config';

@Injectable()
export class DhanAuthService {
  private readonly logger = new Logger(DhanAuthService.name);
  private readonly config: DhanConfig;
  private accessToken: string;

  constructor() {
    this.config = loadDhanConfig();
    assertDhanConfig(this.config);
    this.accessToken = this.config.accessToken;
    if (!this.config.clientId) {
      this.logger.warn(
        'DhanHQ running without DHAN_CLIENT_ID (test mode). Requests will fail until configured.',
      );
    }
  }

  getConfig(): DhanConfig {
    return this.config;
  }

  getAccessToken(): string {
    if (!this.accessToken) {
      throw new DhanAuthError('DhanHQ access token is not configured');
    }
    return this.accessToken;
  }

  isRefreshable(): boolean {
    return Boolean(this.config.refreshToken);
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.isRefreshable()) {
      throw new DhanAuthError('DhanHQ refresh token is not configured');
    }

    const url = `${this.config.baseUrl}/token/refresh`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'client-id': this.config.clientId,
        },
        body: JSON.stringify({ refreshToken: this.config.refreshToken }),
      });
    } catch (err) {
      throw new DhanApiError(`DhanHQ token refresh request failed: ${(err as Error).message}`, {
        context: 'token/refresh',
        retryable: true,
      });
    }

    const body = (await this.parseJson(res)) as { accessToken?: string } | undefined;

    if (!res.ok) {
      const code = (body as DhanErrorBody)?.errorCode;
      throw new DhanApiError(`DhanHQ token refresh failed with status ${res.status}`, {
        status: res.status,
        code,
        context: 'token/refresh',
        retryable: false,
      });
    }

    if (!body?.accessToken) {
      throw new DhanApiError('DhanHQ token refresh response missing accessToken', {
        status: res.status,
        context: 'token/refresh',
      });
    }

    this.accessToken = body.accessToken;
    this.logger.log('DhanHQ access token refreshed');
    return this.accessToken;
  }

  private async parseJson(res: Response): Promise<unknown> {
    try {
      return await res.json();
    } catch {
      return undefined;
    }
  }
}
