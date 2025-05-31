import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class UpdateBusinessSectorDto {
  @ApiPropertyOptional({
    description: 'The new name of the business sector',
    example: 'Retail and Consumer Goods',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty() // Even if optional, if provided, it should not be empty
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'An optional new description for the business sector',
    example: 'Businesses involved in selling goods and related services directly to consumers.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
