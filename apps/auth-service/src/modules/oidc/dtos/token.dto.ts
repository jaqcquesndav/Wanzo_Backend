import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ description: 'Access token' })
  access_token!: string;

  @ApiProperty({ description: 'Token type (Bearer)' })
  token_type!: string;

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expires_in!: number;

  @ApiProperty({ description: 'ID token (JWT)' })
  id_token!: string;

  @ApiProperty({ description: 'Refresh token' })
  refresh_token!: string;

  @ApiProperty({ description: 'Authorized scopes (space-separated)' })
  scope!: string;
}

export class TokenErrorDto {
  @ApiProperty({ description: 'Error code' })
  error!: string;

  @ApiProperty({ description: 'Error description' })
  error_description!: string;
}