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

  @Get('verify')
  @ApiOperation({ 
    summary: 'Vérifier le Jeton et Récupérer l\'Utilisateur', 
    description: 'Vérifie la validité du jeton JWT fourni par Auth0 et renvoie les informations de l\'utilisateur correspondant'
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
      throw new UnauthorizedException(result.error || 'Jeton invalide ou expiré');
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

  // Note: Pas d'endpoints invalidate-session ou logout pour les admins Wanzo
  // La révocation des accès admin se fait au niveau Auth0 directement
}
