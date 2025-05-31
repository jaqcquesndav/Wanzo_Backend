import { IsString, IsEnum, IsNumber, IsDate, IsObject, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType, AssetStatus } from '../entities/asset.entity';

class DocumentDto {
  @ApiProperty({ description: 'Document type' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Document URL' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({ description: 'Document validity date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validUntil?: Date;
}

class MaintenanceRecordDto {
  @ApiProperty({ description: 'Maintenance date' })
  @IsDate()
  @Type(() => Date)
  date!: Date;

  @ApiProperty({ description: 'Maintenance type' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Maintenance description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Maintenance cost' })
  @IsNumber()
  cost!: number;

  @ApiProperty({ description: 'Service provider' })
  @IsString()
  provider!: string;
}

class InsuranceInfoDto {
  @ApiProperty({ description: 'Insurance provider' })
  @IsString()
  provider!: string;

  @ApiProperty({ description: 'Policy number' })
  @IsString()
  policyNumber!: string;

  @ApiProperty({ description: 'Coverage details', type: [String] })
  @IsArray()
  @IsString({ each: true })
  coverage!: string[];

  @ApiProperty({ description: 'Policy start date' })
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({ description: 'Policy end date' })
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  @ApiProperty({ description: 'Insurance cost' })
  @IsNumber()
  cost!: number;
}

export class CreateAssetDto {
  @ApiProperty({ description: 'Asset name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Asset type', enum: AssetType })
  @IsEnum(AssetType)
  type!: AssetType;

  @ApiProperty({ description: 'Acquisition value' })
  @IsNumber()
  acquisitionValue!: number;

  @ApiProperty({ description: 'Current value' })
  @IsNumber()
  currentValue!: number;

  @ApiProperty({ description: 'Acquisition date' })
  @IsDate()
  @Type(() => Date)
  acquisitionDate!: Date;

  @ApiProperty({ description: 'Asset specifications' })
  @IsObject()
  specifications!: {
    location?: string;
    dimensions?: string;
    condition?: string;
    documents?: DocumentDto[];
    [key: string]: any;
  };

  @ApiProperty({ description: 'Maintenance history', type: [MaintenanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaintenanceRecordDto)
  maintenanceHistory!: MaintenanceRecordDto[];

  @ApiProperty({ description: 'Insurance information' })
  @ValidateNested()
  @Type(() => InsuranceInfoDto)
  insuranceInfo!: InsuranceInfoDto;
}

export class UpdateAssetDto {
  @ApiPropertyOptional({ description: 'Asset name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Asset status', enum: AssetStatus })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiPropertyOptional({ description: 'Current value' })
  @IsOptional()
  @IsNumber()
  currentValue?: number;

  @ApiPropertyOptional({ description: 'Asset specifications' })
  @IsOptional()
  @IsObject()
  specifications?: {
    location?: string;
    dimensions?: string;
    condition?: string;
    documents?: DocumentDto[];
    [key: string]: any;
  };

  @ApiPropertyOptional({ description: 'Insurance information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InsuranceInfoDto)
  insuranceInfo?: InsuranceInfoDto;
}

export class AssetFilterDto {
  @ApiPropertyOptional({ description: 'Filter by type', enum: AssetType })
  @IsOptional()
  @IsEnum(AssetType)
  type?: AssetType;

  @ApiPropertyOptional({ description: 'Filter by status', enum: AssetStatus })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}