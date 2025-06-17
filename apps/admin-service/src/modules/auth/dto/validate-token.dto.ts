import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { UserProfileDto } from './user-profile.dto';

export class ValidateTokenResponseDto {
  @ApiProperty({
    description: 'Indique si le token est valide',
    example: true,
  })
  @IsBoolean()
  isValid: boolean;

  @ApiProperty({
    description: "Informations de l'utilisateur si le token est valide",
    type: UserProfileDto,
  })
  @IsObject()
  @IsOptional()
  user?: UserProfileDto;

  @ApiProperty({
    description: "Message d'erreur si le token est invalide",
    example: "Token invalide ou expiré",
    required: false,
  })
  @IsString()
  @IsOptional()
  error?: string;
}
