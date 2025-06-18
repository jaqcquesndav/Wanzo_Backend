import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'; // Removed APP_PIPE

// --- Import des modules métier ---
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompanyModule } from './modules/company/company.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { SettingsModule } from './modules/settings/settings.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ChatModule } from './modules/chat/chat.module';
import { FinanceModule } from './modules/finance/finance.module';
import { SystemModule } from './modules/system/system.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { KafkaModule } from './modules/kafka/kafka.module'; // Added KafkaModule import

// --- Import du module de monitoring ---
import { MonitoringModule } from './monitoring/monitoring.module'; // Corrected path

// --- Controllers ---
import { HealthController } from './health.controller';

// --- Middlewares, interceptors, filters, pipes ---
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { PrometheusMiddleware } from './monitoring/prometheus.middleware';
import { DatabaseCheckService } from './database-check.service';
// Removed import for ValidationPipe as it's handled in main.ts

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),        database: configService.get('DB_DATABASE', 'admin-service'), // Changed default to 'admin-service'
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Disable auto-synchronization to avoid issues with enums
        migrationsRun: false, // Don't run migrations automatically
      }),
      inject: [ConfigService],
    }),
    MonitoringModule, // Corrected module name
    AuthModule,
    UsersModule,
    CompanyModule,
    CustomersModule,
    ChatModule,
    DocumentsModule,
    FinanceModule,
    SettingsModule,
    SystemModule,    TokensModule,
    DashboardModule,
    KafkaModule, // Added KafkaModule
  ],  controllers: [HealthController],
  providers: [
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
    DatabaseCheckService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, PrometheusMiddleware)
      .forRoutes('*');
  }
}
