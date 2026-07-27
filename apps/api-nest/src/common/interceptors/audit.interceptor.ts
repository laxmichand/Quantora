import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, user } = request;
    const userAgent = request.get('user-agent') || '';
    const userId = user?.sub || null;
    const start = Date.now();

    return next.handle().pipe(
      tap(async () => {
        const duration = Date.now() - start;

        try {
          await this.prisma.auditLog.create({
            data: {
              userId,
              action: method,
              entity: this.extractEntity(url),
              entityId: this.extractEntityId(url),
              ipAddress: ip,
              userAgent,
              details: { duration, url },
            },
          });
        } catch (err) {
          this.logger.error(`Audit log failed: ${err.message}`);
        }
      }),
    );
  }

  private extractEntity(url: string): string {
    const parts = url.split('/').filter(Boolean);
    if (parts.length >= 2) return parts[1];
    return 'unknown';
  }

  private extractEntityId(url: string): string | null {
    const parts = url.split('/').filter(Boolean);
    if (parts.length >= 3 && parts[2] !== 'undefined') return parts[2];
    return null;
  }
}
