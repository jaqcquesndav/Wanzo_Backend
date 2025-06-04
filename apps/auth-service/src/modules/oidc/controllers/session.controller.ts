import { Controller, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SessionService } from '../services/session.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OIDCSession } from '../entities/session.entity';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    clientId: string;
  };
}

interface SessionResponse {
  success: boolean;
  sessions?: OIDCSession[];
  message?: string;
}

@ApiTags('sessions')
@ApiBearerAuth('JWT-auth')
@Controller('oauth/sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer les sessions utilisateur',
    description: 'Récupère toutes les sessions actives pour l\'utilisateur authentifié. Permet de surveiller et gérer les connexions actives.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sessions récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        sessions: { 
          type: 'array', 
          items: { 
            type: 'object',
            properties: {
              id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
              userId: { type: 'string', example: 'auth0|61234567890' },
              clientId: { type: 'string', example: 'client123' },
              ip: { type: 'string', example: '192.168.1.1' },
              userAgent: { type: 'string', example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
              expiresAt: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          } 
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non autorisé - Token invalide ou expiré' })
  async getUserSessions(@Req() req: AuthenticatedRequest): Promise<SessionResponse> {
    const sessions = await this.sessionService.findByUserAndClient(
      req.user.id,
      req.user.clientId,
    );
    return {
      success: true,
      sessions,
    };
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Révoquer une session utilisateur', 
    description: 'Révoque une session spécifique pour l\'utilisateur authentifié. Utile pour la déconnexion d\'un appareil spécifique.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique de la session à révoquer',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session révoquée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Session revoked successfully' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session non trouvée ou non autorisée',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Session not found or unauthorized' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non autorisé - Token invalide ou expiré' })
  async revokeSession(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<SessionResponse> {
    const session = await this.sessionService.findById(id);
    
    if (session && session.userId === req.user.id) {
      await this.sessionService.delete(id);
      return {
        success: true,
        message: 'Session revoked successfully',
      };
    }

    return {
      success: false,
      message: 'Session not found or unauthorized',
    };
  }
}