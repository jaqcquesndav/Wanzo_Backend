import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ApplicationDto {
  @IsString()
  name!: string;

  @IsString()
  access!: string;
}

export class UpdateSubscriptionDto {
  @IsString()
  plan!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationDto)
  applications!: ApplicationDto[];
}