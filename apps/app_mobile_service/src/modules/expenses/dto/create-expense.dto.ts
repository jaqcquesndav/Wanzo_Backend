import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, IsUUID, IsOptional, IsArray, ArrayNotEmpty, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'Date de la dépense',
    example: '2025-06-04',
    required: true
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Montant de la dépense',
    example: 250.50,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Motif de la dépense',
    example: 'Achat de fournitures de bureau',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  motif: string;

  @ApiProperty({
    description: 'Identifiant de la catégorie de dépense',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid',
    required: true
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: 'Méthode de paiement utilisée',
    example: 'carte',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({
    description: 'URLs des pièces jointes',
    example: ['https://example.com/attachments/receipt1.jpg', 'https://example.com/attachments/receipt2.jpg'],
    required: false,
    type: [String]
  })
  @IsArray()
  @IsOptional()
  @IsUrl({}, { each: true })
  attachmentUrls?: string[];

  @ApiProperty({
    description: 'Identifiant du fournisseur (optionnel)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    format: 'uuid',
    required: false
  })
  @IsUUID()
  @IsOptional()
  supplierId?: string;

  // userId and companyId will be set from the authenticated user context in the service
}
