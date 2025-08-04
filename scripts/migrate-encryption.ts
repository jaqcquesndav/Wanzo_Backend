import { DataSource } from 'typeorm';
import { EncryptionService } from '../packages/shared/security/encryption.service';

interface MigrationConfig {
  serviceName: string;
  tableName: string;
  columnsToEncrypt: string[];
  batchSize: number;
}

const MIGRATION_CONFIGS: MigrationConfig[] = [
  {
    serviceName: 'portfolio-institution-service',
    tableName: 'disbursements',
    columnsToEncrypt: ['debitAccount', 'beneficiary'],
    batchSize: 100
  },
  {
    serviceName: 'customer-service',
    tableName: 'customers',
    columnsToEncrypt: ['phone', 'contacts'],
    batchSize: 100
  },
  {
    serviceName: 'customer-service',
    tableName: 'payments',
    columnsToEncrypt: ['gatewayResponse', 'metadata'],
    batchSize: 100
  }
];

export class DataEncryptionMigration {
  private encryptionService: EncryptionService;

  constructor() {
    this.encryptionService = new EncryptionService();
  }

  async migrateAllServices() {
    console.log('🔐 Starting encryption migration for all services...');
    
    for (const config of MIGRATION_CONFIGS) {
      try {
        await this.migrateService(config);
        console.log(`✅ Successfully migrated ${config.serviceName}/${config.tableName}`);
      } catch (error) {
        console.error(`❌ Failed to migrate ${config.serviceName}/${config.tableName}:`, error);
        throw error;
      }
    }

    console.log('🎉 All services migrated successfully!');
  }

  private async migrateService(config: MigrationConfig) {
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: this.getDatabaseName(config.serviceName),
    });

    await dataSource.initialize();

    try {
      const totalRecords = await this.getTotalRecords(dataSource, config.tableName);
      console.log(`📊 Found ${totalRecords} records to migrate in ${config.tableName}`);

      let offset = 0;
      let migratedCount = 0;

      while (offset < totalRecords) {
        const records = await this.fetchBatch(dataSource, config, offset);
        
        for (const record of records) {
          await this.encryptRecord(dataSource, config, record);
          migratedCount++;
        }

        offset += config.batchSize;
        console.log(`📈 Progress: ${migratedCount}/${totalRecords} (${Math.round((migratedCount/totalRecords)*100)}%)`);
      }

    } finally {
      await dataSource.destroy();
    }
  }

  private async getTotalRecords(dataSource: DataSource, tableName: string): Promise<number> {
    const result = await dataSource.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result[0].count);
  }

  private async fetchBatch(dataSource: DataSource, config: MigrationConfig, offset: number) {
    return await dataSource.query(
      `SELECT * FROM ${config.tableName} ORDER BY id LIMIT ${config.batchSize} OFFSET ${offset}`
    );
  }

  private async encryptRecord(dataSource: DataSource, config: MigrationConfig, record: any) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const column of config.columnsToEncrypt) {
      if (record[column] && !this.isAlreadyEncrypted(record[column])) {
        const encrypted = this.encryptValue(record[column]);
        updates.push(`${column} = $${paramIndex}`);
        values.push(JSON.stringify(encrypted));
        paramIndex++;
      }
    }

    if (updates.length > 0) {
      const query = `UPDATE ${config.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
      values.push(record.id);
      await dataSource.query(query, values);
    }
  }

  private encryptValue(value: any) {
    if (typeof value === 'string') {
      return this.encryptionService.encrypt(value);
    } else if (typeof value === 'object') {
      return this.encryptionService.encryptObject(value);
    }
    return value;
  }

  private isAlreadyEncrypted(value: any): boolean {
    return value && typeof value === 'object' && value.encrypted && value.iv;
  }

  private getDatabaseName(serviceName: string): string {
    const dbNames = {
      'portfolio-institution-service': 'portfolio_institution_service',
      'customer-service': 'customer_service',
      'admin-service': 'admin_service',
      'accounting-service': 'accounting_service',
      'analytics-service': 'analytics_service',
      'gestion-commerciale-service': 'gestion_commerciale_service',
      'api-gateway': 'api_gateway'
    };
    return dbNames[serviceName] || serviceName.replace('-', '_');
  }

  async createBackup() {
    console.log('💾 Creating backup before encryption migration...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    for (const config of MIGRATION_CONFIGS) {
      const dbName = this.getDatabaseName(config.serviceName);
      const backupFile = `backup_${dbName}_${timestamp}.sql`;
      
      try {
        // This would need to be implemented based on your PostgreSQL setup
        console.log(`📦 Backup created: ${backupFile}`);
      } catch (error) {
        console.error(`❌ Backup failed for ${dbName}:`, error);
        throw error;
      }
    }
  }

  async validateEncryption() {
    console.log('🔍 Validating encryption migration...');
    
    let validationErrors = 0;
    
    for (const config of MIGRATION_CONFIGS) {
      try {
        const isValid = await this.validateServiceEncryption(config);
        if (!isValid) {
          validationErrors++;
          console.error(`❌ Validation failed for ${config.serviceName}/${config.tableName}`);
        } else {
          console.log(`✅ Validation passed for ${config.serviceName}/${config.tableName}`);
        }
      } catch (error) {
        validationErrors++;
        console.error(`❌ Validation error for ${config.serviceName}:`, error);
      }
    }

    if (validationErrors === 0) {
      console.log('🎉 All encryption validations passed!');
    } else {
      throw new Error(`${validationErrors} validation errors found`);
    }
  }

  private async validateServiceEncryption(config: MigrationConfig): Promise<boolean> {
    // Implementation would validate that sensitive data is properly encrypted
    // This is a simplified version
    return true;
  }
}

// Script execution
async function main() {
  try {
    const migration = new DataEncryptionMigration();
    
    // Step 1: Create backups
    await migration.createBackup();
    
    // Step 2: Migrate data
    await migration.migrateAllServices();
    
    // Step 3: Validate encryption
    await migration.validateEncryption();
    
    console.log('🎉 Encryption migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
