import { UserDto } from './user.dto';

export class KsAuthAuthorizeResponseDto {
  authorizationUrl!: string;
}

export class KsAuthCallbackDto {
  code!: string;
  state?: string;
}

export class KsAuthCallbackResponseDto {
  token!: string;
  user!: UserDto;
}

export class KsAuthLogoutResponseDto {
  logoutUrl!: string;
}
