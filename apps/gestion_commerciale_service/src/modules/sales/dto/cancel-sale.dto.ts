import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelSaleDto {
  @ApiProperty({
    description: 'Raison de l\'annulation (optionnel)',
    example: 'Client a changé d\'avis',
    required: false
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
