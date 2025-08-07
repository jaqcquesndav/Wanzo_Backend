import { Controller, Post, Body, Get, UseGuards, Req, Headers, Put, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { 
  UpdateProfileDto, 
} from './dto';
import { ValidateTokenResponseDto } from './dto/validate-token.dto';
import { UserProfileDto } from './dto/user-profile.dto';
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

  @Get('verify')
  @ApiOperation({ 
    summary: 'Vérifier le Jeton et Récupérer l\'Utilisateur', 
    description: 'Vérifie la validité du jeton et renvoie les informations de l\'utilisateur correspondant'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Jeton valide',
    type: ValidateTokenResponseDto
  })
  @ApiResponse({ status: 401, description: 'Jeton invalide ou expiré' })
  async verifyToken(@Headers('authorization') authHeader: string): Promise<any> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Jeton manquant ou format invalide');
    }
    
    const token = authHeader.substring(7); // Enlève 'Bearer ' du header
    const result = await this.authService.validateToken(token);
    
    if (!result.isValid) {
      throw new UnauthorizedException('Jeton invalide ou expiré');
    }
    
    return {
      success: true,
      data: {
        user: result.user
      }
    };
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
  async getProfile(@CurrentUser() user: any): Promise<any> {
    const profile = await this.authService.getUserProfile(user.id);
    return {
      success: true,
      data: {
        user: profile
      }
    };
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
  ): Promise<any> {
    const profile = await this.authService.updateUserProfile(user.id, updateProfileDto);
    return {
      success: true,
      data: {
        user: profile
      }
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Déconnexion', 
    description: 'Invalide la session de l\'utilisateur côté backend'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Déconnexion réussie',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async logout(@Headers('authorization') authHeader: string): Promise<any> {
    const token = authHeader.substring(7);
    await this.authService.invalidateSession(token);
    return { success: true };
  }

  @Post('sso')
  @ApiOperation({ 
    summary: 'Connexion avec KS Auth (SSO)', 
    description: 'Initie une connexion via le système SSO interne (KS Auth)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Connexion SSO réussie',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' }
              }
            },
            token: { type: 'string' }
          }
        }
      }
    }
  })
  async ssoLogin(): Promise<any> {
    // Cette méthode serait implémentée pour gérer la connexion SSO
    // Pour l'instant, nous retournons une réponse de simulation
    return {
      success: true,
      data: {
        user: {
          id: 'user-sso-456',
          email: 'employee@wanzo.com',
          name: 'Jane Doe',
          role: 'admin'
        },
        token: '<jwt_token_pour_session>'
      }
    };
  }
}
