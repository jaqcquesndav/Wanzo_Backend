import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateTransactionCategoryDto {
  @ApiProperty({
    description: 'Nom de la catégorie',
    example: 'Fournitures de bureau'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Description de la catégorie',
    example: 'Dépenses pour les fournitures et matériel de bureau'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Code de la catégorie',
    example: 'FOURNITURES'
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    description: 'ID de la catégorie parente',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    description: 'Type de catégorie (income/expense/both)',
    example: 'expense',
    enum: ['income', 'expense', 'both']
  })
  @IsEnum(['income', 'expense', 'both'])
  @IsNotEmpty()
  type: 'income' | 'expense' | 'both';

  @ApiPropertyOptional({
    description: 'Couleur associée à la catégorie (pour l\'UI)',
    example: '#3498db'
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    description: 'Icône associée à la catégorie (pour l\'UI)',
    example: 'office_supplies'
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Ordre d\'affichage',
    example: 1,
    default: 0
  })
  @IsNumber()
  @IsOptional()
  displayOrder?: number = 0;
}

export class UpdateTransactionCategoryDto {
  @ApiPropertyOptional({
    description: 'Nom de la catégorie',
    example: 'Fournitures de bureau'
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description de la catégorie',
    example: 'Dépenses pour les fournitures et matériel de bureau'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Code de la catégorie',
    example: 'FOURNITURES'
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    description: 'ID de la catégorie parente',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Type de catégorie (income/expense/both)',
    example: 'expense',
    enum: ['income', 'expense', 'both']
  })
  @IsEnum(['income', 'expense', 'both'])
  @IsOptional()
  type?: 'income' | 'expense' | 'both';

  @ApiPropertyOptional({
    description: 'Couleur associée à la catégorie (pour l\'UI)',
    example: '#3498db'
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    description: 'Icône associée à la catégorie (pour l\'UI)',
    example: 'office_supplies'
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Ordre d\'affichage',
    example: 1
  })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Indique si la catégorie est active',
    example: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
