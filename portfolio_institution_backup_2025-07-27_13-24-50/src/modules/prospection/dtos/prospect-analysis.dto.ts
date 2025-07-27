import { IsString, IsEnum, IsNumber, IsArray, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnalysisType, AnalysisStatus } from '../entities/prospect-analysis.entity';

class CriterionDto {
  @ApiProperty({ description: 'Criterion category' })
  @IsString()
  category!: string;

  @ApiProperty({ description: 'Criterion weight' })
  @IsNumber()
  weight!: number;

  @ApiProperty({ description: 'Criterion score' })
  @IsNumber()
  score!: number;

  @ApiProperty({ description: 'Evaluation notes' })
  @IsString()
  notes!: string;
}

class RecommendationDto {
  @ApiProperty({ description: 'Recommendation category' })
  @IsString()
  category!: string;

  @ApiProperty({ description: 'Recommendation description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Priority level' })
  @IsString()
  priority!: string;

  @ApiProperty({ description: 'Implementation timeline' })
  @IsString()
  timeline!: string;
}

export class CreateAnalysisDto {
  @ApiProperty({ description: 'Analysis type', enum: AnalysisType })
  @IsEnum(AnalysisType)
  type!: AnalysisType;

  @ApiProperty({ description: 'Evaluation criteria', type: [CriterionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterionDto)
  criteria!: CriterionDto[];

  @ApiProperty({ description: 'Overall analysis score' })
  @IsNumber()
  overallScore!: number;

  @ApiProperty({ description: 'Analysis summary' })
  @IsString()
  summary!: string;

  @ApiProperty({ description: 'Company strengths', type: [String] })
  @IsArray()
  @IsString({ each: true })
  strengths!: string[];

  @ApiProperty({ description: 'Company weaknesses', type: [String] })
  @IsArray()
  @IsString({ each: true })
  weaknesses!: string[];

  @ApiProperty({ description: 'Market opportunities', type: [String] })
  @IsArray()
  @IsString({ each: true })
  opportunities!: string[];

  @ApiProperty({ description: 'Potential threats', type: [String] })
  @IsArray()
  @IsString({ each: true })
  threats!: string[];

  @ApiProperty({ description: 'Recommendations', type: [RecommendationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecommendationDto)
  recommendations!: RecommendationDto[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateAnalysisDto {
  @ApiPropertyOptional({ description: 'Analysis status', enum: AnalysisStatus })
  @IsOptional()
  @IsEnum(AnalysisStatus)
  status?: AnalysisStatus;

  @ApiPropertyOptional({ description: 'Evaluation criteria', type: [CriterionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterionDto)
  criteria?: CriterionDto[];

  @ApiPropertyOptional({ description: 'Overall analysis score' })
  @IsOptional()
  @IsNumber()
  overallScore?: number;

  @ApiPropertyOptional({ description: 'Analysis summary' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: 'Recommendations', type: [RecommendationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecommendationDto)
  recommendations?: RecommendationDto[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AnalysisFilterDto {
  @ApiPropertyOptional({ description: 'Filter by type', enum: AnalysisType })
  @IsOptional()
  @IsEnum(AnalysisType)
  type?: AnalysisType;

  @ApiPropertyOptional({ description: 'Filter by status', enum: AnalysisStatus })
  @IsOptional()
  @IsEnum(AnalysisStatus)
  status?: AnalysisStatus;

  @ApiPropertyOptional({ description: 'Minimum score' })
  @IsOptional()
  @IsNumber()
  minScore?: number;

  @ApiPropertyOptional({ description: 'Maximum score' })
  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}