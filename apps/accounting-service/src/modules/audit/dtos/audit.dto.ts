import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestAuditTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  registrationNumber!: string;
}

export class ValidateAuditTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;
}
