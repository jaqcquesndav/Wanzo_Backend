import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import { SubscriptionTierType } from '../entities/subscription-tier.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeTierDto {
  @ApiProperty({ 
    description: 'Type of subscription tier to change to', 
    example: 'premium', 
    enum: ['free', 'basic', 'premium', 'enterprise'] 
  })
  @IsNotEmpty()
  @IsString() // Assuming tier type is passed as a string, e.g., "premium"
  // Consider using IsEnum(SubscriptionTierType) if the raw enum value is passed
  newTierType: string; // Or SubscriptionTierType if enum value is passed directly

  // Optionally, you might include payment details or a payment method ID if immediate payment is required
  // @ApiPropertyOptional({ description: 'ID of the payment method to use', example: '123e4567-e89b-12d3-a456-426614174000' })
  // @IsOptional()
  // @IsUUID()
  // paymentMethodId?: string;
}
