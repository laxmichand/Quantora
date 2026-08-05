import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email/email.service';

export interface NewDeviceAlertPayload {
  userId: string;
  userEmail: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ip: string;
  location: string;
  time: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async sendNewDeviceAlert(payload: NewDeviceAlertPayload): Promise<void> {
    const subject = 'New Device Login Detected';

    const deviceName = payload.deviceName || payload.deviceType || 'Unknown';
    const html = `
      <h2>New Device Login</h2>
      <p>Hello,</p>
      <p>A new device was used to log into your account:</p>
      <ul>
        <li><strong>Device:</strong> ${deviceName}</li>
        <li><strong>Browser:</strong> ${payload.browser || 'Unknown'}</li>
        <li><strong>OS:</strong> ${payload.os || 'Unknown'}</li>
        <li><strong>IP:</strong> ${payload.ip}</li>
        <li><strong>Location:</strong> ${payload.location || 'Unknown'}</li>
        <li><strong>Time:</strong> ${payload.time.toLocaleString()}</li>
      </ul>
      <p>If this was not you, secure your account immediately.</p>
    `;

    const notification = await this.prisma.notification.create({
      data: {
        userId: payload.userId,
        type: 'new_device_login',
        channel: 'email',
        title: subject,
        message: `New device login from ${deviceName} (${payload.ip})`,
        metadata: { ...payload, time: payload.time.toISOString() },
        status: 'pending',
      },
    });

    try {
      await this.emailService.send({ to: payload.userEmail, subject, html });
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'sent', sentAt: new Date() },
      });
    } catch (err) {
      this.logger.error(`Failed to send email notification: ${err}`);
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'failed' },
      });
    }
  }
}
