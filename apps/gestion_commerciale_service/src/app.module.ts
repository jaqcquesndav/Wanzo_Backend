import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Modules existants
import { ProductsModule } from './modules/inventory/products.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SalesModule } from './modules/sales/sales.module';
// import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module'; // Temporairement désactivé
import { AuthModule as ExistingAuthModule } from './modules/auth/auth.module';
// import { CompanyModule } from './modules/company/company.module'; // Temporairement désactivé
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { AdhaModule } from './modules/adha/adha.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { FinancingModule } from './modules/financing/financing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OperationJournalModule } from './modules/operations/operation-journal.module';
import { SettingsUserProfileModule } from './modules/settings-user-profile/settings-user-profile.module';
import { SettingsModule } from './modules/settings/settings.module';
import { DocumentManagementModule } from './modules/documents/document-management.module';
import { EntitiesModule } from './modules/shared/entities.module';
import { SharedModule } from './modules/shared/shared.module';
import { EventsModule } from './modules/events/events.module';

// Nouveau module d'authentification avec intégration à la plateforme
import { AuthModule } from './auth/auth.module';
import { FinancialTransactionsModule } from './modules/financial-transactions/financial-transactions.module';

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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', 'postgres_password'),
        database: configService.get<string>('DATABASE_NAME', 'wanzo_gestion_commerciale_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV', 'development') === 'development',
        logging: configService.get<string>('NODE_ENV', 'development') === 'development',
        autoLoadEntities: true,
        entitySkipConstructor: true,
        connectTimeoutMS: 10000,
        retryAttempts: 20,
        retryDelay: 3000,
        maxQueryExecutionTime: 10000
      }),
      inject: [ConfigService],
    }),
    // Modules d'intégration avec la plateforme
    AuthModule, // Nouveau module d'authentification avec la plateforme
    
    // Modules existants
    SharedModule,
    EventsModule,
    ProductsModule,
    CustomersModule,
    SalesModule,
    FinancialTransactionsModule,  // Module pour les transactions financières
    // SubscriptionsModule,       // Temporairement désactivé - à réintégrer après adaptation
    ExistingAuthModule,           // Ancien module d'auth renommé en import
    // CompanyModule,             // Temporairement désactivé - à réintégrer après adaptation
    SuppliersModule,
    EntitiesModule,
    AdhaModule,
    ExpensesModule,
    FinancingModule,
    NotificationsModule,
    OperationJournalModule,
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
    consumer
      .apply(AuditMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'metrics', method: RequestMethod.GET }
      )
      .forRoutes('*'); // Appliquer à toutes les routes
  }
}
