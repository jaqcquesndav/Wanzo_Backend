import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Nom complet de l\'utilisateur',
    example: 'Jacques Ndavaro',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+243987654321',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Langue préférée',
    example: 'fr',
    required: false,
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({
    description: 'Fuseau horaire',
    example: 'Africa/Kinshasa',
    required: false,
  })
  @IsString()
  @IsOptional()
  timezone?: string;
}
