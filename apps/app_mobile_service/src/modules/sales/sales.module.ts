import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Product } from '../products/entities/product.entity'; // Import Product entity
import { ProductsModule } from '../products/products.module'; // Import ProductsModule
import { CustomersModule } from '../customers/customers.module'; // Import CustomersModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, Product]), // Include Product repository
    forwardRef(() => ProductsModule), // Handle circular dependency if ProductsModule needs SalesService
    forwardRef(() => CustomersModule), // Handle circular dependency with CustomersModule
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService, TypeOrmModule], // Export TypeOrmModule if entities are used elsewhere
})
export class SalesModule {}
