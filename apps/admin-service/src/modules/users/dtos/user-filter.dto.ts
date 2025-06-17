import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserRole, UserStatus, UserType } from '../entities/enums';

export class UserFilterDto {
  @ApiProperty({
    description: 'Terme de recherche pour filtrer les utilisateurs par nom ou email',
    example: 'jacques',
    required: false
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filtrer par rôle utilisateur',
    example: 'customer_support',
    enum: UserRole,
    required: false
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    description: 'Filtrer par type d\'utilisateur',
    example: 'internal',
    enum: UserType,
    required: false
  })
  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;

  @ApiProperty({
    description: 'Filtrer par ID de compte client',
    example: 'pme-123',
    required: false
  })
  @IsString()
  @IsOptional()
  customerAccountId?: string;

  @ApiProperty({
    description: 'Filtrer par statut utilisateur',
    example: 'active',
    enum: UserStatus,
    required: false
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({
    description: 'Numéro de page pour la pagination',
    example: 1,
    required: false,
    default: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiProperty({
    description: 'Nombre d\'utilisateurs par page',
    example: 10,
    required: false,
    default: 10
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}
