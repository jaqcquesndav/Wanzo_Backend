import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsEnum, IsBoolean, IsDateString, IsOptional, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { AdhaContextType, ZoneCibleType } from '../entities/adha-context.entity';

export class ZoneCibleDto {
    @ApiProperty({ enum: ZoneCibleType })
    @IsEnum(ZoneCibleType)
    type: ZoneCibleType;

    @ApiProperty()
    @IsString()
    value: string;
}

export class CreateAdhaContextSourceDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    titre: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty({ enum: AdhaContextType })
    @IsEnum(AdhaContextType)
    type: AdhaContextType;

    @ApiProperty({ isArray: true, type: String })
    @IsArray()
    @IsString({ each: true })
    domaine: string[];

    @ApiProperty({ isArray: true, type: ZoneCibleDto })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ZoneCibleDto)
    zoneCible: ZoneCibleDto[];

    @ApiProperty()
    @IsString()
    niveau: string;

    @ApiProperty()
    @IsBoolean()
    canExpire: boolean;

    @ApiProperty()
    @IsDateString()
    dateDebut: string;

    @ApiProperty()
    @IsDateString()
    dateFin: string;

    @ApiProperty()
    @IsString()
    url: string;

    @ApiProperty({ isArray: true, type: String })
    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @ApiProperty()
    @IsBoolean()
    active: boolean;
}

export class UpdateAdhaContextSourceDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    titre?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false, enum: AdhaContextType })
    @IsOptional()
    @IsEnum(AdhaContextType)
    type?: AdhaContextType;

    @ApiProperty({ required: false, isArray: true, type: String })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    domaine?: string[];

    @ApiProperty({ required: false, isArray: true, type: ZoneCibleDto })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ZoneCibleDto)
    zoneCible?: ZoneCibleDto[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    niveau?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    canExpire?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    dateDebut?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    dateFin?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    url?: string;

    @ApiProperty({ required: false, isArray: true, type: String })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    active?: boolean;
}

export class ToggleActiveDto {
    @ApiProperty()
    @IsBoolean()
    active: boolean;
}

export class AdhaContextSourceResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    titre: string;

    @ApiProperty()
    description: string;

    @ApiProperty({ enum: AdhaContextType })
    type: AdhaContextType;

    @ApiProperty({ isArray: true, type: String })
    domaine: string[];

    @ApiProperty({ isArray: true, type: ZoneCibleDto })
    zoneCible: ZoneCibleDto[];

    @ApiProperty()
    niveau: string;

    @ApiProperty()
    canExpire: boolean;

    @ApiProperty()
    dateDebut: string;

    @ApiProperty()
    dateFin: string;

    @ApiProperty()
    url: string;

    @ApiProperty()
    downloadUrl: string;

    @ApiProperty()
    coverImageUrl: string;

    @ApiProperty({ isArray: true, type: String })
    tags: string[];

    @ApiProperty()
    active: boolean;

    @ApiProperty()
    createdAt: string;

    @ApiProperty()
    updatedAt: string;
}

export class AdhaContextPaginatedResponseDto {
    @ApiProperty({ isArray: true, type: AdhaContextSourceResponseDto })
    data: AdhaContextSourceResponseDto[];

    @ApiProperty()
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
}

export class FileUploadResponseDto {
    @ApiProperty()
    url: string;

    @ApiProperty()
    coverImageUrl: string;
}

export class TagSuggestionsResponseDto {
    @ApiProperty({ isArray: true, type: String })
    tags: string[];
}

export class ZoneSuggestionsResponseDto {
    @ApiProperty({ isArray: true, type: ZoneCibleDto })
    zones: ZoneCibleDto[];
}

export class ToggleActiveResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    active: boolean;

    @ApiProperty()
    updatedAt: string;
}

export class AdhaContextQueryDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false, enum: AdhaContextType })
    @IsOptional()
    @IsEnum(AdhaContextType)
    type?: AdhaContextType;

    @ApiProperty({ required: false, isArray: true, type: String })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    domaine?: string[];

    @ApiProperty({ required: false, enum: ZoneCibleType })
    @IsOptional()
    @IsEnum(ZoneCibleType)
    zoneType?: ZoneCibleType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    zoneValue?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    niveau?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    active?: string;

    @ApiProperty({ required: false, isArray: true, type: String })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    expire?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    dateValidite?: string;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    page?: number;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    pageSize?: number;
}
