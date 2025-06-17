import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean, IsUUID, MinLength } from 'class-validator';
import { UserRole, UserType } from '../../auth/dto/user-profile.dto';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nom complet de l\'utilisateur',
    example: 'Nouvel Utilisateur'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Adresse e-mail de l\'utilisateur',
    example: 'nouvel.utilisateur@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mot de passe de l\'utilisateur',
    example: 'securePassword123',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Rôle de l\'utilisateur',
    example: 'customer_support',
    enum: UserRole
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Type d\'utilisateur',
    example: 'internal',
    enum: UserType
  })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({
    description: 'ID du compte client (requis pour les utilisateurs externes)',
    example: 'pme-123',
    required: false
  })
  @IsString()
  @IsOptional()
  customerAccountId?: string;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+243123456789',
    required: false
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Créer un utilisateur dans Auth0',
    example: true,
    required: false,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  createInAuth0?: boolean;

  @ApiProperty({
    description: 'Envoyer une invitation à l\'utilisateur',
    example: true,
    required: false,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  sendInvitation?: boolean;

  @ApiProperty({
    description: 'Département',
    example: 'Client Services',
    required: false
  })
  @IsString()
  @IsOptional()
  departement?: string;
}
