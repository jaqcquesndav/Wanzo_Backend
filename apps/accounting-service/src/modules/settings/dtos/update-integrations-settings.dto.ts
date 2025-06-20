
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsObject, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class GoogleDriveIntegrationDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    linkedAccount?: string | null;
}

class KsPayIntegrationDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    apiKey?: string;
}

class SlackIntegrationDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    webhookUrl?: string | null;
}

export class UpdateIntegrationsSettingsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => GoogleDriveIntegrationDto)
    googleDrive?: GoogleDriveIntegrationDto;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => KsPayIntegrationDto)
    ksPay?: KsPayIntegrationDto;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => SlackIntegrationDto)
    slack?: SlackIntegrationDto;
}
