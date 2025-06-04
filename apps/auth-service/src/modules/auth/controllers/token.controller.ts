import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { JwtAuthGuard } from '../../oidc/guards/jwt-auth.guard'; // Corrected path
import { RolesGuard } from '../../oidc/guards/roles.guard'; // Corrected path
import { Roles } from '../../oidc/decorators/roles.decorator'; // Corrected path

@ApiTags('token')
@Controller('token')
export class TokenController {
  constructor(private readonly tokenBlacklistService: TokenBlacklistService) {}

  @Post('check-blacklist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('service')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Vérifier si un token est dans la liste noire', 
    description: 'Vérifie si un token JWT est dans la liste noire (révoqué). Cette méthode est principalement utilisée par les autres microservices pour valider les tokens.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statut de la vérification du token dans la liste noire',
    schema: {
      type: 'object',
      properties: {
        blacklisted: { type: 'boolean', example: false }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non autorisé - Token invalide ou expiré' })
  @ApiResponse({ status: 403, description: 'Interdit - Rôle insuffisant' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['jti', 'userId'],
      properties: {
        jti: { type: 'string', description: 'JWT ID - Identifiant unique du token', example: '550e8400-e29b-41d4-a716-446655440000' },
        userId: { type: 'string', description: 'ID de l\'utilisateur associé au token', example: 'auth0|123456789' }
      }
    }
  })
  async checkBlacklist(
    @Body() body: { jti: string; userId: string },
  ) {
    const isBlacklisted = await this.tokenBlacklistService.isTokenBlacklisted(
      body.jti,
      body.userId
    );
    
    return {
      blacklisted: isBlacklisted
    };
  }
}
