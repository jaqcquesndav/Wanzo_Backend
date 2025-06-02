import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../auth/entities/user.entity';

export class ChangeUserRoleDto {
  @ApiProperty({ enum: UserRole, description: 'The new role for the user', example: UserRole.MANAGER })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
