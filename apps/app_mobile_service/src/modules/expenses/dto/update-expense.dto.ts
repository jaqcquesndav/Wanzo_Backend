import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from './create-expense.dto';
import { IsOptional, IsString, IsNumber, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {
  @ApiProperty({
    description: 'Titre de la dépense (optionnel)',
    example: 'Achats trimestriels',
    required: false
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Montant de la dépense (optionnel)',
    example: 350.75,
    required: false
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({
    description: 'Date de la dépense (optionnel)',
    example: '2025-06-05',
    required: false
  })
  @IsOptional()
  @IsDateString()
  expenseDate?: Date;
  @ApiProperty({
    description: 'Description détaillée de la dépense (optionnel)',
    example: 'Achat de fournitures diverses pour le bureau principal',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Identifiant de la catégorie de dépense (optionnel)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    format: 'uuid',
    required: false
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  // Assuming attachmentUrl might be updated, or a new attachment replaces an old one.
  // Handling actual file upload will be part of the controller/service logic.
  @ApiProperty({
    description: 'URL de la pièce jointe (optionnel)',
    example: 'https://example.com/attachments/receipt_updated.jpg',
    required: false
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
