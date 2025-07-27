import { IsString, IsEnum, IsDate, IsNotEmpty, IsObject, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignType, CampaignStatus } from '../entities/campaign.entity';

class CampaignTargetDto {
  @IsArray()
  @IsString({ each: true })
  sectors: string[];

  @IsArray()
  @IsString({ each: true })
  regions: string[];

  @IsNumber()
  minRevenue: number;

  @IsNumber()
  maxRevenue: number;

  @IsString()
  companySize: string;
}

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(CampaignType)
  type: CampaignType;

  @IsEnum(CampaignStatus)
  status: CampaignStatus;

  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsObject()
  @ValidateNested()
  @Type(() => CampaignTargetDto)
  target: CampaignTargetDto;
}
