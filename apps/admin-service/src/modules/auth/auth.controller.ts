import { Controller, Post, Body, Get, UseGuards, Req, Headers, Put, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { 
  ValidateTokenResponseDto, 
  UpdateProfileDto, 
  UserProfileDto,
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
}
