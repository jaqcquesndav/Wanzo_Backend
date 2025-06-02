import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsDateString, IsEnum, IsOptional, IsArray, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { FinancingRecordType, FinancingRecordStatus } from '../entities/financing-record.entity';

export class RelatedDocumentDto {
  @ApiProperty({ description: 'Name of the related document', example: 'Loan Agreement' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'URL of the related document', example: 'https://example.com/loan_agreement.pdf' })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

export class CreateFinancingRecordDto {
  @ApiProperty({
    description: 'Type of financing',
    enum: FinancingRecordType,
    example: FinancingRecordType.LOAN,
  })
  @IsEnum(FinancingRecordType)
  @IsNotEmpty()
  type: FinancingRecordType;

  @ApiProperty({ description: 'Source or purpose of the financing', example: 'Bank X Loan' })
  @IsString()
  @IsNotEmpty()
  sourceOrPurpose: string;

  @ApiProperty({ description: 'Amount of financing', example: 50000 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Date of the financing record', example: '2025-07-15T10:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  date: string; // Using string for ISO8601 date, will be converted to Date object in service

  @ApiPropertyOptional({ description: 'Terms of the financing (e.g., interest rate, repayment schedule)', example: '5% interest, 36 months repayment' })
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiPropertyOptional({
    description: 'Status of the financing record',
    enum: FinancingRecordStatus,
    default: FinancingRecordStatus.PENDING,
    example: FinancingRecordStatus.ACTIVE,
  })
  @IsEnum(FinancingRecordStatus)
  @IsOptional()
  status?: FinancingRecordStatus = FinancingRecordStatus.PENDING;

  @ApiPropertyOptional({
    description: 'Related documents (e.g., contracts, agreements)',
    type: [RelatedDocumentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelatedDocumentDto)
  @IsOptional()
  relatedDocuments?: RelatedDocumentDto[];
}
