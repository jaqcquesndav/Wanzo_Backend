import { UserDto } from './user.dto';

export class RegisterDto {
  name!: string;
  email!: string;
  password!: string;
}

export class RegisterResponseDto {
  token!: string;
  user!: UserDto;
}
