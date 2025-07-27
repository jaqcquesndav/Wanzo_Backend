import { IsString, IsEnum, IsNotEmpty, IsNumber, Min, Max, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AnalysisType } from '../entities/prospect-analysis.entity';

class CriterionDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  score: number;

  @IsString()
  @IsNotEmpty()
  notes: string;
}

class RecommendationDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  priority: string;

  @IsString()
  @IsNotEmpty()
  timeline: string;
}

export class CreateAnalysisDto {
  @IsEnum(AnalysisType)
  type: AnalysisType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterionDto)
  criteria: CriterionDto[];

  @IsNumber()
  @Min(0)
  @Max(10)
  overallScore: number;

  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsArray()
  @IsString({ each: true })
  strengths: string[];

  @IsArray()
  @IsString({ each: true })
  weaknesses: string[];

  @IsArray()
  @IsString({ each: true })
  opportunities: string[];

  @IsArray()
  @IsString({ each: true })
  threats: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecommendationDto)
  recommendations: RecommendationDto[];
}
