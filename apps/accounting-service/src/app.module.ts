import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

// Import du module de contrôle d'accès aux fonctionnalités
import { FeatureAccessModule } from '../../../packages/shared/src/feature-access.module';

// Import de tous tes modules métier
import { AuthModule } from './modules/auth/auth.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { JournalsModule } from './modules/journals/journals.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ChatModule } from './modules/chat/chat.module';
import { CreditScoreModule } from './modules/credit-score/credit-score.module';
import { HealthModule } from './modules/health/health.module';
import { FiscalYearsModule } from './modules/fiscal-years/fiscal-years.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { SyncModule } from './modules/sync/sync.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditModule } from './modules/audit/audit.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { EventsModule } from './modules/events/events.module'; // Import the new EventsModule
import { LedgerModule } from './modules/ledger/ledger.module'; // Import LedgerModule
import { NotificationModule } from './modules/notifications/notifications.module'; // Import NotificationModule
import { UserModule } from './modules/users/users.module'; // Import UserModule
import { DeclarationModule } from './modules/declarations/declarations.module'; // Import DeclarationModule
import { DashboardModule } from './modules/dashboard/dashboard.module'; // Import DashboardModule

// Import du MonitoringModule qui contient PrometheusController
import { MonitoringModule } from './monitoring/monitoring.module';

// Middlewares et autres éléments globaux
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';

@Module({
  imports: [
    // 1) Chargement de la config
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // 2) Configuration du module de contrôle d'accès aux fonctionnalités
    FeatureAccessModule.forRoot({
      kafkaBrokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      kafkaClientId: 'accounting-service',
      kafkaGroupId: 'accounting-service-feature-access-group'
    }),
    // 3) Connexion à la base de données Postgres
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_DATABASE', 'accounting'),
        autoLoadEntities: true,
        synchronize: true, // Force synchronize to true to create tables
        logging: true,     // Enable logging for debugging
      }),
      inject: [ConfigService],
    }),    // 4) Import de tous tes modules métier
    AuthModule,
    AccountsModule,
    JournalsModule,
    ReportsModule,
    ChatModule,
    CreditScoreModule,
    HealthModule,    
    FiscalYearsModule,
    OrganizationModule,
    SyncModule,
    SettingsModule,
    AuditModule,
    KafkaModule,
    EventsModule, // Add EventsModule to imports
    LedgerModule, // Add LedgerModule to imports
    NotificationModule, // Add NotificationModule to imports
    UserModule, // Add UserModule to imports
    DeclarationModule, // Add DeclarationModule to imports
    DashboardModule, // Add DashboardModule to imports

    // 4) Import du module qui gère Prometheus
    MonitoringModule,
  ],
  // 5) Fournisseurs globaux : filtres, interceptors, pipes...
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
    // TEMPORARY: Disable all middleware for debugging
    // consumer
    //   .apply(LoggerMiddleware, RateLimitMiddleware)
    //   .forRoutes('*');
  }
}
