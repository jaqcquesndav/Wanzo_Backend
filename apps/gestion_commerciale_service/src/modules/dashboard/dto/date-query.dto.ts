import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class DateQueryDto {
  @ApiPropertyOptional({
    description: 'Date pour laquelle récupérer les données au format ISO8601 (YYYY-MM-DD)',
    example: '2023-08-01',
    type: Date
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  date?: Date;
}
