import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, IsUUID, IsOptional, IsArray, IsUrl, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ExpenseCategoryType } from '../entities/expense.entity';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'Date de la dépense',
    example: '2023-08-01T12:30:00.000Z',
    required: true
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Motif de la dépense',
    example: 'Achat de fournitures de bureau',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  motif: string;

  @ApiProperty({
    description: 'Montant de la dépense',
    example: 150.00,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Catégorie de la dépense',
    enum: ExpenseCategoryType,
    example: ExpenseCategoryType.SUPPLIES,
    required: true
  })
  @IsEnum(ExpenseCategoryType)
  @IsNotEmpty()
  category: ExpenseCategoryType;

  @ApiProperty({
    description: 'Méthode de paiement utilisée (optionnel)',
    example: 'cash',
    required: false
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({
    description: 'Identifiant du fournisseur (optionnel)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    format: 'uuid',
    required: false
  })
  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @ApiProperty({
    description: 'Bénéficiaire de la dépense (optionnel)',
    example: 'Fournisseur ABC',
    required: false
  })
  @IsString()
  @IsOptional()
  beneficiary?: string;

  @ApiProperty({
    description: 'Notes additionnelles (optionnel)',
    example: 'Achat urgent pour projet client',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Code de la devise (optionnel)',
    example: 'USD',
    required: false
  })
  @IsString()
  @IsOptional()
  currencyCode?: string;
}
