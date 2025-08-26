import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de rafraîchissement',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'Nouveau token d\'accès',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;

  @ApiProperty({
    description: 'Nouveau token de rafraîchissement',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Durée de validité du token en secondes',
    example: 3600
  })
  expiresIn: number;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mot de passe actuel',
    example: 'currentPassword123'
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'Nouveau mot de passe',
    example: 'newPassword123'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}

export class Enable2FAResponseDto {
  @ApiProperty({
    description: 'Code QR pour configurer l\'authentification 2FA',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
  })
  qrCode: string;

  @ApiProperty({
    description: 'Secret 2FA à sauvegarder',
    example: 'JBSWY3DPEHPK3PXP'
  })
  secret: string;

  @ApiProperty({
    description: 'Message de confirmation',
    example: '2FA activé avec succès'
  })
  message: string;
}

export class Verify2FADto {
  @ApiProperty({
    description: 'Code à 6 chiffres généré par l\'application d\'authentification',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class Verify2FAResponseDto {
  @ApiProperty({
    description: 'Indique si le code est valide',
    example: true
  })
  valid: boolean;

  @ApiProperty({
    description: 'Message de confirmation',
    example: 'Code 2FA vérifié avec succès'
  })
  message: string;
}
