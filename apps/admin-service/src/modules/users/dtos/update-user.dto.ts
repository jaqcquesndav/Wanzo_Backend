import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../entities/enums/user-status.enum';

// DTO pour la mise à jour partielle d'un utilisateur
export class UpdateUserDto {
  @ApiProperty({
    description: 'Nom complet de l\'utilisateur',
    example: 'Utilisateur Modifié',
    required: false
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Statut de l\'utilisateur',
    example: 'active',
    enum: UserStatus,
    required: false
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({
    description: 'URL de l\'avatar',
    example: 'https://example.com/avatar.png',
    required: false
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+243987654321',
    required: false
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Département',
    example: 'Support Client',
    required: false
  })
  @IsString()
  @IsOptional()
  departement?: string;

  @ApiProperty({
    description: 'Poste / Position',
    example: 'Senior Manager',
    required: false
  })
  @IsString()
  @IsOptional()
  position?: string;
}
