import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from './create-expense.dto';
import { IsOptional, IsString, IsNumber, IsDateString, IsUUID } from 'class-validator';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  expenseDate?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  // Assuming attachmentUrl might be updated, or a new attachment replaces an old one.
  // Handling actual file upload will be part of the controller/service logic.
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
