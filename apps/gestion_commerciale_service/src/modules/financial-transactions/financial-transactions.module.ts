import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialTransaction } from './entities/financial-transaction.entity';
import { TransactionCategory } from './entities/transaction-category.entity';
import { FinancialTransactionService } from './services/financial-transaction.service';
import { TransactionCategoryService } from './services/transaction-category.service';
import { FinancialTransactionController } from './controllers/financial-transaction.controller';
import { TransactionCategoryController } from './controllers/transaction-category.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialTransaction, TransactionCategory])
  ],
  controllers: [FinancialTransactionController, TransactionCategoryController],
  providers: [FinancialTransactionService, TransactionCategoryService],
  exports: [FinancialTransactionService, TransactionCategoryService]
})
export class FinancialTransactionsModule {}
