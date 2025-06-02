import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import { SubscriptionTierType } from '../entities/subscription-tier.entity';

export class ChangeTierDto {
  @IsNotEmpty()
  @IsString() // Assuming tier type is passed as a string, e.g., "premium"
  // Consider using IsEnum(SubscriptionTierType) if the raw enum value is passed
  newTierType: string; // Or SubscriptionTierType if enum value is passed directly

  // Optionally, you might include payment details or a payment method ID if immediate payment is required
  // @IsOptional()
  // @IsUUID()
  // paymentMethodId?: string;
}
