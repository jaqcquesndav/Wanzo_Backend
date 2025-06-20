
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class PasswordPolicyDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    minLength?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    requireUppercase?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    requireNumbers?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    requireSymbols?: boolean;
}

export class UpdateSecuritySettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PasswordPolicyDto)
  passwordPolicy?: PasswordPolicyDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sessionTimeout?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  auditLogRetention?: number;
}
