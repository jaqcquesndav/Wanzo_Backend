import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBusinessSectorDto {
  @ApiProperty({ description: 'Name of the business sector', example: 'Retail' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the business sector', example: 'Businesses involved in selling goods to consumers.' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateBusinessSectorDto {
  @ApiPropertyOptional({ description: 'Name of the business sector', example: 'Retail' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the business sector', example: 'Businesses involved in selling goods to consumers.' })
  @IsOptional()
  @IsString()
  description?: string;
}
