import { IsString, IsEmail, IsEnum, IsArray, IsObject, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstitutionType, LicenseType, RegulatoryStatus } from '../entities/institution.entity';

class DocumentDto {
  @ApiProperty({ description: 'Document name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Document type' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Document URL' })
  @IsString()
  url!: string;
}

export class CreateInstitutionDto {
  @ApiProperty({ description: 'Institution name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Institution type', enum: InstitutionType })
  @IsEnum(InstitutionType)
  type!: InstitutionType;

  @ApiProperty({ description: 'License number' })
  @IsString()
  licenseNumber!: string;

  @ApiProperty({ description: 'License type', enum: LicenseType })
  @IsEnum(LicenseType)
  licenseType!: LicenseType;

  @ApiProperty({ description: 'Institution address' })
  @IsString()
  address!: string;

  @ApiProperty({ description: 'Contact phone' })
  @IsString()
  phone!: string;

  @ApiProperty({ description: 'Contact email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Website URL' })
  @IsString()
  website!: string;

  @ApiProperty({ description: 'Legal representative name' })
  @IsString()
  legalRepresentative!: string;

  @ApiProperty({ description: 'Tax ID' })
  @IsString()
  taxId!: string;

  @ApiProperty({ description: 'Regulatory status', enum: RegulatoryStatus })
  @IsEnum(RegulatoryStatus)
  regulatoryStatus!: RegulatoryStatus;

  @ApiProperty({ description: 'Required documents', type: [DocumentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents!: DocumentDto[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateInstitutionDto {
  @ApiPropertyOptional({ description: 'Institution name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Institution type', enum: InstitutionType })
  @IsOptional()
  @IsEnum(InstitutionType)
  type?: InstitutionType;

  @ApiPropertyOptional({ description: 'License type', enum: LicenseType })
  @IsOptional()
  @IsEnum(LicenseType)
  licenseType?: LicenseType;

  @ApiPropertyOptional({ description: 'Institution address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Legal representative name' })
  @IsOptional()
  @IsString()
  legalRepresentative?: string;

  @ApiPropertyOptional({ description: 'Regulatory status', enum: RegulatoryStatus })
  @IsOptional()
  @IsEnum(RegulatoryStatus)
  regulatoryStatus?: RegulatoryStatus;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CompleteInstitutionProfileDto extends UpdateInstitutionDto {
  @ApiProperty({ description: 'External institution ID from auth service' })
  @IsString()
  externalId!: string;
}