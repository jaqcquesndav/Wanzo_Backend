import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module'; // Added import
import { SalesModule } from './sales/sales.module'; // Import SalesModule
import { SubscriptionsModule } from './subscriptions/subscriptions.module'; // Import SubscriptionsModule
import { AuthModule } from './auth/auth.module'; // Import AuthModule
import { CompanyModule } from './company/company.module'; // Import CompanyModule
import { SuppliersModule } from './suppliers/suppliers.module'; // Import SuppliersModule
import { AdhaModule } from './adha/adha.module'; // Import AdhaModule
import { ExpensesModule } from './expenses/expenses.module'; // Import ExpensesModule
import { FinancingModule } from './financing/financing.module'; // Import FinancingModule
import { NotificationsModule } from './notifications/notifications.module'; // Import NotificationsModule
import { OperationJournalModule } from './operation-journal/operation-journal.module'; // Import OperationJournalModule
import { SettingsUserProfileModule } from './settings-user-profile/settings-user-profile.module'; // Import SettingsUserProfileModule
import { DocumentManagementModule } from './document-management/document-management.module'; // Import DocumentManagementModule
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'; // Adjust path if needed

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Explicitly load .env from the service's root
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', 'postgres_password'), // Replace with a secure password or env variable
        database: configService.get<string>('DATABASE_NAME', 'wanzo_app_mobile_db'), // Example DB name
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV', 'development') === 'development', // True for dev, false for prod
        logging: configService.get<string>('NODE_ENV', 'development') === 'development',
      }),
      inject: [ConfigService],
    }),
    ProductsModule,
    CustomersModule, // Added module
    SalesModule, // Add SalesModule here
    SubscriptionsModule, // Add SubscriptionsModule here
    AuthModule, // Add AuthModule here
    CompanyModule, // Add CompanyModule here
    SuppliersModule, // Add SuppliersModule to imports
    AdhaModule, // Add AdhaModule to imports
    ExpensesModule, // Add ExpensesModule to imports
    FinancingModule, // Add FinancingModule to imports
    NotificationsModule, // Add NotificationsModule to imports
    OperationJournalModule, // Added OperationJournalModule
    SettingsUserProfileModule, // Added SettingsUserProfileModule
    DocumentManagementModule, // Add DocumentManagementModule here
    // ... other feature modules will be added here
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
