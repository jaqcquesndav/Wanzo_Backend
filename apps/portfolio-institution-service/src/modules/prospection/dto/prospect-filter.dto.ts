import { IsEnum, IsOptional, IsNumber, Min, Max, IsString } from 'class-validator';
import { CompanySize, CompanySector, ProspectStatus } from '../entities/prospect.entity';

export class ProspectFilterDto {
  @IsEnum(CompanySize)
  @IsOptional()
  size?: CompanySize;

  @IsEnum(CompanySector)
  @IsOptional()
  sector?: CompanySector;

  @IsEnum(ProspectStatus)
  @IsOptional()
  status?: ProspectStatus;
  
  @IsString()
  @IsOptional()
  institutionId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  min_revenue?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  max_revenue?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
