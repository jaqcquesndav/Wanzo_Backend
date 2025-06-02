import { 
  IsString, 
  IsOptional, 
  IsDate, 
  IsNotEmpty, 
  IsUUID 
} from 'class-validator';
import { Type } from 'class-transformer';

export class TokenBlacklistDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  jti: string; // JWT ID

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  expiresAt: Date;

  @IsString()
  @IsOptional()
  reason?: string;
}
