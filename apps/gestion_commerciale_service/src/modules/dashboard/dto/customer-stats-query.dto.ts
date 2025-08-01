import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { DashboardPeriod } from '../enums/dashboard-period.enum';

export class CustomerStatsQueryDto {
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
}
