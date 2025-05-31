import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { FinancialProduct } from './entities/financial-product.entity';
import { Equipment } from './entities/equipment.entity';
import { PortfolioService } from './services/portfolio.service';
import { FinancialProductService } from './services/financial-product.service';
import { EquipmentService } from './services/equipment.service';
import { PortfolioController } from './controllers/portfolio.controller';
import { FinancialProductController } from './controllers/financial-product.controller';
import { EquipmentController } from './controllers/equipment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Portfolio, FinancialProduct, Equipment]),
  ],
  providers: [
    PortfolioService,
    FinancialProductService,
    EquipmentService,
  ],
  controllers: [
    PortfolioController,
    FinancialProductController,
    EquipmentController,
  ],
  exports: [
    PortfolioService,
    FinancialProductService,
    EquipmentService,
  ],
})
export class PortfoliosModule {}