import { Controller, Get, Post, UseGuards, Req, Res, Query, Body, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Auth0Service } from '../services/auth0.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../oidc/guards/jwt-auth.guard';

interface SignupDto {
  email: string;
  password: string;
  name: string;
  companyName: string;
  companyDetails?: Record<string, any>;
}

interface RefreshTokenDto {
  refresh_token: string;
}

@ApiTags('auth')
@Controller('auth')
export class Auth0Controller {
  private readonly logger = new Logger(Auth0Controller.name);

  constructor(
    private auth0Service: Auth0Service,
    private configService: ConfigService,
  ) {}

  @Get('login')
  @UseGuards(AuthGuard('auth0'))
  @ApiOperation({ summary: 'Initier le flux de login Auth0' })
  @ApiResponse({ status: 302, description: 'Redirection vers Auth0' })
  async login() {
    this.logger.debug('Initiating Auth0 login flow');
    // Cette route redirige vers Auth0
  }

  @Get('callback')
  @ApiOperation({ summary: 'Callback Auth0 après authentification' })
  @ApiResponse({ status: 302, description: 'Redirection vers le frontend avec le code' })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    this.logger.debug(`Auth0 callback received with code: ${code ? 'present' : 'missing'}`);
    
    if (error) {
      this.logger.error(`Auth0 callback error: ${error}, description: ${errorDescription}`);
      throw new UnauthorizedException(errorDescription || error);
    }

    if (!code) {
      this.logger.error('Auth0 callback missing code parameter');
      throw new UnauthorizedException('Code manquant dans le callback');
    }

    // MODIFICATION: Rediriger vers /auth/callback au lieu de la racine
    const redirectUrl = `http://localhost:5173/auth/callback?code=${code}&state=${state || ''}`;
    this.logger.debug(`Redirecting to: ${redirectUrl}`);
    return res.redirect(redirectUrl);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Req() req: any) {
    this.logger.debug(`Getting profile for user: ${req.user?.id}`);
    
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    
    try {
      // If we have a complete user object already, return it
      if (req.user.email && req.user.role) {
        return {
          success: true,
          user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name || '',
            role: req.user.role,
            permissions: req.user.permissions || [],
            companyId: req.user.companyId,
            metadata: req.user.metadata || {}
          }
        };
      }
      
      // Otherwise, fetch additional user details from Auth0
      const userInfo = await this.auth0Service.validateToken(req.headers.authorization.split(' ')[1]);
      
      return {
        success: true,
        user: {
          id: userInfo.sub || req.user.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          role: userInfo.role || req.user.role,
          permissions: userInfo.permissions || req.user.permissions || [],
          companyId: req.user.companyId,
          metadata: userInfo.user_metadata || req.user.metadata || {}
        }
      };
    } catch (error) {
      this.logger.error(`Error retrieving user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new UnauthorizedException('Failed to retrieve user profile');
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refresh_token'],
      properties: {
        refresh_token: { type: 'string' }
      }
    }
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Res() res: Response) {
    this.logger.debug('Token refresh requested');
    
    if (!refreshTokenDto.refresh_token) {
      this.logger.error('Missing refresh_token in refresh request');
      throw new BadRequestException('Refresh token is required');
    }
    
    try {
      const tokens = await this.auth0Service.refreshToken(refreshTokenDto.refresh_token);
      
      this.logger.debug('Token refreshed successfully');
      
      // Update the httpOnly cookie with the new access token
      res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7200000, // 2 hours
      });
      
      return res.json({
        success: true,
        tokens
      });
    } catch (error: any) {
      this.logger.error(`Token refresh error: ${error.message}`);
      return res.status(401).json({
        error: 'invalid_grant',
        message: 'Invalid refresh token',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  @Post('exchange')
  @ApiOperation({ summary: 'Échanger le code d\'autorisation contre des tokens' })
  @ApiResponse({ status: 200, description: 'Tokens générés avec succès' })
  @ApiResponse({ status: 401, description: 'Erreur d\'authentification' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['code', 'code_verifier'],
      properties: {
        code: { type: 'string' },
        code_verifier: { type: 'string' },
        state: { type: 'string' }
      }
    }
  })
  async exchangeAuthCode(
    @Body('code') code: string,
    @Body('state') state: string,
    @Body('code_verifier') codeVerifier: string,
    @Res() res: Response,
  ) {
    this.logger.debug(`Token exchange requested for code: ${code ? 'present' : 'missing'}`);
    
    // Vérification que les paramètres requis sont présents dans le body de la requête
    if (!code || !codeVerifier) {
      this.logger.error('Missing code or code_verifier in token exchange request');
      throw new UnauthorizedException('Code ou code_verifier manquant');
    }
    
    try {
      // Échange du code contre les tokens en passant le code_verifier
      this.logger.debug('Exchanging code for tokens');
      const tokens = await this.auth0Service.exchangeCodeForToken(code, codeVerifier);
      
      this.logger.debug('Tokens successfully obtained');
      
      // Stockage sécurisé du token dans un cookie httpOnly
      res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7200000, // 2 heures
      });
      
      // Retourner les tokens en réponse JSON (ou rediriger vers une autre page si besoin)
      return res.json({
        success: true,
        tokens
      });
    } catch (error: any) {
      this.logger.error(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return res.status(401).json({
        error: 'authentication_error',
        message: 'Une erreur est survenue lors de l\'authentification',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      });
    }
  }

  @Get('logout')
  @ApiOperation({ summary: 'Déconnexion' })
  @ApiResponse({ status: 302, description: 'Redirection vers la page de déconnexion d\'Auth0' })
  async logout(@Res() res: Response) {
    const domain = this.configService.get('auth0.domain');
    const clientId = this.configService.get('auth0.clientId');
    const logoutUrl = this.configService.get('auth0.logoutUrl');

    this.logger.debug(`Logging out user, redirecting to Auth0 logout`);

    // Suppression du cookie d'authentification
    res.clearCookie('access_token');

    // Redirection vers la page de déconnexion d'Auth0
    const returnTo = encodeURIComponent(logoutUrl);
    const redirectUrl = `https://${domain}/v2/logout?client_id=${clientId}&returnTo=${returnTo}`;
    
    this.logger.debug(`Logout redirect URL: ${redirectUrl}`);
    res.redirect(redirectUrl);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Créer un compte initial pour l\'authentification' })
  @ApiResponse({ status: 201, description: 'Compte créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'name', 'companyName'],
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
        name: { type: 'string' },
        companyName: { type: 'string' },
        companyDetails: { 
          type: 'object',
          additionalProperties: true
        }
      }
    }
  })
  async signup(@Body() signupData: SignupDto) {
    this.logger.debug(`Signup request received for email: ${signupData.email}`);
    
    try {
      // Validation des données
      if (!signupData.email || !signupData.password || !signupData.name || !signupData.companyName) {
        this.logger.warn('Signup validation failed: missing required fields');
        throw new BadRequestException('Tous les champs obligatoires doivent être remplis');
      }

      // Création du compte d'authentification initial
      this.logger.debug('Creating initial account');
      const result = await this.auth0Service.createInitialAccount({
        name: signupData.companyName,
        adminEmail: signupData.email,
        adminPassword: signupData.password,
        adminName: signupData.name,
        companyDetails: {
          name: signupData.companyName
        }
      });

      this.logger.debug(`Account created successfully for user ID: ${result.user.user_id}`);

      return {
        success: true,
        message: 'Compte créé avec succès. Veuillez compléter votre profil dans le service d\'administration.',
        user: {
          id: result.user.user_id,
          email: result.user.email,
          name: result.user.name
        },
        companyId: result.companyId
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Gestion des erreurs spécifiques d'Auth0
      if (error.response?.data?.error === 'user_exists') {
        this.logger.warn(`Signup failed: user already exists - ${signupData.email}`);
        throw new BadRequestException('Un utilisateur avec cette adresse email existe déjà');
      }
      
      this.logger.error(`Signup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new BadRequestException('Erreur lors de la création du compte');
    }
  }

  @Get('error')
  @ApiOperation({ summary: 'Page d\'erreur d\'authentification' })
  @ApiResponse({ status: 401, description: 'Erreur d\'authentification' })
  async error(@Res() res: Response) {
    this.logger.debug('Auth error page requested');
    // Page d'erreur personnalisée pour les erreurs d'authentification
    res.status(401).json({
      error: 'authentication_error',
      message: 'Une erreur est survenue lors de l\'authentification',
    });
  }
}
