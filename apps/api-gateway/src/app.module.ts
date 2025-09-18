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
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MonitoringModule } from './monitoring/monitoring.module';

// -- Filtres, intercepteurs --
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';

// -- Prometheus Service --
import { PrometheusService } from './modules/proxy/services/prometheus.service';

@Module({
  imports: [
    // 1) Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2) Throttler => Limiter les requêtes - RESTORED
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

    // 3) Modules métier - RESTORED with ProxyModule last (CONFIRMED: catch-all doesn't interfere with /health)
    HealthModule,
    AnalyticsModule,
    MonitoringModule,
    ProxyModule, // Keep last because of catch-all @All('*') - but confirmed it doesn't affect /health
  ],

  // 4) PAS DE CONTROLLERS ICI - ils sont dans leurs modules respectifs (TestHealthController removed)
  controllers: [],

  // 5) PROVIDERS : PrometheusService + interceptors, filters, guards - RESTORED  
  providers: [
    PrometheusService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: TransformInterceptor,
    // },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: TimeoutInterceptor,
    // },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
