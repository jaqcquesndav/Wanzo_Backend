import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { OperationType } from '../enums/operation-type.enum';

export class ExportJournalQueryDto {
  @ApiPropertyOptional({
    description: 'Date de début au format ISO8601',
    example: '2023-08-01',
    type: Date
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Date de fin au format ISO8601',
    example: '2023-08-31',
    type: Date
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Filtrer par type d\'opération',
    enum: OperationType,
    example: OperationType.SALE_CASH
  })
  @IsOptional()
  @IsEnum(OperationType)
  type?: OperationType;

  @ApiPropertyOptional({
    description: 'Format d\'export (PDF ou CSV)',
    example: 'pdf',
    default: 'pdf'
  })
  @IsOptional()
  format?: 'pdf' | 'csv' = 'pdf';
}
