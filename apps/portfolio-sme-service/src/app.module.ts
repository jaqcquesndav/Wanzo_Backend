import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { OperationsModule } from './modules/operations/operations.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './modules/health/health.module';
import { DataSharingModule } from './modules/data-sharing/data-sharing.module';

// ✨ Import de ton MonitoringModule (celui avec PrometheusController)
import { MonitoringModule } from './monitoring/monitoring.module';

// Middlewares et autres composants globaux
import { AuthMiddleware } from './modules/auth/middleware/auth.middleware';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';

@Module({
  imports: [
    // 1) Configuration globale
    ConfigModule.forRoot({ isGlobal: true }),

    // 2) Connexion DB
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_DATABASE', 'portfolio_sme'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
    }),

    // 3) Modules métier
    AuthModule,
    OperationsModule,
    PortfoliosModule,
    AssetsModule,
    AccountingModule,
    ReportsModule,
    HealthModule,
    DataSharingModule,

    // ✨ 4) Ajout du MonitoringModule ici
    MonitoringModule,
  ],
  providers: [
    // Filtrage global
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    // Intercepteurs globaux
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    // Pipe global
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, RateLimitMiddleware, AuthMiddleware)
      .exclude('health(.*)') // exclure health de ces middlewares
      .forRoutes('*');
  }
}
