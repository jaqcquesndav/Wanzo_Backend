import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({
    description: 'Numéro de page',
    default: 1,
    minimum: 1,
    required: false,
    example: 1
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page',
    default: 10,
    minimum: 1,
    maximum: 100,
    required: false,
    example: 10
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  @ApiProperty({
    description: 'Champ à utiliser pour le tri',
    required: false,
    example: 'createdAt'
  })
  @IsOptional()
  sortBy: string = 'createdAt';

  @ApiProperty({
    description: 'Ordre de tri (asc/desc)',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'desc';

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
