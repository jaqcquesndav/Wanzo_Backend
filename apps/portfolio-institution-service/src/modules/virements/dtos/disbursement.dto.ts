import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisbursementStatus, PaymentMethod } from '../entities/disbursement.entity';

class DebitAccountDto {
  @ApiProperty({ description: 'Account number' })
  @IsString()
  accountNumber!: string;

  @ApiProperty({ description: 'Account name' })
  @IsString()
  accountName!: string;

  @ApiProperty({ description: 'Bank name' })
  @IsString()
  bankName!: string;

  @ApiProperty({ description: 'Bank code' })
  @IsString()
  bankCode!: string;

  @ApiPropertyOptional({ description: 'Branch code' })
  @IsOptional()
  @IsString()
  branchCode?: string;
}

class BeneficiaryDto {
  @ApiProperty({ description: 'Account number' })
  @IsString()
  accountNumber!: string;

  @ApiProperty({ description: 'Account name' })
  @IsString()
  accountName!: string;

  @ApiProperty({ description: 'Bank name' })
  @IsString()
  bankName!: string;

  @ApiPropertyOptional({ description: 'Bank code' })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional({ description: 'Branch code' })
  @IsOptional()
  @IsString()
  branchCode?: string;

  @ApiPropertyOptional({ description: 'SWIFT code' })
  @IsOptional()
  @IsString()
  swiftCode?: string;

  @ApiProperty({ description: 'Company name' })
  @IsString()
  companyName!: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateDisbursementDto {
  @ApiProperty({ description: 'Company name' })
  @IsString()
  company!: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  product!: string;

  @ApiProperty({ description: 'Amount' })
  @IsNumber()
  amount!: number;

  @ApiProperty({ description: 'Date of disbursement', example: '2025-08-15' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ description: 'Request ID' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiProperty({ description: 'Portfolio ID' })
  @IsString()
  portfolioId!: string;

  @ApiProperty({ description: 'Contract reference' })
  @IsString()
  contractReference!: string;

  @ApiProperty({ description: 'Debit account details' })
  @ValidateNested()
  @Type(() => DebitAccountDto)
  debitAccount!: DebitAccountDto;

  @ApiProperty({ description: 'Beneficiary details' })
  @ValidateNested()
  @Type(() => BeneficiaryDto)
  beneficiary!: BeneficiaryDto;

  @ApiPropertyOptional({ description: 'Payment method', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment reference' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDisbursementDto {
  @ApiPropertyOptional({ description: 'Status', enum: DisbursementStatus })
  @IsOptional()
  @IsEnum(DisbursementStatus)
  status?: DisbursementStatus;

  @ApiPropertyOptional({ description: 'Transaction reference' })
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @ApiPropertyOptional({ description: 'Value date', example: '2025-08-16' })
  @IsOptional()
  @IsDateString()
  valueDate?: string;

  @ApiPropertyOptional({ description: 'Execution date', example: '2025-08-16' })
  @IsOptional()
  @IsDateString()
  executionDate?: string;

  @ApiPropertyOptional({ description: 'Payment method', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment reference' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Supporting document URL' })
  @IsOptional()
  @IsString()
  supportingDocumentUrl?: string;
}
