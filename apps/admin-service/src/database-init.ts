import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { Connection } from 'typeorm';

async function bootstrap() {
  const logger = new Logger('DatabaseInit');
  
  try {
    // Create a standalone application instance to initialize the database
    logger.log('Starting database initialization...');
    const app = await NestFactory.create(AppModule);
    
    // Get the TypeORM connection
    const connection = app.get(Connection);
    
    // Define all the enum types that need to be created
    const enumTypes = [
      {
        name: 'customer_status_enum',
        values: ['active', 'pending', 'suspended', 'inactive', 'needs_validation', 'validation_in_progress']
      },
      {
        name: 'location_type_enum',
        values: ['headquarters', 'site', 'store']
      },
      // Add other enums as needed
    ];
    
    // Create each enum type if it doesn't exist
    for (const enumType of enumTypes) {
      try {
        // Check if the enum type already exists
        const existingEnum = await connection.query(`
          SELECT typname FROM pg_type WHERE typname = $1
        `, [enumType.name]);
        
        if (existingEnum.length === 0) {
          logger.log(`Creating enum type: ${enumType.name}`);
          
          // Create the enum type
          const values = enumType.values.map(v => `'${v}'`).join(', ');
          await connection.query(`CREATE TYPE ${enumType.name} AS ENUM (${values})`);
          
          logger.log(`Enum type ${enumType.name} created successfully`);
        } else {
          logger.log(`Enum type ${enumType.name} already exists`);
        }      } catch (error) {
        const err = error as Error;
        logger.error(`Failed to create enum type ${enumType.name}: ${err.message}`);
      }
    }
      logger.log('Database initialization completed');
    await app.close();
    
  } catch (error) {
    const err = error as Error;
    logger.error(`Database initialization failed: ${err.message}`);
    process.exit(1);
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  bootstrap();
}

export { bootstrap as initDatabase };
