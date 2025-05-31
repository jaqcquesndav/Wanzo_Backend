import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import { AuthModule } from '../auth/auth.module'; // For JwtAuthGuard and CurrentUser decorator
import { MulterModule } from '@nestjs/platform-express'; // For file uploads

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, ExpenseCategory]),
    AuthModule, // Import AuthModule to make its exports (guards, decorators) available
    MulterModule.register({ // Basic Multer registration, can be configured further
      // dest: './uploads', // or configure storage with Cloudinary/S3 etc.
    }),
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService, TypeOrmModule], // Export TypeOrmModule if entities are used elsewhere
})
export class ExpensesModule {}
