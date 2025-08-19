import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly TTL = 60 * 1000; // 1 minute

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.switchToHttp().getRequest().method !== 'GET') {
      return next.handle();
    }

    const key = this.trackBy(context);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return of(cached.data);
    }

    return next.handle().pipe(
      tap(data => {
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
        });
      }),
    );
  }

  private trackBy(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    return `${request.url}:${JSON.stringify(request.query)}`;
  }
}
