import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PreferencesService {
  private readonly logger = new Logger(PreferencesService.name);

  constructor(private prisma: PrismaService) {}

  async get(userId: string) {
    let prefs = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.userPreference.create({
        data: { userId },
      });
      this.logger.log(`Created default preferences for user ${userId}`);
    }

    return prefs;
  }

  async update(userId: string, dto: Record<string, any>) {
    const existing = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException('Preferences not found');
    }

    const allowed = [
      'language',
      'theme',
      'dateFormat',
      'numberFormat',
      'timezone',
      'notificationsEmail',
      'notificationsPush',
      'notificationsSms',
      'notifyPriceAlerts',
      'notifyPortfolio',
      'notifyNews',
      'notifyAiInsights',
      'defaultExchange',
      'riskTolerance',
      'investmentStyle',
      'sidebarCollapsed',
      'defaultView',
    ];

    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (dto[key] !== undefined) {
        data[key] = dto[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    const updated = await this.prisma.userPreference.update({
      where: { userId },
      data,
    });

    this.logger.log(`Preferences updated for user ${userId}`);
    return updated;
  }
}
