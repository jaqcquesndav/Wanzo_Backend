import { IsString, IsOptional, IsNumber, Min, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteSaleDto {
  @ApiProperty({
    description: 'Montant payé en Francs Congolais',
    example: 50000.00,
    minimum: 0,
    required: true
  })
  @IsNumber()
  @IsPositive()
  amountPaidInCdf: number;

  @ApiProperty({
    description: 'Méthode de paiement',
    example: 'cash',
    required: true
  })
  @IsString()
  paymentMethod: string;

  @ApiProperty({
    description: 'Référence de paiement (optionnel)',
    example: 'TRANS-123456',
    required: false
  })
  @IsString()
  @IsOptional()
  paymentReference?: string;
}
