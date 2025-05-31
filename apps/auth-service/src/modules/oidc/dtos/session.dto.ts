import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({ description: 'Session ID' })
  id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Client ID' })
  clientId!: string;

  @ApiProperty({ description: 'Authorized scopes', type: [String] })
  scopes!: string[];

  @ApiProperty({ description: 'Session nonce' })
  nonce!: string;

  @ApiProperty({ description: 'Authentication time' })
  authTime!: Date;

  @ApiProperty({ description: 'User claims' })
  claims!: Record<string, any>;

  @ApiProperty({ description: 'Authentication Context Class Reference' })
  acr?: string;

  @ApiProperty({ description: 'Authentication Methods References' })
  amr?: string[];

  @ApiProperty({ description: 'Session expiration time' })
  expiresAt!: Date;

  @ApiProperty({ description: 'Session creation time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Session last update time' })
  updatedAt!: Date;
}