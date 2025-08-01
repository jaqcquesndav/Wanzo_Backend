import { DataSource } from 'typeorm';
import { Supplier } from './modules/suppliers/entities/supplier.entity';
import { Company } from './modules/company/entities/company.entity';
import { Product } from './modules/products/entities/product.entity';
import { User } from './modules/auth/entities/user.entity';
import { UserSubscription } from './modules/subscriptions/entities/user-subscription.entity';
import { SubscriptionTier } from './modules/subscriptions/entities/subscription-tier.entity';
import { Sale } from './modules/sales/entities/sale.entity';
import { SaleItem } from './modules/sales/entities/sale-item.entity';
import { Customer } from './modules/customers/entities/customer.entity';
import { OperationJournalEntry } from './modules/operation-journal/entities/operation-journal-entry.entity';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables
config();

async function resetDatabase() {
  console.log('Starting database reset and schema synchronization...');
  const configService = new ConfigService();
  const dataSource = new DataSource({
    type: 'postgres',    host: configService.get<string>('DATABASE_HOST', 'localhost'),
    port: configService.get<number>('DATABASE_PORT', 5432),
    username: configService.get<string>('DATABASE_USER', 'postgres'),
    password: configService.get<string>('DATABASE_PASSWORD', 'postgres_password'),
    database: configService.get<string>('DATABASE_NAME', 'wanzo_app_mobile_db'),
    entities: [Supplier, Company, Product, User, UserSubscription, SubscriptionTier, Sale, SaleItem, Customer, OperationJournalEntry],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection initialized');    // Drop tables that might have circular dependencies
    console.log('Dropping tables with potential circular dependencies...');    await dataSource.query('DROP TABLE IF EXISTS suppliers CASCADE');
    await dataSource.query('DROP TABLE IF EXISTS companies CASCADE');
    await dataSource.query('DROP TABLE IF EXISTS products CASCADE');
    await dataSource.query('DROP TABLE IF EXISTS user_subscriptions CASCADE');
    await dataSource.query('DROP TABLE IF EXISTS users CASCADE');
    await dataSource.query('DROP TABLE IF EXISTS subscription_tiers CASCADE');
    await dataSource.query('DROP TABLE IF EXISTS sales CASCADE');
    await dataSource.query('DROP TABLE IF EXISTS sale_items CASCADE');
    await dataSource.query('DROP TABLE IF EXISTS customers CASCADE');
    await dataSource.query('DROP TABLE IF EXISTS operation_journal_entries CASCADE');
    
    // Re-create all tables
    console.log('Synchronizing database schema...');
    await dataSource.synchronize(true);
    
    console.log('Database schema reset and synchronized successfully');
  } catch (error) {
    console.error('Error during database reset:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

// Run the function
resetDatabase()
  .then(() => console.log('Database reset completed'))
  .catch(err => console.error('Database reset failed:', err));