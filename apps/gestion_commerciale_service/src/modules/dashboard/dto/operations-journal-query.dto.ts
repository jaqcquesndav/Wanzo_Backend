import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { OperationType } from '../enums/operation-type.enum';

export class OperationsJournalQueryDto {
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
    description: 'Numéro de page pour la pagination',
    example: 1,
    default: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 10,
    default: 10
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
