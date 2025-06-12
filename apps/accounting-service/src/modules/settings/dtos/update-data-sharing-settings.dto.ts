import { IsBoolean, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderStatus, ProviderType } from '../entities/data-sharing-settings.entity';

export class ProviderDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ProviderType })
  type!: ProviderType;

  @ApiProperty({ enum: ProviderStatus })
  status!: ProviderStatus;
}

export class UpdateDataSharingSettingsDto {
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({ type: [ProviderDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProviderDto)
  @IsOptional()
  providers?: ProviderDto[];
}
