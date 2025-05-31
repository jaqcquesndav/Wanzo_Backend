import { IsString, IsEmail, IsArray, IsObject, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class GeolocationDto {
  @ApiProperty({ description: 'Latitude' })
  @IsString()
  latitude!: number;

  @ApiProperty({ description: 'Longitude' })
  @IsString()
  longitude!: number;
}

class AddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  street!: string;

  @ApiProperty({ description: 'Commune' })
  @IsString()
  commune!: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city!: string;

  @ApiProperty({ description: 'Province' })
  @IsString()
  province!: string;

  @ApiPropertyOptional({ description: 'Geolocation data' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeolocationDto)
  geolocation?: GeolocationDto;

  @ApiProperty({ description: 'Address type (e.g., headquarters, branch)' })
  @IsString()
  type!: string;
}

class ContactsDto {
  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Legal representative name' })
  @IsOptional()
  @IsString()
  legalRepresentative?: string;

  @ApiPropertyOptional({ description: 'Legal representative position' })
  @IsOptional()
  @IsString()
  position?: string;
}

export class CreateCompanyDto {
  @ApiProperty({ description: 'Company name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Legal form' })
  @IsOptional()
  @IsString()
  legalForm?: string;

  @ApiPropertyOptional({ description: 'Industry' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'RCCM number' })
  @IsOptional()
  @IsString()
  rccm?: string;

  @ApiPropertyOptional({ description: 'IDNAT number' })
  @IsOptional()
  @IsString()
  idnat?: string;

  @ApiPropertyOptional({ description: 'NIF number' })
  @IsOptional()
  @IsString()
  nif?: string;

  @ApiPropertyOptional({ description: 'CNSS number' })
  @IsOptional()
  @IsString()
  cnss?: string;

  @ApiPropertyOptional({ description: 'Company addresses', type: [AddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];

  @ApiPropertyOptional({ description: 'Company contacts' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ContactsDto)
  contacts?: ContactsDto;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Legal form' })
  @IsOptional()
  @IsString()
  legalForm?: string;

  @ApiPropertyOptional({ description: 'Industry' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'RCCM number' })
  @IsOptional()
  @IsString()
  rccm?: string;

  @ApiPropertyOptional({ description: 'IDNAT number' })
  @IsOptional()
  @IsString()
  idnat?: string;

  @ApiPropertyOptional({ description: 'NIF number' })
  @IsOptional()
  @IsString()
  nif?: string;

  @ApiPropertyOptional({ description: 'CNSS number' })
  @IsOptional()
  @IsString()
  cnss?: string;

  @ApiPropertyOptional({ description: 'Company addresses', type: [AddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];

  @ApiPropertyOptional({ description: 'Company contacts' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ContactsDto)
  contacts?: ContactsDto;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}