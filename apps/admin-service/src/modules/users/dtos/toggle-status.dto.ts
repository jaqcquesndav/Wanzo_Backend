import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleStatusDto {
  @ApiProperty({
    description: 'The new status of the user account.',
    example: true,
  })
  @IsBoolean()
  active: boolean;
}
