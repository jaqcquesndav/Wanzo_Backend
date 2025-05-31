import { IsString, IsEnum, IsDate, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, TransactionStatus } from '../entities/treasury-transaction.entity';
import { AccountType } from '../entities/treasury-account.entity';

export class CreateTreasuryAccountDto {
  @ApiProperty({ description: 'Account name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Account type', enum: AccountType })
  @IsEnum(AccountType)
  type!: AccountType;

  @ApiProperty({ description: 'Account number' })
  @IsString()
  accountNumber!: string;

  @ApiPropertyOptional({ description: 'Account description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTreasuryAccountDto {
  @ApiPropertyOptional({ description: 'Account name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Account type', enum: AccountType })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiPropertyOptional({ description: 'Account description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Account active status' })
  @IsOptional()
  @IsString()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateTransactionDto {
  @ApiProperty({ description: 'Fiscal year' })
  @IsString()
  fiscalYear!: string;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({ description: 'Transaction reference' })
  @IsString()
  reference!: string;

  @ApiProperty({ description: 'Transaction date' })
  @IsDate()
  @Type(() => Date)
  date!: Date;

  @ApiProperty({ description: 'Transaction description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  amount!: number;

  @ApiProperty({ description: 'Treasury account ID' })
  @IsUUID()
  accountId!: string;

  @ApiPropertyOptional({ description: 'Counterparty account ID' })
  @IsOptional()
  @IsUUID()
  counterpartyAccountId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTransactionStatusDto {
  @ApiProperty({ description: 'Transaction status', enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  status!: TransactionStatus;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class TransactionFilterDto {
  @ApiPropertyOptional({ description: 'Filter by fiscal year' })
  @IsOptional()
  @IsString()
  fiscalYear?: string;

  @ApiPropertyOptional({ description: 'Filter by type', enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ description: 'Filter by status', enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Filter by account ID' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}