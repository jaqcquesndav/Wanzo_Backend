import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseCategoryDto {
  @ApiProperty({
    description: 'Nom de la catégorie de dépense',
    example: 'Fournitures de bureau',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description de la catégorie',
    example: 'Dépenses liées aux fournitures et matériel de bureau',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  // companyId will be taken from the authenticated user's context
}
