import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ManagementTokenRequestDto {
  @ApiProperty({
    description: 'The identifier of the resource for which the management token is requested',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @ApiProperty({
    description: 'The type of resource for which the management token is requested',
    example: 'document',
    enum: ['document', 'profile', 'settings', 'financing'],
  })
  @IsString()
  @IsNotEmpty()
  resourceType: string;
}

export class ManagementTokenResponseDto {
  @ApiProperty({
    description: 'The generated management token for accessing the specified resource',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'The expiration time of the token in seconds',
    example: 1800, // 30 minutes
  })
  expiresIn: number;

  @ApiProperty({
    description: 'The resource identifier this token is valid for',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  resourceId: string;

  @ApiProperty({
    description: 'The resource type this token is valid for',
    example: 'document',
  })
  resourceType: string;
}
