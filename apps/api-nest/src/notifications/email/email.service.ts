import { Injectable, Logger } from '@nestjs/common';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isProduction = process.env['NODE_ENV'] === 'production';

  async send(options: EmailOptions): Promise<void> {
    if (!this.isProduction) {
      this.logger.log(`[EMAIL] To: ${options.to}, Subject: ${options.subject}`);
      this.logger.log(`[EMAIL] Body: ${options.html}`);
      return;
    }

    this.logger.warn('Email transport not configured — notification skipped');
  }
}
