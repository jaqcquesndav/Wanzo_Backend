import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsString()
  type!: string;

  @IsString()
  title!: string;

  @IsString()
  message!: string;
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}