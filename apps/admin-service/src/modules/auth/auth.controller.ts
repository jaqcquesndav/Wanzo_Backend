import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { LoginDto, LoginResponseDto, TwoFactorLoginResponseDto, RegisterDto, RegisterResponseDto, RefreshTokenDto, RefreshTokenResponseDto, ForgotPasswordDto, ForgotPasswordResponseDto, ResetPasswordDto, ResetPasswordResponseDto, ChangePasswordDto, ChangePasswordResponseDto, SetupTwoFactorDto, SetupTwoFactorResponseDto, VerifyTwoFactorDto, VerifyTwoFactorResponseDto, BackupCodesResponseDto, KsAuthAuthorizeResponseDto, KsAuthCallbackDto, KsAuthCallbackResponseDto, KsAuthLogoutResponseDto, UserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

// Augmentation du type Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface User {
      id: string;
      [key: string]: any;
    }
  }
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ 
    summary: 'Authentification utilisateur', 
    description: 'Authentifie un utilisateur et renvoie un token JWT. Si l\'authentification à deux facteurs est activée, une étape supplémentaire sera nécessaire.'
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'Identifiants de connexion de l\'utilisateur'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Authentification réussie',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            access_token: { type: 'string', example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refresh_token: { type: 'string', example: 'def50200abc...' },
            user: { 
              type: 'object',
              properties: {
                id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
                email: { type: 'string', example: 'user@example.com' },
                name: { type: 'string', example: 'John Doe' },
                role: { type: 'string', example: 'admin' }
              }
            }
          }
        },
        {
          type: 'object',
          properties: {
            twoFactorRequired: { type: 'boolean', example: true },
            twoFactorToken: { type: 'string', example: '123456789' }
          }
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto | TwoFactorLoginResponseDto> {
    return this.authService.login(loginDto);
  }
  @Post('register')
  @ApiOperation({ 
    summary: 'Enregistrement d\'un nouvel utilisateur', 
    description: 'Crée un nouveau compte utilisateur et entreprise dans le système'
  })
  @ApiBody({ 
    type: RegisterDto,
    description: 'Données d\'enregistrement de l\'utilisateur et de son entreprise'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Utilisateur créé avec succès',
    type: RegisterResponseDto
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Email ou nom d\'entreprise déjà utilisé' })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Déconnexion de l\'utilisateur', 
    description: 'Invalide le token JWT en l\'ajoutant à la liste noire'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Déconnexion réussie',
    type: KsAuthLogoutResponseDto
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async logout(@Req() req: Request): Promise<KsAuthLogoutResponseDto> { 
    return this.authService.logout(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Récupérer le profil de l\'utilisateur connecté', 
    description: 'Renvoie les informations de l\'utilisateur actuellement authentifié'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profil récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        email: { type: 'string', example: 'user@example.com' },
        name: { type: 'string', example: 'John Doe' },
        role: { type: 'string', example: 'admin' },
        permissions: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['read:users', 'write:users'] 
        },
        companyId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async me(@Req() req: Request) {
    return req.user;
  }
  @Post('refresh')
  @ApiOperation({ 
    summary: 'Rafraîchir le token d\'accès', 
    description: 'Utilise un token de rafraîchissement pour générer un nouveau token d\'accès'
  })
  @ApiBody({ 
    type: RefreshTokenDto,
    description: 'Token de rafraîchissement'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token rafraîchi avec succès',
    type: RefreshTokenResponseDto
  })
  @ApiResponse({ status: 401, description: 'Token de rafraîchissement invalide ou expiré' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    return this.authService.refresh(refreshTokenDto);
  }

  @Post('2fa/setup')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Configurer l\'authentification à deux facteurs', 
    description: 'Initialise l\'authentification à deux facteurs pour l\'utilisateur connecté'
  })
  @ApiBody({ 
    type: SetupTwoFactorDto,
    description: 'Paramètres pour la configuration 2FA'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration 2FA initialisée avec succès',
    type: SetupTwoFactorResponseDto
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async setupTwoFactor(@Req() req: Request, @Body() setupTwoFactorDto: SetupTwoFactorDto): Promise<SetupTwoFactorResponseDto> {
    return this.authService.setupTwoFactor(req.user.id, setupTwoFactorDto);
  }
  @Post('2fa/verify')
  @ApiOperation({ 
    summary: 'Vérifier le code d\'authentification à deux facteurs', 
    description: 'Vérifie le code 2FA fourni par l\'utilisateur'
  })
  @ApiBody({ 
    type: VerifyTwoFactorDto,
    description: 'Code 2FA et informations associées'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Code 2FA vérifié avec succès',
    type: VerifyTwoFactorResponseDto
  })
  @ApiResponse({ status: 400, description: 'Code 2FA invalide' })
  async verifyTwoFactor(@Body() verifyTwoFactorDto: VerifyTwoFactorDto): Promise<VerifyTwoFactorResponseDto> {
    return this.authService.verifyTwoFactor(verifyTwoFactorDto);
  }

  @Post('2fa/backup-codes')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Générer des codes de secours pour l\'authentification à deux facteurs', 
    description: 'Génère des codes de secours à usage unique pour la récupération de compte'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Codes de secours générés avec succès',
    type: BackupCodesResponseDto
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async generateBackupCodes(@Req() req: Request): Promise<BackupCodesResponseDto> {
    return this.authService.generateBackupCodes(req.user.id);
  }

  @Post('forgot-password')
  @ApiOperation({ 
    summary: 'Demander la réinitialisation du mot de passe', 
    description: 'Envoie un email avec un lien de réinitialisation du mot de passe'
  })
  @ApiBody({ 
    type: ForgotPasswordDto,
    description: 'Email de l\'utilisateur'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email de réinitialisation envoyé avec succès',
    type: ForgotPasswordResponseDto
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ 
    summary: 'Réinitialiser le mot de passe', 
    description: 'Réinitialise le mot de passe de l\'utilisateur avec le token reçu par email'
  })
  @ApiBody({ 
    type: ResetPasswordDto,
    description: 'Nouveau mot de passe et token de réinitialisation'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Mot de passe réinitialisé avec succès',
    type: ResetPasswordResponseDto
  })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Changer le mot de passe de l\'utilisateur connecté', 
    description: 'Permet à l\'utilisateur de changer son mot de passe en fournissant l\'ancien et le nouveau'
  })
  @ApiBody({ 
    type: ChangePasswordDto,
    description: 'Ancien et nouveau mot de passe'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Mot de passe changé avec succès',
    type: ChangePasswordResponseDto
  })
  @ApiResponse({ status: 400, description: 'Ancien mot de passe incorrect' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async changePassword(@Req() req: Request, @Body() changePasswordDto: ChangePasswordDto): Promise<ChangePasswordResponseDto> {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }
}

@ApiTags('auth')
@Controller('auth/ks')
export class KsAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('authorize')
  @ApiOperation({ 
    summary: 'Initier le flux d\'autorisation avec Keycloak/SAML', 
    description: 'Démarre le processus d\'authentification SSO avec Keycloak/SAML'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'URL d\'autorisation générée avec succès',
    type: KsAuthAuthorizeResponseDto
  })
  @ApiResponse({ status: 400, description: 'Erreur lors de la génération de l\'URL d\'autorisation' })
  async ksAuthorize(): Promise<KsAuthAuthorizeResponseDto> {
    return this.authService.ksAuthorize();
  }

  @Post('callback')
  @ApiOperation({ 
    summary: 'Callback après authentification Keycloak/SAML', 
    description: 'Endpoint de rappel après une authentification réussie via Keycloak/SAML'
  })
  @ApiBody({ 
    type: KsAuthCallbackDto,
    description: 'Données de callback de l\'authentification'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Authentification SSO réussie',
    type: KsAuthCallbackResponseDto
  })
  @ApiResponse({ status: 400, description: 'Données de callback invalides' })
  async ksCallback(@Body() ksAuthCallbackDto: KsAuthCallbackDto): Promise<KsAuthCallbackResponseDto> {
    return this.authService.ksCallback(ksAuthCallbackDto);
  }

  @Post('logout')
  @ApiOperation({ 
    summary: 'Déconnexion de Keycloak/SAML', 
    description: 'Déconnecte l\'utilisateur de la session Keycloak/SAML'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Déconnexion SSO réussie',
    type: KsAuthLogoutResponseDto
  })
  @ApiResponse({ status: 400, description: 'Erreur lors de la déconnexion' })
  async ksLogout(): Promise<KsAuthLogoutResponseDto> {
    return this.authService.ksLogout();
  }
}
