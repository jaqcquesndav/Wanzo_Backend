import { Controller, Post, Body, Get, UseGuards, Req, Headers, Put, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { 
  ValidateTokenResponseDto, 
  UpdateProfileDto, 
  UserProfileDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  ChangePasswordDto,
  Enable2FAResponseDto,
  Verify2FADto,
  Verify2FAResponseDto
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
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

  @Post('validate-token')
  @ApiOperation({ 
    summary: 'Validation du token et enrichissement du profil', 
    description: 'Valide le token JWT fourni par Auth0 et enrichit le profil utilisateur avec des informations supplémentaires'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token valide',
    type: ValidateTokenResponseDto
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré' })
  async validateToken(@Headers('authorization') authHeader: string): Promise<ValidateTokenResponseDto> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant ou format invalide');
    }
    
    const token = authHeader.substring(7); // Enlève 'Bearer ' du header
    return this.authService.validateToken(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Récupérer le profil utilisateur', 
    description: 'Récupère les informations complètes du profil utilisateur'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profil utilisateur récupéré avec succès',
    type: UserProfileDto
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getProfile(@CurrentUser() user: any): Promise<UserProfileDto> {
    return this.authService.getUserProfile(user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Mettre à jour le profil utilisateur', 
    description: 'Met à jour le profil utilisateur dans le backend'
  })
  @ApiBody({ 
    type: UpdateProfileDto,
    description: 'Données de mise à jour du profil utilisateur'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profil utilisateur mis à jour avec succès',
    type: UserProfileDto
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto
  ): Promise<UserProfileDto> {
    return this.authService.updateUserProfile(user.id, updateProfileDto);
  }

  @Post('invalidate-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Invalidation de session', 
    description: 'Invalide la session actuelle côté backend'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session invalidée avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Session invalidée avec succès' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async invalidateSession(@CurrentUser() user: any): Promise<{ message: string }> {
    return this.authService.invalidateSession(user.id);
  }

  @Post('refresh')
  @ApiOperation({ 
    summary: 'Rafraîchissement du token', 
    description: 'Rafraîchit le token JWT en utilisant le refresh token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token rafraîchi avec succès',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré' })
  async refresh(@Body() refreshTokenDto: { refreshToken: string }): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Déconnexion', 
    description: 'Déconnecte l\'utilisateur et invalide ses tokens'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Déconnexion réussie',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Déconnexion réussie' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async logout(@CurrentUser() user: any): Promise<{ message: string }> {
    return this.authService.logout(user.id);
  }

  @Post('password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Changement de mot de passe', 
    description: 'Change le mot de passe de l\'utilisateur connecté'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Mot de passe changé avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Mot de passe changé avec succès' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non authentifié ou ancien mot de passe incorrect' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: { oldPassword: string; newPassword: string }
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, changePasswordDto.oldPassword, changePasswordDto.newPassword);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Activer l\'authentification à deux facteurs', 
    description: 'Active la 2FA pour l\'utilisateur connecté'
  })
  @ApiResponse({ 
    status: 200, 
    description: '2FA activée avec succès',
    schema: {
      type: 'object',
      properties: {
        qrCode: { type: 'string' },
        secret: { type: 'string' },
        message: { type: 'string' }
      }
    }
  })
  async enable2FA(@CurrentUser() user: any): Promise<{ qrCode: string; secret: string; message: string }> {
    return this.authService.enable2FA(user.id);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Désactiver l\'authentification à deux facteurs', 
    description: 'Désactive la 2FA pour l\'utilisateur connecté'
  })
  @ApiResponse({ 
    status: 200, 
    description: '2FA désactivée avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '2FA désactivée avec succès' }
      }
    }
  })
  async disable2FA(
    @CurrentUser() user: any
  ): Promise<{ message: string }> {
    return this.authService.disable2FA(user.id);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Vérifier un code 2FA', 
    description: 'Vérifie un code d\'authentification à deux facteurs'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Code 2FA vérifié avec succès',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async verify2FA(
    @CurrentUser() user: any,
    @Body() verifyDto: { code: string }
  ): Promise<{ valid: boolean; message: string }> {
    return this.authService.verify2FA(user.id, verifyDto.code);
  }
}
