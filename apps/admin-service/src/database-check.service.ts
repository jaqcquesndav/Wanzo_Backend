import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class DatabaseCheckService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseCheckService.name);

  constructor(@InjectConnection() private connection: Connection) {}

  async onModuleInit() {
    try {
      // Check if database connection is successful
      if (this.connection.isConnected) {
        this.logger.log('Database connection established successfully');
        
        // Get a list of all tables
        const tables = await this.connection.query(
          `SELECT table_name 
           FROM information_schema.tables 
           WHERE table_schema = 'public'`
        );
        
        this.logger.log(`Found ${tables.length} tables in the database`);
        
        // Check for enum types
        const enums = await this.connection.query(
          `SELECT typname, enumlabels 
           FROM pg_type 
           JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid`
        );
        
        if (enums.length > 0) {
          this.logger.log(`Found ${enums.length} enum types in the database`);
        } else {
          this.logger.warn('No enum types found in the database');
        }
      } else {
        this.logger.error('Failed to establish database connection');
      }    } catch (error) {
      const err = error as Error;
      this.logger.error(`Database check failed: ${err.message}`, err.stack);
    }
  }
}
