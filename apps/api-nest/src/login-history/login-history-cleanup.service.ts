import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class LoginHistoryCleanupService {
  private readonly logger = new Logger(LoginHistoryCleanupService.name);

  constructor(private readonly authService: AuthService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'login-history-cleanup' })
  async handleLoginHistoryCleanup(): Promise<void> {
    try {
      const { deleted } = await this.authService.cleanupLoginHistory();
      this.logger.log(`Login history cleanup finished, deleted ${deleted} records`);
    } catch (err) {
      this.logger.error(`Login history cleanup failed: ${(err as Error).message}`);
    }
  }
}
