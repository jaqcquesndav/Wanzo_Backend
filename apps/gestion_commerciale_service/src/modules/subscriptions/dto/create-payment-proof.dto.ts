import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentProofDto {
  // userId will be taken from the authenticated user context

  @ApiProperty({ 
    description: 'URL to the uploaded payment proof file (e.g., receipt image)', 
    example: 'https://storage.cloud.com/payments/receipt123.jpg' 
  })
  @IsNotEmpty()
  @IsString()
  fileUrl: string; // This will be the URL after upload to a service like Cloudinary

  @ApiPropertyOptional({ 
    description: 'ID of the invoice this payment proof is for', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({ 
    description: 'ID of the subscription tier this payment is for', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsOptional()
  @IsUUID()
  subscriptionTierId?: string;

  @ApiPropertyOptional({ 
    description: 'ID of the token package this payment is for', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsOptional()
  @IsUUID()
  tokenPackageId?: string;

  @ApiPropertyOptional({ 
    description: 'Additional notes about the payment', 
    example: 'Mobile money transfer completed at 14:30' 
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
