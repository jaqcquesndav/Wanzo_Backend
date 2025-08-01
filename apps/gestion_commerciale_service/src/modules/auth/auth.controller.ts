import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ManagementTokenRequestDto, ManagementTokenResponseDto } from './dto/management-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Inscription d\'un nouvel utilisateur', 
    description: 'Crée un nouvel utilisateur ainsi que son entreprise associée et retourne les tokens d\'authentification'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Utilisateur créé avec succès',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT Access Token' },
        refreshToken: { type: 'string', description: 'JWT Refresh Token' },
        user: { 
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['owner', 'admin', 'manager', 'staff'] },
            companyId: { type: 'string', format: 'uuid' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Données d\'inscription invalides' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Connexion utilisateur', 
    description: 'Authentifie un utilisateur et retourne les tokens d\'authentification'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Authentification réussie',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT Access Token' },
        refreshToken: { type: 'string', description: 'JWT Refresh Token' },
        user: { 
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['owner', 'admin', 'manager', 'staff'] },
            companyId: { type: 'string', format: 'uuid' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Request() req: AuthenticatedRequest, @Body() loginDto: LoginDto) { // Type req and use loginDto
    // req.user is populated by LocalAuthGuard after successful authentication
    // authService.login will handle token generation based on validated loginDto
    return this.authService.login(loginDto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Rafraîchissement du token', 
    description: 'Génère un nouveau token d\'accès à partir d\'un token de rafraîchissement valide'
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Token rafraîchi avec succès',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'Nouveau JWT Access Token' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Token de rafraîchissement invalide ou expiré' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    // Pass the entire DTO object
    return this.authService.refreshToken(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Profil utilisateur', 
    description: 'Récupère les informations du profil de l\'utilisateur actuellement authentifié'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profil récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        phoneNumber: { type: 'string' },
        role: { type: 'string', enum: ['owner', 'admin', 'manager', 'accountant', 'cashier', 'sales', 'inventory_manager', 'staff', 'customer_support'] },
        isActive: { type: 'boolean' },
        profilePictureUrl: { type: 'string', nullable: true },
        companyId: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non autorisé - Token manquant ou invalide' })
  getProfile(@CurrentUser() user: User) {
    // Return user data directly since password is not included in the User interface
    return user;
  }

  @Post('management-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Générer un jeton de gestion', 
    description: 'Génère un jeton limité en portée pour accéder à une ressource spécifique'
  })
  @ApiBody({ type: ManagementTokenRequestDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Jeton de gestion généré avec succès',
    type: ManagementTokenResponseDto
  })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Ressource non trouvée' })
  async generateManagementToken(
    @CurrentUser() user: User,
    @Body() managementTokenRequestDto: ManagementTokenRequestDto
  ): Promise<ManagementTokenResponseDto> {
    return this.authService.generateManagementToken(
      user.id,
      managementTokenRequestDto.resourceId,
      managementTokenRequestDto.resourceType
    );
  }
}
