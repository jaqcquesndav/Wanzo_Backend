import { UserDto } from './user.dto';

export class SetupTwoFactorDto {
  method!: 'email' | 'sms';
  contact!: string;
}

export class SetupTwoFactorResponseDto {
  qrCode?: string;
  secret?: string;
}

export class VerifyTwoFactorDto {
  code!: string;
  method!: 'email' | 'sms' | 'app';
  tempToken?: string;
}

export class VerifyTwoFactorResponseDto {
  token?: string;
  user?: UserDto;
  message?: string;
}

export class BackupCodesResponseDto {
  backupCodes!: string[];
}
