import { 
  IsString, 
  IsOptional, 
  IsEmail, 
  IsObject, 
  IsArray, 
  ValidateNested,
  IsEnum,
  IsNumber,
  ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LegalForm, LocationType } from '../entities/company.entity';

// Shared DTO types
export class CoordinatesDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: -4.325
  })
  @IsNumber()
  lat: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 15.322
  })
  @IsNumber()
  lng: number;
}

export class AddressDto {
  @ApiProperty({
    description: 'Street address',
    example: '123 Innovation Drive'
  })
  @IsString()
  street: string;

  @ApiProperty({
    description: 'City',
    example: 'Kinshasa'
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Province',
    example: 'Kinshasa'
  })
  @IsString()
  province: string;

  @ApiProperty({
    description: 'Commune',
    example: 'Gombe'
  })
  @IsString()
  commune: string;

  @ApiProperty({
    description: 'Quartier',
    example: 'Centre-ville'
  })
  @IsString()
  quartier: string;

  @ApiProperty({
    description: 'Geographic coordinates',
    type: CoordinatesDto
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;
}

export class LocationDto {
  @ApiProperty({
    description: 'Location address',
    example: '456 Business Avenue, Kinshasa'
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Geographic coordinates',
    type: CoordinatesDto
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;

  @ApiProperty({
    description: 'Location type',
    example: 'headquarters',
    enum: LocationType
  })
  @IsEnum(LocationType)
  type: LocationType;
}

export class DocumentsDto {
  @ApiProperty({
    description: 'URL to RCCM document',
    example: 'https://cdn.wanzo.com/docs/rccm.pdf',
    required: false
  })
  @IsString()
  @IsOptional()
  rccmFile?: string;

  @ApiProperty({
    description: 'URL to National ID document',
    example: 'https://cdn.wanzo.com/docs/national_id.pdf',
    required: false
  })
  @IsString()
  @IsOptional()
  nationalIdFile?: string;

  @ApiProperty({
    description: 'URL to Tax Number document',
    example: 'https://cdn.wanzo.com/docs/tax.pdf',
    required: false
  })
  @IsString()
  @IsOptional()
  taxNumberFile?: string;

  @ApiProperty({
    description: 'URL to CNSS document',
    example: 'https://cdn.wanzo.com/docs/cnss.pdf',
    required: false
  })
  @IsString()
  @IsOptional()
  cnssFile?: string;
}

// Response DTOs
export class CompanyProfileDto {
  @ApiProperty({
    description: 'Unique identifier for the company',
    example: 'wanzo_singleton_id'
  })
  id: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Wanzo Inc.'
  })
  name: string;

  @ApiProperty({
    description: 'RCCM number',
    example: 'CD/KIN/RCCM/123456'
  })
  rccmNumber: string;

  @ApiProperty({
    description: 'National ID number',
    example: 'NAT12345'
  })
  nationalId: string;

  @ApiProperty({
    description: 'Tax number',
    example: 'TAX12345'
  })
  taxNumber: string;

  @ApiProperty({
    description: 'CNSS number',
    example: 'CNSS12345',
    required: false
  })
  cnssNumber?: string;

  @ApiProperty({
    description: 'URL to company logo',
    example: 'https://cdn.wanzo.com/logo.png',
    required: false
  })
  logo?: string;

  @ApiProperty({
    description: 'Legal form of the company',
    example: 'SARL',
    enum: LegalForm,
    required: false
  })
  legalForm?: LegalForm;

  @ApiProperty({
    description: 'Business sector',
    example: 'Technologies et télécommunications',
    required: false
  })
  businessSector?: string;

  @ApiProperty({
    description: 'Company description',
    example: 'Wanzo provides cutting-edge solutions for enterprise needs.',
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'Company address',
    type: AddressDto
  })
  address: AddressDto;

  @ApiProperty({
    description: 'Company locations',
    type: [LocationDto]
  })
  locations: LocationDto[];

  @ApiProperty({
    description: 'Company documents',
    type: DocumentsDto
  })
  documents: DocumentsDto;

  @ApiProperty({
    description: 'Company contact email',
    example: 'info@wanzo.com'
  })
  contactEmail: string;

  @ApiProperty({
    description: 'Company contact phone numbers',
    example: ['+243123456789', '+243987654321']
  })
  contactPhone: string[];

  @ApiProperty({
    description: 'Company representative name',
    example: 'John Doe'
  })
  representativeName: string;

  @ApiProperty({
    description: 'Company representative role',
    example: 'CEO'
  })
  representativeRole: string;

  @ApiProperty({
    description: 'Date when the company profile was updated',
    example: '2023-05-01T12:00:00Z'
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Date when the company profile was created',
    example: '2020-01-15T09:00:00Z'
  })
  createdAt: string;
}

// Request DTOs
export class UpdateCompanyProfileDto {
  @ApiProperty({
    description: 'Company name',
    example: 'Wanzo Solutions SARL'
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Company description',
    example: 'Leader dans les solutions technologiques en RDC',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Legal form of the company',
    example: 'SARL',
    enum: LegalForm,
    required: false
  })
  @IsEnum(LegalForm)
  @IsOptional()
  legalForm?: LegalForm;

  @ApiProperty({
    description: 'Business sector',
    example: 'Technologies et télécommunications',
    required: false
  })
  @IsString()
  @IsOptional()
  businessSector?: string;

  @ApiProperty({
    description: 'Company address',
    type: AddressDto,
    required: false
  })
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @ApiProperty({
    description: 'Company contact email',
    example: 'support@wanzo.com',
    required: false
  })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({
    description: 'Company contact phone numbers',
    example: ['+243123456789', '+243555666777'],
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @IsOptional()
  contactPhone?: string[];

  @ApiProperty({
    description: 'Company representative name',
    example: 'Jane Smith',
    required: false
  })
  @IsString()
  @IsOptional()
  representativeName?: string;

  @ApiProperty({
    description: 'Company representative role',
    example: 'Directrice Générale',
    required: false
  })
  @IsString()
  @IsOptional()
  representativeRole?: string;
}

export class AddLocationDto {
  @ApiProperty({
    description: 'Location address',
    example: '789 Branch Street, Lubumbashi'
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Geographic coordinates',
    type: CoordinatesDto
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;

  @ApiProperty({
    description: 'Location type',
    example: 'site',
    enum: LocationType
  })
  @IsEnum(LocationType)
  type: LocationType;
}

export class UpdateLocationDto {
  @ApiProperty({
    description: 'Location address',
    example: '789 Updated Street, Lubumbashi'
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Geographic coordinates',
    type: CoordinatesDto,
    required: false
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsOptional()
  coordinates?: CoordinatesDto;

  @ApiProperty({
    description: 'Location type',
    example: 'store',
    enum: LocationType,
    required: false
  })
  @IsEnum(LocationType)
  @IsOptional()
  type?: LocationType;
}

export class LocationResponseDataDto extends LocationDto {
  @ApiProperty({
    description: 'Unique identifier for the location',
    example: 'loc_12345'
  })
  id: string;

  @ApiProperty({
    description: 'Date when the location was created',
    example: '2023-06-15T10:00:00Z'
  })
  createdAt: string;

  @ApiProperty({
    description: 'Date when the location was last updated',
    example: '2023-06-16T11:30:00Z',
    required: false
  })
  updatedAt?: string;
}

// Response wrapper DTOs
export class CompanyProfileResponseDto {
  data: CompanyProfileDto;
}

export class CompanyUpdateResponseDto {
  message: string;
  data: CompanyProfileDto;
}

export class LogoResponseDto {
  message: string;
  data: {
    logoUrl: string;
  };
}

export class DocumentResponseDto {
  message: string;
  data: {
    documentId: string;
    type: string;
    fileUrl: string;
    uploadedAt: string;
  };
}

export class LocationResponseDto {
  message: string;
  data: LocationResponseDataDto;
}

export class CompanyStatisticsDto {
  activeUsers: number;
  activeCompanies: number;
  activeSubscriptions: number;
  totalRevenue: {
    usd: number;
    cdf: number;
  };
}
