import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const now = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - now;
        this.logger.debug(`${request.method} ${request.url} - ${duration}ms`);

        // Wrap response in standard envelope
        if (data && typeof data === 'object' && !data.statusCode) {
          // Don't double-wrap if already wrapped
        }
      }),
    );
  }
}
