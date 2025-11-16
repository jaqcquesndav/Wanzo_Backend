import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuthModule } from './modules/auth/auth.module';
import { InstitutionModule } from './modules/institution/institution.module';
import { ProspectionModule } from './modules/prospection/prospection.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HealthModule } from './modules/health/health.module';
import { EventsConsumerModule } from './modules/events/events-consumer.module';
import { VirementsModule } from './modules/virements/virements.module';
import { ChatModule } from './modules/chat/chat.module';
import { PaymentOrderModule } from './modules/payment-orders/payment-orders.module';
import { UsersModule } from './modules/users/users.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CompanyProfileModule } from './modules/company-profile/company-profile.module';

// Security Module
import { SecurityModule } from '@wanzobe/shared';

// <-- On importe le MonitoringModule (avec ton PrometheusController)
import { MonitoringModule } from './monitoring/monitoring.module';

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
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Event Emitter for real-time events
    EventEmitterModule.forRoot(),    // 2) Connexion TypeORM asynchrone
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_DATABASE', 'portfolio-institution-service'),
        autoLoadEntities: true,
        synchronize: true, // Force synchronize to true to create tables
        logging: true,     // Enable logging for debugging
      }),
      inject: [ConfigService],
    }),

    // Security Module (Global)
    SecurityModule,

    // 3) Tes modules métier
    AuthModule,
    InstitutionModule,
    ProspectionModule,
    PortfoliosModule,
    VirementsModule, // Added
    PaymentOrderModule, // Added for generic payment orders
    NotificationsModule,
    SettingsModule,
    DashboardModule, // Added Dashboard module
    HealthModule,
    EventsConsumerModule, // Added
    ChatModule, // Added for Adha AI integration
    UsersModule, // Added Users module
    CompanyProfileModule, // Added Company Profile module for hybrid data sync

    // 4) Ajout du MonitoringModule pour /metrics
    MonitoringModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
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
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, RateLimitMiddleware)
      .forRoutes('*');
  }
}

