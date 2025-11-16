import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { SUPPORTED_CURRENCIES, SupportedCurrency } from '../entities/payment-transaction.entity';

export enum TelecomCode {
  AM = 'AM',
  OM = 'OM',
  MP = 'MP',
  AF = 'AF',
}

export class InitiateSerdiPayDto {
  @ApiProperty({ example: '243994972450' })
  @IsString()
  @IsNotEmpty()
  clientPhone!: string;

  @ApiProperty({ example: 400 })
  @IsNumber()
  @Min(0.1)
  amount!: number;

  @ApiProperty({ example: 'CDF', enum: SUPPORTED_CURRENCIES })
  @IsIn(SUPPORTED_CURRENCIES, { message: 'Currency must be one of: CDF, USD, XOF, EUR, XAF (ISO 4217)' })
  @IsNotEmpty()
  currency!: SupportedCurrency;

  @ApiProperty({ enum: TelecomCode, example: TelecomCode.AM })
  @IsEnum(TelecomCode)
  telecom!: TelecomCode;

  @ApiProperty({ enum: ['merchant', 'client'], required: false, default: 'merchant' })
  @IsIn(['merchant', 'client'])
  @IsOptional()
  channel?: 'merchant' | 'client' = 'merchant';

  @ApiProperty({ required: false, description: 'Optional client reference for idempotency or tracing' })
  @IsString()
  @IsOptional()
  clientReference?: string;
}
