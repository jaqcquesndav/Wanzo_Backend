import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { OperationType } from '../enums/operation-type.enum';

export class JournalQueryDto {
  @ApiProperty({
    description: 'Date de début',
    example: '2023-07-25',
    type: Date
  })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate: Date;

  @ApiProperty({
    description: 'Date de fin',
    example: '2023-08-01',
    type: Date
  })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Type d\'opération',
    enum: OperationType,
    default: OperationType.ALL
  })
  @IsOptional()
  @IsEnum(OperationType)
  type?: OperationType = OperationType.ALL;

  @ApiPropertyOptional({
    description: 'Numéro de page pour la pagination',
    example: 1,
    default: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
