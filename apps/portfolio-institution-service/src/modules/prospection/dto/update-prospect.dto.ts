import { IsString, IsEnum, IsOptional, IsNumber, IsUrl, IsEmail, Min, Max, ValidateNested, IsArray, IsObject, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { CompanySize, CompanySector, ProspectStatus, PortfolioType } from '../entities/prospect.entity';
import { PartialType } from '@nestjs/mapped-types';
import { CreateProspectDto } from './create-prospect.dto';

export class UpdateProspectDto extends PartialType(CreateProspectDto) {
  @IsEnum(ProspectStatus)
  @IsOptional()
  status?: ProspectStatus;
}
