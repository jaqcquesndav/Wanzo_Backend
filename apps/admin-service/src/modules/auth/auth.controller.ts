import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { LoginDto, LoginResponseDto, TwoFactorLoginResponseDto, RegisterDto, RegisterResponseDto, RefreshTokenDto, RefreshTokenResponseDto, ForgotPasswordDto, ForgotPasswordResponseDto, ResetPasswordDto, ResetPasswordResponseDto, ChangePasswordDto, ChangePasswordResponseDto, SetupTwoFactorDto, SetupTwoFactorResponseDto, VerifyTwoFactorDto, VerifyTwoFactorResponseDto, BackupCodesResponseDto, KsAuthAuthorizeResponseDto, KsAuthCallbackDto, KsAuthCallbackResponseDto, KsAuthLogoutResponseDto, UserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

// Augmentation du type Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface User {
      id: string;
      [key: string]: any;
    }
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto | TwoFactorLoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('logout')
  async logout(@Req() req: Request): Promise<KsAuthLogoutResponseDto> { // Changed return type
    // Implementation depends on how sessions/tokens are managed
    // For JWT, usually involves client-side token removal or server-side blocklisting
    return this.authService.logout(req.user.id); // Pass req.user.id
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: Request) {
    return req.user;
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    return this.authService.refresh(refreshTokenDto);
  }

  @Post('2fa/setup')
  @UseGuards(AuthGuard('jwt'))
  async setupTwoFactor(@Req() req: Request, @Body() setupTwoFactorDto: SetupTwoFactorDto): Promise<SetupTwoFactorResponseDto> {
    return this.authService.setupTwoFactor(req.user.id, setupTwoFactorDto);
  }

  @Post('2fa/verify')
  async verifyTwoFactor(@Body() verifyTwoFactorDto: VerifyTwoFactorDto): Promise<VerifyTwoFactorResponseDto> {
    return this.authService.verifyTwoFactor(verifyTwoFactorDto);
  }

  @Post('2fa/backup-codes')
  @UseGuards(AuthGuard('jwt'))
  async generateBackupCodes(@Req() req: Request): Promise<BackupCodesResponseDto> {
    return this.authService.generateBackupCodes(req.user.id);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}

@Controller('users') // Assuming change password is under users as per docs
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(@Req() req: Request, @Body() changePasswordDto: ChangePasswordDto): Promise<ChangePasswordResponseDto> {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }
}

@Controller('auth/ks')
export class KsAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('authorize')
  async ksAuthorize(): Promise<KsAuthAuthorizeResponseDto> {
    return this.authService.ksAuthorize();
  }

  @Post('callback')
  async ksCallback(@Body() ksAuthCallbackDto: KsAuthCallbackDto): Promise<KsAuthCallbackResponseDto> {
    return this.authService.ksCallback(ksAuthCallbackDto);
  }

  @Post('logout')
  async ksLogout(): Promise<KsAuthLogoutResponseDto> {
    return this.authService.ksLogout();
  }
}
