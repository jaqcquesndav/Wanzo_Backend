import { IsNotEmpty, IsDateString, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFiscalYearDto {
  @ApiProperty({ description: 'Code of the fiscal year (e.g. FY2023)' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: 'Start date of the fiscal year' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ description: 'End date of the fiscal year' })
  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @ApiProperty({ description: 'Optional description for the fiscal year', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
