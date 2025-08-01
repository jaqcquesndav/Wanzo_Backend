import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    description: 'Date pour laquelle récupérer les données',
    example: '2023-08-01',
    type: Date
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  date?: Date;

  @ApiPropertyOptional({
    description: 'Fuseau horaire pour les calculs de date',
    example: 'Africa/Kinshasa',
    default: 'Africa/Kinshasa'
  })
  @IsOptional()
  @IsString()
  timezone?: string = 'Africa/Kinshasa';
}
