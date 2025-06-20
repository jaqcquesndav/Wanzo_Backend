import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuditFiscalYearDto {
  @ApiProperty({ description: 'Token to authenticate the auditor' })
  @IsString()
  @IsNotEmpty()
  auditorToken!: string;
}
