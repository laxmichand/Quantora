import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class ThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(ThrottlerGuard.name);
  private readonly windowMs: number;
  private readonly max: number;
  private readonly store = new Map<string, { count: number; resetAt: number }>();

  constructor(private reflector: Reflector) {
    this.windowMs = parseInt(process.env.THROTTLE_WINDOW_MS || '60000', 10);
    this.max = parseInt(process.env.THROTTLE_MAX || '60', 10);

    setInterval(() => this.cleanup(), this.windowMs);
  }

  private readonly alwaysThrottledPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/google',
  ];

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const path = request.url?.split('?')[0] || '';

    if (isPublic && !this.alwaysThrottledPaths.some((p) => path.startsWith(p))) {
      return true;
    }

    const key = this.getClientKey(request);
    const now = Date.now();

    const record = this.store.get(key);

    if (!record || now > record.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (record.count >= this.max) {
      this.logger.warn(`Rate limit exceeded for ${key}`);
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    record.count++;
    return true;
  }

  private getClientKey(request: any): string {
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key);
      }
    }
  }
}
