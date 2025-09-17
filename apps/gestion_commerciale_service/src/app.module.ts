import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrometheusMiddleware } from './monitoring/prometheus.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Modules existants
import { ProductsModule } from './modules/inventory/products.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SalesModule } from './modules/sales/sales.module';
// Souscriptions gérées exclusivement par customer-service
import { AuthModule as ExistingAuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module'; // Activé maintenant
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { AdhaModule } from './modules/adha/adha.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { FinancingModule } from './modules/financing/financing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BusinessOperationsModule } from './modules/operations/business-operations.module';
import { SettingsUserProfileModule } from './modules/settings-user-profile/settings-user-profile.module';
import { SettingsModule } from './modules/settings/settings.module';
import { DocumentManagementModule } from './modules/documents/document-management.module';
import { EntitiesModule } from './modules/shared/entities.module';
import { SharedModule } from './modules/shared/shared.module';
import { EventsModule } from './modules/events/events.module';
import { MonitoringModule } from './monitoring/monitoring.module';

// Nouveau module d'authentification avec intégration à la plateforme
import { AuthModule } from './auth/auth.module';
import { FinancialTransactionsModule } from './modules/financial-transactions/financial-transactions.module';
import { CommonModule } from './common/common.module';

// Gardes, intercepteurs et middleware pour l'intégration avec la plateforme
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { FeatureGuard } from './common/guards/feature.guard';
import { CompanyGuard } from './common/guards/company.guard';
import { BusinessContextInterceptor } from './common/interceptors/business-context.interceptor';
import { AuditMiddleware } from './common/middleware/audit.middleware';

// Existants
import { JwtAuthGuard as ExistingJwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HealthController } from './health.controller';
import { TokenBlacklist } from './modules/auth/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config = {
          type: 'postgres' as const,
          host: configService.get<string>('DATABASE_HOST', 'localhost'),
          port: configService.get<number>('DATABASE_PORT', 5432),
          username: configService.get<string>('DATABASE_USER', 'postgres'),
          password: configService.get<string>('DATABASE_PASSWORD', 'Root12345'),
          database: configService.get<string>('DATABASE_NAME', 'gestion_commerciale_service'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true, // Force synchronize to true to create tables
          logging: true,     // Enable logging for debugging
          autoLoadEntities: true,
          entitySkipConstructor: true,
          connectTimeoutMS: 10000,
          retryAttempts: 20,
        };
        console.log('Database configuration:', {
          host: config.host,
          port: config.port,
          username: config.username,
          database: config.database,
          password: config.password ? '[REDACTED]' : 'EMPTY'
        });
        return config;
      },
      inject: [ConfigService],
    }),
    // Modules d'intégration avec la plateforme
    AuthModule, // Nouveau module d'authentification avec la plateforme
    MonitoringModule, // Module de monitoring Prometheus
    CommonModule, // Module pour les services communs (SubscriptionService, etc.)
    
    // Modules existants
    SharedModule,
    EventsModule,
    ProductsModule,
    CustomersModule,
    SalesModule,
    FinancialTransactionsModule,  // Module pour les transactions financières
    // SubscriptionsModule,       // Temporairement désactivé - à réintégrer après adaptation
    ExistingAuthModule,           // Ancien module d'auth renommé en import
    CompanyModule,                // Activé maintenant pour les dépendances AuthService
    SuppliersModule,
    EntitiesModule,
    AdhaModule,
    ExpensesModule,
    FinancingModule,
    NotificationsModule,
    BusinessOperationsModule,
    SettingsUserProfileModule,
    SettingsModule,
    DocumentManagementModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    // Gardes globaux pour l'intégration avec la plateforme
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Garde JWT nouvelle version pour l'intégration plateforme
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Vérifie les rôles utilisateur
    },
    {
      provide: APP_GUARD,
      useClass: FeatureGuard, // Vérifie les fonctionnalités disponibles via l'abonnement
    },
    {
      provide: APP_GUARD,
      useClass: CompanyGuard, // Vérifie que l'utilisateur a accès à l'entreprise
    },
    // Intercepteur pour le contexte commercial
    {
      provide: APP_INTERCEPTOR,
      useClass: BusinessContextInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  // Configuration des middlewares
  configure(consumer: MiddlewareConsumer) {
    // Middleware d'audit pour toutes les routes sauf health et metrics
    consumer
      .apply(AuditMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'metrics', method: RequestMethod.GET }
      )
      .forRoutes('*'); // Appliquer à toutes les routes
    
    // Middleware Prometheus pour mesurer les temps de réponse des requêtes HTTP
    consumer
      .apply(PrometheusMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'metrics', method: RequestMethod.GET }
      )
      .forRoutes('*');
  }
}
