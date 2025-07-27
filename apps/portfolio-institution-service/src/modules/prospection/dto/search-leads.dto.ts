import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { CompanySector } from '../entities/prospect.entity';

export class SearchLeadsDto {
  @IsArray()
  @IsEnum(CompanySector, { each: true })
  @IsOptional()
  sector?: CompanySector[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  region?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  minRevenue?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxRevenue?: number;

  @IsString()
  @IsOptional()
  companySize?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  growthRate?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  creditScore?: number;
}
