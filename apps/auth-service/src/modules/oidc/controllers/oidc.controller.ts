import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OIDCService } from '../services/oidc.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

interface TokenRequest {
  grant_type: string;
  code: string;
  client_id: string;
  client_secret: string;
}

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

@ApiTags('oauth')
@Controller()
export class OIDCController {
  constructor(private readonly oidcService: OIDCService) {}

  @Get('.well-known/openid-configuration')
  @ApiOperation({ 
    summary: 'Récupérer la configuration OpenID Connect', 
    description: 'Fournit les métadonnées de configuration OpenID Connect pour la découverte automatique par les clients.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration OpenID récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        issuer: { type: 'string', example: 'https://auth.wanzo.com' },
        authorization_endpoint: { type: 'string', example: 'https://auth.wanzo.com/oauth/authorize' },
        token_endpoint: { type: 'string', example: 'https://auth.wanzo.com/oauth/token' },
        userinfo_endpoint: { type: 'string', example: 'https://auth.wanzo.com/oauth/userinfo' },
        jwks_uri: { type: 'string', example: 'https://auth.wanzo.com/.well-known/jwks.json' },
        response_types_supported: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['code', 'token', 'id_token', 'code token', 'code id_token'] 
        },
        subject_types_supported: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['public'] 
        },
        id_token_signing_alg_values_supported: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['RS256'] 
        },
        scopes_supported: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['openid', 'profile', 'email', 'offline_access'] 
        },
        token_endpoint_auth_methods_supported: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['client_secret_post', 'client_secret_basic'] 
        },
        claims_supported: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['sub', 'iss', 'name', 'email', 'role', 'permissions'] 
        }
      }
    }
  })
  async getOpenIDConfiguration(): Promise<Record<string, any>> {
    return await this.oidcService.getOpenIDConfiguration();
  }

  @Post('oauth/token')
  @ApiOperation({ 
    summary: 'Échanger un code d\'autorisation contre des tokens', 
    description: 'Endpoint standard OAuth2 pour échanger un code d\'autorisation contre des tokens d\'accès et de rafraîchissement.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Échange de token réussi',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' },
        token_type: { type: 'string', example: 'Bearer' },
        expires_in: { type: 'number', example: 3600 },
        refresh_token: { type: 'string', example: 'def50200abc...' },
        id_token: { type: 'string', example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Requête invalide',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'invalid_request' },
        error_description: { type: 'string', example: 'Le code d\'autorisation est invalide ou a expiré' }
      }
    }
  })
  async token(@Body() tokenRequest: TokenRequest): Promise<Record<string, any>> {
    const { grant_type, code, client_id, client_secret } = tokenRequest;

    const client = await this.oidcService.validateClient(client_id, client_secret);
    if (!client) {
      throw new Error('Invalid client');
    }

    return this.oidcService.generateTokens('user-123', client_id, ['openid', 'profile']);
  }

  @Get('oauth/userinfo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Récupérer les informations de l\'utilisateur actuel', 
    description: 'Endpoint standard OpenID Connect pour récupérer les informations de l\'utilisateur associé au token d\'accès.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Informations utilisateur récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        sub: { type: 'string', example: 'auth0|61234567890', description: 'Identifiant unique de l\'utilisateur' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        role: { type: 'string', example: 'admin' },
        permissions: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['read:users', 'write:users', 'delete:users'] 
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token invalide ou expiré',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'invalid_token' },
        error_description: { type: 'string', example: 'Le token d\'accès est invalide ou a expiré' }
      }
    }
  })
  async userinfo(@Req() req: AuthenticatedRequest): Promise<Record<string, any>> {
    return {
      sub: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      permissions: req.user.permissions,
    };
  }
}