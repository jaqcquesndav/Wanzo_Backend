import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCurrencyDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  symbol?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  exchangeRate?: number;
}

export class ExchangeRateDto {
  @ApiProperty()
  @IsString()
  currencyCode!: string;

  @ApiProperty()
  @IsNumber()
  exchangeRate!: number;
}

export class UpdateExchangeRatesDto {
  @ApiProperty({ type: [ExchangeRateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExchangeRateDto)
  rates!: ExchangeRateDto[];
}

export class SetDefaultCurrencyDto {
  @ApiProperty()
  @IsString()
  currencyCode!: string;
}
