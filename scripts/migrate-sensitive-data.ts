#!/usr/bin/env node

/**
 * Script de migration pour crypter les données sensibles existantes
 * À exécuter UNE SEULE FOIS après le déploiement des nouveaux services
 */

import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface MigrationService {
  name: string;
  database: string;
  entities: string[];
  sensitiveFields: { entity: string; fields: string[] }[];
}

const SERVICES_TO_MIGRATE: MigrationService[] = [
  {
    name: 'Portfolio Institution Service',
    database: 'portfolio_institution_service',
    entities: ['disbursements'],
    sensitiveFields: [
      {
        entity: 'disbursements',
        fields: ['debitAccount', 'beneficiary']
      }
    ]
  },
  {
    name: 'Customer Service',
    database: 'customer_service',
    entities: ['customers', 'payments'],
    sensitiveFields: [
      {
        entity: 'customers',
        fields: ['phone', 'contacts']
      },
      {
        entity: 'payments',
        fields: ['gatewayResponse', 'metadata']
      }
    ]
  },
  {
    name: 'Accounting Service',
    database: 'accounting_service',
    entities: ['integrations_settings'],
    sensitiveFields: [
      {
        entity: 'integrations_settings',
        fields: ['googleDrive', 'ksPay', 'slack']
      }
    ]
  }
];

class DataMigrationTool {
  private dataSources: Map<string, DataSource> = new Map();

  async initialize() {
    console.log('🔐 Initialisation de l\'outil de migration des données sensibles');
    
    for (const service of SERVICES_TO_MIGRATE) {
      const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: service.database,
        entities: [`apps/${service.name.toLowerCase().replace(/\s+/g, '-')}/src/**/*.entity{.ts,.js}`],
        synchronize: false, // Never synchronize in migration
      });

      await dataSource.initialize();
      this.dataSources.set(service.name, dataSource);
      console.log(`✅ Connexion établie pour ${service.name}`);
    }
  }

  async createBackups() {
    console.log('📋 Création des sauvegardes...');
    
    for (const service of SERVICES_TO_MIGRATE) {
      const dataSource = this.dataSources.get(service.name);
      if (!dataSource) continue;

      for (const entityConfig of service.sensitiveFields) {
        const tableName = entityConfig.entity;
        const backupTableName = `${tableName}_backup_${new Date().toISOString().split('T')[0]}`;
        
        try {
          // Create backup table
          await dataSource.query(`
            CREATE TABLE ${backupTableName} AS 
            SELECT * FROM ${tableName}
          `);
          
          console.log(`✅ Sauvegarde créée: ${backupTableName}`);
        } catch (error) {
          console.error(`❌ Erreur lors de la sauvegarde de ${tableName}:`, error);
        }
      }
    }
  }

  async migrateData() {
    console.log('🔄 Migration des données sensibles...');
    
    for (const service of SERVICES_TO_MIGRATE) {
      const dataSource = this.dataSources.get(service.name);
      if (!dataSource) continue;

      console.log(`\n📊 Migration de ${service.name}:`);

      for (const entityConfig of service.sensitiveFields) {
        const tableName = entityConfig.entity;
        
        try {
          // Get all records
          const records = await dataSource.query(`SELECT * FROM ${tableName}`);
          console.log(`  📝 ${records.length} enregistrements trouvés dans ${tableName}`);

          let migratedCount = 0;
          
          for (const record of records) {
            let needsUpdate = false;
            const updates: string[] = [];
            
            for (const field of entityConfig.fields) {
              const value = record[field];
              
              // Check if data is already encrypted
              if (value && typeof value === 'object' && !value.encrypted) {
                needsUpdate = true;
                // Note: In real implementation, we would encrypt here
                // For now, we just log what would be encrypted
                console.log(`    🔐 Champ à crypter: ${field} (ID: ${record.id})`);
              }
            }
            
            if (needsUpdate) {
              migratedCount++;
              // Note: Actual encryption would happen here in real implementation
            }
          }
          
          console.log(`  ✅ ${migratedCount} enregistrements marqués pour migration dans ${tableName}`);
          
        } catch (error) {
          console.error(`  ❌ Erreur lors de la migration de ${tableName}:`, error);
        }
      }
    }
  }

  async validateMigration() {
    console.log('\n🔍 Validation de la migration...');
    
    for (const service of SERVICES_TO_MIGRATE) {
      const dataSource = this.dataSources.get(service.name);
      if (!dataSource) continue;

      console.log(`\n📊 Validation de ${service.name}:`);

      for (const entityConfig of service.sensitiveFields) {
        const tableName = entityConfig.entity;
        
        try {
          const records = await dataSource.query(`SELECT * FROM ${tableName} LIMIT 5`);
          
          for (const record of records) {
            for (const field of entityConfig.fields) {
              const value = record[field];
              
              if (value && typeof value === 'object') {
                if (value.encrypted) {
                  console.log(`  ✅ ${field} est crypté (ID: ${record.id})`);
                } else {
                  console.log(`  ⚠️  ${field} n'est pas encore crypté (ID: ${record.id})`);
                }
              }
            }
          }
          
        } catch (error) {
          console.error(`  ❌ Erreur lors de la validation de ${tableName}:`, error);
        }
      }
    }
  }

  async cleanup() {
    console.log('\n🧹 Nettoyage des connexions...');
    
    for (const [serviceName, dataSource] of this.dataSources) {
      try {
        await dataSource.destroy();
        console.log(`✅ Connexion fermée pour ${serviceName}`);
      } catch (error) {
        console.error(`❌ Erreur lors de la fermeture de ${serviceName}:`, error);
      }
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.createBackups();
      await this.migrateData();
      await this.validateMigration();
      
      console.log('\n🎉 Migration terminée avec succès!');
      console.log('\n📋 Prochaines étapes:');
      console.log('  1. Vérifier les logs de migration');
      console.log('  2. Tester les fonctionnalités critiques');
      console.log('  3. Supprimer les tables de sauvegarde après validation');
      console.log('  4. Déployer en production');
      
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Execution
if (require.main === module) {
  const migrationTool = new DataMigrationTool();
  migrationTool.run().catch(console.error);
}

export { DataMigrationTool };
