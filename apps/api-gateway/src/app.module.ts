import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import {
  ThrottlerModule,
  ThrottlerGuard,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';

// -- Tes modules locaux --
import { ProxyModule } from './modules/proxy/proxy.module';
import { HealthModule } from './modules/health/health.module';

// -- Filtres, intercepteurs --
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';

// -- Prometheus --
import { PrometheusController } from './monitoring/prometheus.controller';
import { PrometheusService } from './modules/proxy/services/prometheus.service';

@Module({
  imports: [
    // 1) Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2) Throttler => Limiter les requêtes
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    // 3) Tes modules métier
    ProxyModule,
    HealthModule,
  ],

  // 4) CONTROLLERS : on déclare PrometheusController ici
  controllers: [PrometheusController],

  // 5) PROVIDERS : on déclare PrometheusService + interceptors, filters, guards
  providers: [
    PrometheusService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
