import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductsModule } from './modules/products/products.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SalesModule } from './modules/sales/sales.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { AdhaModule } from './modules/adha/adha.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { FinancingModule } from './modules/financing/financing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OperationJournalModule } from './modules/operation-journal/operation-journal.module';
import { SettingsUserProfileModule } from './modules/settings-user-profile/settings-user-profile.module';
import { DocumentManagementModule } from './modules/document-management/document-management.module';
import { EntitiesModule } from './modules/shared/entities.module';
import { SharedModule } from './modules/shared/shared.module';
import { EventsModule } from './modules/events/events.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HealthController } from './health.controller';
import { TokenBlacklist } from './modules/auth/entities';

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
    SharedModule,
    EventsModule,
    ProductsModule,
    CustomersModule,
    SalesModule,
    SubscriptionsModule,
    AuthModule,
    CompanyModule,
    SuppliersModule,
    EntitiesModule,
    AdhaModule,
    ExpensesModule,
    FinancingModule,
    NotificationsModule,
    OperationJournalModule,
    SettingsUserProfileModule,
    DocumentManagementModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
