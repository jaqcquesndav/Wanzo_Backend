
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class NotificationChannelDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    email?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    browser?: boolean;
}

export class UpdateNotificationsSettingsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => NotificationChannelDto)
    journal_validation?: NotificationChannelDto;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => NotificationChannelDto)
    report_generation?: NotificationChannelDto;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => NotificationChannelDto)
    user_mention?: NotificationChannelDto;
}
