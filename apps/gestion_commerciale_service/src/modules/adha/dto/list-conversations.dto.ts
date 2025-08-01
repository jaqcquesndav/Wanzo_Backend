import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ListConversationsDto {
  @ApiProperty({
    description: 'Numéro de page pour la pagination',
    example: 1,
    minimum: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Example max limit
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'lastMessageTimestamp'; // Default sort field

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC'; // Default sort order
}
