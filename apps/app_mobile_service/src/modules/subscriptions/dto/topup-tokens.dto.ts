import { IsNotEmpty, IsUUID, IsObject, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// This DTO can be more detailed based on actual payment gateway requirements
export class PaymentDetailsDto {
  @ApiProperty({ 
    description: 'One-time use token representing payment details', 
    example: 'payment-method-nonce-123456' 
  })
  @IsNotEmpty()
  @IsString()
  paymentMethodNonce: string; // Example: a nonce from Braintree or a token from Stripe

  @ApiPropertyOptional({ 
    description: 'ID of a saved payment method', 
    example: 'pm_123456789' 
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string; // If using a saved payment method
  
  // Add other fields as required by your payment processing logic
  // e.g., amount, currency, etc., though amount might be derived from tokenPackageId server-side
}

export class TopUpTokensDto {
  @ApiProperty({ 
    description: 'ID of the token package to purchase', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsNotEmpty()
  @IsUUID()
  tokenPackageId: string;

  @ApiPropertyOptional({ 
    description: 'Payment details for processing the transaction', 
    type: PaymentDetailsDto 
  })
  @IsOptional() // Payment details might not be needed if using a default payment method or if payment is handled differently
  @IsObject()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails?: PaymentDetailsDto;
}
