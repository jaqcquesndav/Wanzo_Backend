import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsArray, IsBoolean, IsDateString } from 'class-validator';
import { AdminStatus, ComplianceRating, ProfileType } from '../entities/customer-detailed-profile.entity';

/**
 * DTO pour les profils détaillés de clients
 */
export class CustomerDetailedProfileDto {
  @ApiProperty({ description: 'Profile ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Original customer ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Profile type', enum: ProfileType })
  @IsEnum(ProfileType)
  profileType: ProfileType;

  @ApiProperty({ description: 'Profile data (JSON)' })
  profileData: any;

  @ApiProperty({ description: 'Profile completeness percentage', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  profileCompleteness: number;

  @ApiProperty({ description: 'Admin status', enum: AdminStatus })
  @IsEnum(AdminStatus)
  adminStatus: AdminStatus;

  @ApiProperty({ description: 'Compliance rating', enum: ComplianceRating })
  @IsEnum(ComplianceRating)
  complianceRating: ComplianceRating;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Risk flags' })
  @IsOptional()
  @IsArray()
  riskFlags?: string[];

  @ApiProperty({ description: 'Needs resync flag' })
  @IsBoolean()
  needsResync: boolean;

  @ApiProperty({ description: 'Last sync timestamp' })
  @IsDateString()
  lastSyncAt: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @IsDateString()
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Last review timestamp' })
  @IsOptional()
  @IsDateString()
  lastReviewedAt?: Date;

  @ApiPropertyOptional({ description: 'Reviewed by user ID' })
  @IsOptional()
  @IsString()
  reviewedBy?: string;
}

/**
 * DTO pour la liste des profils détaillés
 */
export class CustomerDetailedProfileListDto {
  @ApiProperty({ type: [CustomerDetailedProfileDto], description: 'List of detailed profiles' })
  profiles: CustomerDetailedProfileDto[];

  @ApiProperty({ description: 'Total number of profiles' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

/**
 * DTO pour les paramètres de requête des profils détaillés
 */
export class ProfileQueryParamsDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by profile type', enum: ProfileType })
  @IsOptional()
  @IsEnum(ProfileType)
  profileType?: ProfileType;

  @ApiPropertyOptional({ description: 'Filter by admin status', enum: AdminStatus })
  @IsOptional()
  @IsEnum(AdminStatus)
  adminStatus?: AdminStatus;

  @ApiPropertyOptional({ description: 'Filter by compliance rating', enum: ComplianceRating })
  @IsOptional()
  @IsEnum(ComplianceRating)
  complianceRating?: ComplianceRating;

  @ApiPropertyOptional({ description: 'Filter profiles needing resync' })
  @IsOptional()
  @IsBoolean()
  needsResync?: boolean;

  @ApiPropertyOptional({ description: 'Minimum completeness percentage' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minCompleteness?: number;

  @ApiPropertyOptional({ description: 'Maximum completeness percentage' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxCompleteness?: number;

  @ApiPropertyOptional({ description: 'Search in profile data or admin notes' })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * DTO pour mettre à jour le statut d'un profil
 */
export class UpdateProfileStatusDto {
  @ApiPropertyOptional({ description: 'New admin status', enum: AdminStatus })
  @IsOptional()
  @IsEnum(AdminStatus)
  adminStatus?: AdminStatus;

  @ApiPropertyOptional({ description: 'New compliance rating', enum: ComplianceRating })
  @IsOptional()
  @IsEnum(ComplianceRating)
  complianceRating?: ComplianceRating;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Risk flags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riskFlags?: string[];
}

/**
 * DTO pour les statistiques des profils
 */
export class ProfileStatisticsDto {
  @ApiProperty({ description: 'Total number of profiles' })
  totalProfiles: number;

  @ApiProperty({ description: 'Profiles by type' })
  profilesByType: {
    company: number;
    institution: number;
  };

  @ApiProperty({ description: 'Profiles by admin status' })
  profilesByAdminStatus: {
    under_review: number;
    validated: number;
    flagged: number;
    suspended: number;
    archived: number;
  };

  @ApiProperty({ description: 'Profiles by compliance rating' })
  profilesByComplianceRating: {
    high: number;
    medium: number;
    low: number;
    critical: number;
  };

  @ApiProperty({ description: 'Average profile completeness' })
  averageCompleteness: number;

  @ApiProperty({ description: 'Profiles needing resync' })
  profilesNeedingResync: number;

  @ApiProperty({ description: 'Recently updated profiles' })
  recentlyUpdated: number;
}