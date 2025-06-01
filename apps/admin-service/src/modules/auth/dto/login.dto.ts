import { UserDto } from './user.dto';

export class LoginDto {
  email!: string;
  password!: string;
}

export class LoginResponseDto {
  token!: string;
  user!: UserDto;
}

export class TwoFactorLoginResponseDto {
  requiresTwoFactor!: boolean;
  twoFactorMethods!: string[];
  tempToken!: string;
}
