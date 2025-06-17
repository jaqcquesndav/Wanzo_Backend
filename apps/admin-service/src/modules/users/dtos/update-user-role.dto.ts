import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { UserRole } from '../entities/enums';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Nouveau rôle de l\'utilisateur',
    example: 'content_manager',
    enum: UserRole
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Mettre à jour le rôle dans Auth0',
    example: true,
    required: false,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  updateInAuth0?: boolean;
}
