import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - startTime;
          const contentLength = response.get('content-length');

          this.logger.log(
            `${method} ${originalUrl} ${response.statusCode} ${contentLength} - ${delay}ms - ${userAgent} ${ip}`,
          );
        },
        error: (error) => {
          const delay = Date.now() - startTime;
          this.logger.error(
            `${method} ${originalUrl} ${error.status} - ${delay}ms - ${userAgent} ${ip}`,
            error.stack,
          );
        },
      }),
    );
  }
}