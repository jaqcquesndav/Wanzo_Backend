import { IsNotEmpty, IsUUID, IsObject, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

// This DTO can be more detailed based on actual payment gateway requirements
export class PaymentDetailsDto {
  @IsNotEmpty()
  @IsString()
  paymentMethodNonce: string; // Example: a nonce from Braintree or a token from Stripe

  @IsOptional()
  @IsString()
  paymentMethodId?: string; // If using a saved payment method
  
  // Add other fields as required by your payment processing logic
  // e.g., amount, currency, etc., though amount might be derived from tokenPackageId server-side
}

export class TopUpTokensDto {
  @IsNotEmpty()
  @IsUUID()
  tokenPackageId: string;

  @IsOptional() // Payment details might not be needed if using a default payment method or if payment is handled differently
  @IsObject()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails?: PaymentDetailsDto;
}
