import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { DashboardPeriod } from '../enums/dashboard-period.enum';
import { Currency } from '../enums/currency.enum';

export class SalesSummaryQueryDto {
  @ApiProperty({
    description: 'Période pour laquelle récupérer les données',
    enum: DashboardPeriod,
    example: DashboardPeriod.WEEK
  })
  @IsEnum(DashboardPeriod)
  period: DashboardPeriod;

  @ApiPropertyOptional({
    description: 'Date de référence',
    example: '2023-08-01',
    type: Date
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  date?: Date;

  @ApiPropertyOptional({
    description: 'Devise pour les montants',
    enum: Currency,
    default: Currency.ALL
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency = Currency.ALL;
}
