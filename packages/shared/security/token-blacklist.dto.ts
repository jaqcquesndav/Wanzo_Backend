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
  userId!: string; // Added definite assignment assertion

  @IsString()
  @IsNotEmpty()
  jti!: string; // JWT ID - Added definite assignment assertion

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  expiresAt!: Date; // Added definite assignment assertion

  @IsString()
  @IsOptional()
  reason?: string;
}
