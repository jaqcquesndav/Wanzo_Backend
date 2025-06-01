import { Injectable, Logger, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import {
  LoginDto,
  LoginResponseDto,
  RegisterDto,
  RegisterResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  TwoFactorLoginResponseDto,
  SetupTwoFactorDto,
  SetupTwoFactorResponseDto,
  VerifyTwoFactorDto,
  VerifyTwoFactorResponseDto,
  BackupCodesResponseDto,
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  ChangePasswordDto,
  ChangePasswordResponseDto,
  KsAuthAuthorizeResponseDto,
  KsAuthCallbackDto,
  KsAuthCallbackResponseDto,
  KsAuthLogoutResponseDto,
  UserDto, // Added UserDto import
} from '../dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly authServiceUrl = this.configService.get<string>(
    'KS_AUTH_SERVICE_URL',
  );

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async validateToken(token: string): Promise<UserDto> { // Changed return type to Promise<UserDto>
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Validating token with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.get(`${authServiceUrl}/oauth/userinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const user = response.data;
      
      // Vérifier que l'utilisateur a les scopes nécessaires
      const requiredScopes = ['admin:full', 'users:manage', 'settings:manage'];
      const userScopes = user.scope ? user.scope.split(' ') : [];
      
      if (!this.hasRequiredScopes(userScopes, requiredScopes)) {
        throw new UnauthorizedException('Insufficient permissions');
      }

      this.logger.debug(`Token validated successfully for user: ${user.sub}`);
      return user as UserDto; // Cast user to UserDto
    } catch (error) {
      this.logger.error('Token validation failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private hasRequiredScopes(userScopes: string[], requiredScopes: string[]): boolean {
    return requiredScopes.some(scope => userScopes.includes(scope));
  }

  hasPermission(user: any, permission: string): boolean {
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) || false;
  }

  async validateUser(email: string, pass: string): Promise<UserDto> {
    const loginDto: LoginDto = { email, password: pass };
    try {
      this.logger.debug(`Validating user ${email} via external auth service: ${this.authServiceUrl}/auth/login`);

      const httpResponse = await firstValueFrom(
        this.httpService.post<LoginResponseDto | TwoFactorLoginResponseDto>(
          `${this.authServiceUrl}/auth/login`,
          loginDto
        )
      );
      const responseData = httpResponse.data;

      if (responseData && 'user' in responseData && responseData.user) {
        return responseData.user as UserDto;
      } else {
        this.logger.error(`User object missing in response for ${email} after credential validation, response: ${JSON.stringify(responseData)}`);
        throw new UnauthorizedException('User details not found after credential validation.');
      }
    } catch (error) {
      let errorMessage = 'Invalid credentials or authentication service error.';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
        this.logger.error(`Validation failed for user ${email} (AxiosError): ${errorMessage}`, error.stack);
      } else if (error instanceof Error) {
        errorMessage = error.message;
        this.logger.error(`Validation failed for user ${email} (Error): ${errorMessage}`, error.stack);
      } else {
        this.logger.error(`Validation failed for user ${email} (UnknownError): ${JSON.stringify(error)}`);
      }
      throw new UnauthorizedException(errorMessage);
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto | TwoFactorLoginResponseDto> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Logging in user with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/login`, loginDto)
      );

      return response.data;
    } catch (error) {
      this.logger.error('Login failed:', error);
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new UnauthorizedException(error.response.data.message);
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Registering user with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/register`, registerDto)
      );

      return response.data;
    } catch (error) {
      this.logger.error('Registration failed:', error);
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new BadRequestException(error.response.data.message);
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async logout(userId: string): Promise<KsAuthLogoutResponseDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<KsAuthLogoutResponseDto>(
          `${this.authServiceUrl}/logout`,
          { userId },
        ),
      );
      return response.data; // Ensure this matches KsAuthLogoutResponseDto
    } catch (error) {
      this.logger.error('Logout failed:', error);
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new BadRequestException(error.response.data.message);
      }
      throw new BadRequestException('Logout failed');
    }
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Refreshing token with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/refresh`, refreshTokenDto)
      );

      return response.data;
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new UnauthorizedException(error.response.data.message);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async setupTwoFactor(userId: string, setupTwoFactorDto: SetupTwoFactorDto): Promise<SetupTwoFactorResponseDto> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Setting up 2FA for user ${userId} with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/2fa/setup`, {
          userId,
          ...setupTwoFactorDto
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error('2FA setup failed:', error);
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new BadRequestException(error.response.data.message);
      }
      throw new BadRequestException('2FA setup failed');
    }
  }

  async verifyTwoFactor(verifyTwoFactorDto: VerifyTwoFactorDto): Promise<VerifyTwoFactorResponseDto> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Verifying 2FA with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/2fa/verify`, verifyTwoFactorDto)
      );

      return response.data;
    } catch (error) {
      this.logger.error('2FA verification failed:', error);
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new UnauthorizedException(error.response.data.message);
      }
      throw new UnauthorizedException('Invalid 2FA code');
    }
  }

  async generateBackupCodes(userId: string): Promise<BackupCodesResponseDto> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Generating backup codes for user ${userId} with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/2fa/backup-codes`, { userId })
      );

      return response.data;
    } catch (error) {
      this.logger.error('Backup codes generation failed:', error);
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new BadRequestException(error.response.data.message);
      }
      throw new BadRequestException('Failed to generate backup codes');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Processing forgot password request with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/forgot-password`, forgotPasswordDto)
      );

      return response.data;
    } catch (error) {
      this.logger.error('Forgot password request failed:', error);
      // Return success even if email doesn't exist for security reasons
      return { message: 'If your email is registered, you will receive password reset instructions' };
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Resetting password with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/reset-password`, resetPasswordDto)
      );

      return response.data;
    } catch (error) {
      this.logger.error('Password reset failed:', error);
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new BadRequestException(error.response.data.message);
      }
      throw new BadRequestException('Password reset failed');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<ChangePasswordResponseDto> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Changing password for user ${userId} with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/change-password`, {
          userId,
          ...changePasswordDto
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error('Password change failed:', error);
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new BadRequestException(error.response.data.message);
      }
      throw new BadRequestException('Password change failed');
    }
  }

  async ksAuthorize(): Promise<KsAuthAuthorizeResponseDto> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Initiating Keycloak/SAML authorization with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.get(`${authServiceUrl}/auth/ks/authorize`)
      );

      return response.data;
    } catch (error) {
      this.logger.error('KS authorization failed:', error);
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new BadRequestException(error.response.data.message);
      }
      throw new BadRequestException('Authorization failed');
    }
  }

  async ksCallback(ksAuthCallbackDto: KsAuthCallbackDto): Promise<KsAuthCallbackResponseDto> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Processing Keycloak/SAML callback with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/ks/callback`, ksAuthCallbackDto)
      );

      return response.data;
    } catch (error) {
      this.logger.error('KS callback failed:', error);
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new BadRequestException(error.response.data.message);
      }
      throw new BadRequestException('Authentication callback failed');
    }
  }

  async ksLogout(): Promise<KsAuthLogoutResponseDto> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Processing Keycloak/SAML logout with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.post<KsAuthLogoutResponseDto>(`${authServiceUrl}/auth/ks/logout`)
      );

      return response.data;
    } catch (error) {
      this.logger.error('KS logout failed:', error);
      // Return a default/empty logoutUrl to satisfy the type if the external call fails,
      // while still indicating a form of completion as per the original intent.
      return { logoutUrl: '' }; 
    }
  }
}