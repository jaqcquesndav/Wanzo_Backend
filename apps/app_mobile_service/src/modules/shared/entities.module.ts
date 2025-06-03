import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { Company } from '../company/entities/company.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../auth/entities/user.entity';

/**
 * This module is solely responsible for registering all entities to be used across
 * the application, helping to avoid circular dependencies between modules.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supplier,
      Company,
      Product,
      User
    ]),
  ],
  exports: [TypeOrmModule],
})
export class EntitiesModule {}
