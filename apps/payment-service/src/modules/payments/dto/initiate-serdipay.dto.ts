import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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

  @ApiProperty({ example: 'CDF' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

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
