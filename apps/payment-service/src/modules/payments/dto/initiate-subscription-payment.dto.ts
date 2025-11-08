import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum TelecomCode {
  AM = 'AM',
  OM = 'OM',
  MP = 'MP',
  AF = 'AF',
}

export enum SubscriptionPlanType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  ONE_TIME = 'one_time',
}

export class InitiateSubscriptionPaymentDto {
  @ApiProperty({ example: '243994972450', description: 'Client phone number' })
  @IsString()
  @IsNotEmpty()
  clientPhone!: string;

  @ApiProperty({ example: 50.00, description: 'Subscription plan amount in specified currency' })
  @IsNumber()
  @Min(0.1)
  amount!: number;

  @ApiProperty({ example: 'CDF', description: 'Currency code' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ enum: TelecomCode, example: TelecomCode.AM, description: 'Mobile money operator' })
  @IsEnum(TelecomCode)
  telecom!: TelecomCode;

  @ApiProperty({ 
    enum: ['merchant', 'client'], 
    required: false, 
    default: 'merchant',
    description: 'Payment channel type'
  })
  @IsIn(['merchant', 'client'])
  @IsOptional()
  channel?: 'merchant' | 'client' = 'merchant';

  // === SUBSCRIPTION SPECIFIC FIELDS ===
  
  @ApiProperty({ example: 'uuid-plan-id', description: 'Subscription plan ID' })
  @IsUUID()
  @IsNotEmpty()
  planId!: string;

  @ApiProperty({ example: 'uuid-customer-id', description: 'Customer ID' })
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ 
    enum: SubscriptionPlanType, 
    example: SubscriptionPlanType.MONTHLY,
    description: 'Type of subscription plan'
  })
  @IsEnum(SubscriptionPlanType)
  planType!: SubscriptionPlanType;

  @ApiProperty({ 
    example: 'Standard Monthly Plan',
    description: 'Human-readable plan name'
  })
  @IsString()
  @IsNotEmpty()
  planName!: string;

  @ApiProperty({ 
    example: 1000,
    description: 'Number of tokens included in this plan'
  })
  @IsNumber()
  @IsOptional()
  tokensIncluded?: number;

  @ApiProperty({ 
    required: false, 
    description: 'Optional client reference for idempotency or tracing' 
  })
  @IsString()
  @IsOptional()
  clientReference?: string;

  @ApiProperty({ 
    required: false,
    description: 'Optional existing subscription ID if this is a renewal/upgrade'
  })
  @IsUUID()
  @IsOptional()
  existingSubscriptionId?: string;

  @ApiProperty({ 
    required: false,
    description: 'Additional metadata for the subscription payment'
  })
  @IsOptional()
  metadata?: {
    isRenewal?: boolean;
    isUpgrade?: boolean;
    promoCode?: string;
    billingCycleStart?: string;
    billingCycleEnd?: string;
    [key: string]: any;
  };
}