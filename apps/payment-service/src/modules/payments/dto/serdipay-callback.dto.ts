import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SerdiPayCallbackDto {
  @ApiProperty({ example: 200 })
  @IsNumber()
  status!: number;

  @ApiProperty({ example: 'La reference de la transaction' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({ type: Object })
  payment!: {
    status: 'success' | 'failed' | string;
    sessionId?: string;
    sessionStatus?: number;
    transactionId?: string;
  amount?: number;
  currency?: string;
  };
}
