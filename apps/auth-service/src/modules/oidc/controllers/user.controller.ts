import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../entities/user.entity';

interface PaginatedResponse<T> {
  success: boolean;
  users: T[];
  page: number;
  perPage: number;
  total: number;
}

interface UserResponse {
  success: boolean;
  user: User;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('admin', 'superadmin')
  @ApiOperation({ 
    summary: 'Récupérer tous les utilisateurs', 
    description: 'Récupère une liste paginée de tous les utilisateurs. Des filtres peuvent être appliqués pour affiner les résultats.'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Numéro de page pour la pagination (commence à 1)', 
    example: 1 
  })
  @ApiQuery({ 
    name: 'per_page', 
    required: false, 
    type: Number, 
    description: 'Nombre d\'éléments par page', 
    example: 10 
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    type: String, 
    description: 'Terme de recherche pour filtrer les utilisateurs (recherche sur nom, prénom, email)', 
    example: 'john' 
  })
  @ApiQuery({ 
    name: 'companyId', 
    required: false, 
    type: String, 
    description: 'ID de l\'entreprise pour filtrer les utilisateurs appartenant à une entreprise spécifique', 
    example: '550e8400-e29b-41d4-a716-446655440000' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des utilisateurs récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        users: { 
          type: 'array', 
          items: { 
            type: 'object',
            properties: {
              id: { type: 'string', example: 'auth0|61234567890' },
              email: { type: 'string', example: 'john.doe@example.com' },
              name: { type: 'string', example: 'John Doe' },
              role: { type: 'string', example: 'admin' },
              companyId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
              isActive: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time' }
            }
          } 
        },
        page: { type: 'number', example: 1 },
        perPage: { type: 'number', example: 10 },
        total: { type: 'number', example: 42 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non autorisé - Token invalide ou expiré' })
  @ApiResponse({ status: 403, description: 'Interdit - Rôle insuffisant' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Query('search') search?: string,
    @Query('companyId') companyId?: string,
    @Req() req?: any,
  ): Promise<PaginatedResponse<User>> {
    // Si l'utilisateur est un superadmin d'entreprise, filtrer par son entreprise
    if (req.user.role === 'superadmin' && !req.user.isSystemAdmin) {
      companyId = req.user.companyId;
    }

    const result = await this.userService.findAll(+page, +perPage, search, companyId);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findOne(@Param('id') id: string, @Req() req?: any): Promise<UserResponse> {
    const user = await this.userService.findById(id);
    
    // Vérifier que l'utilisateur a le droit de voir cet utilisateur
    if (req.user.role !== 'admin' && req.user.id !== id) {
      // Si c'est un superadmin, vérifier qu'il appartient à la même entreprise
      if (req.user.role === 'superadmin' && user.companyId !== req.user.companyId) {
        throw new UnauthorizedException('Vous n\'êtes pas autorisé à voir cet utilisateur');
      }
    }
    
    return {
      success: true,
      user,
    };
  }

  @Post()
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(@Body() createUserDto: CreateUserDto, @Req() req?: any): Promise<UserResponse> {
    // Si l'utilisateur est un superadmin d'entreprise, forcer l'entreprise
    if (req.user.role === 'superadmin' && !req.user.isSystemAdmin) {
      createUserDto.companyId = req.user.companyId;
    }
    
    // Vérifier que le rôle est valide selon le rôle de l'utilisateur actuel
    if (req.user.role === 'superadmin' && !req.user.isSystemAdmin) {
      // Un superadmin d'entreprise ne peut pas créer d'admin système ou de superadmin
      if (['admin', 'superadmin'].includes(createUserDto.role)) {
        throw new UnauthorizedException('Vous n\'êtes pas autorisé à créer ce type d\'utilisateur');
      }
    }
    
    const user = await this.userService.create(createUserDto);
    return {
      success: true,
      user,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req?: any,
  ): Promise<UserResponse> {
    const existingUser = await this.userService.findById(id);
    
    // Vérifier que l'utilisateur a le droit de modifier cet utilisateur
    if (req.user.role !== 'admin') {
      // Si c'est un superadmin, vérifier qu'il appartient à la même entreprise
      if (req.user.role === 'superadmin') {
        if (existingUser.companyId !== req.user.companyId) {
          throw new UnauthorizedException('Vous n\'êtes pas autorisé à modifier cet utilisateur');
        }
        
        // Un superadmin ne peut pas changer le rôle vers admin ou superadmin
        if (updateUserDto.role && ['admin', 'superadmin'].includes(updateUserDto.role)) {
          throw new UnauthorizedException('Vous n\'êtes pas autorisé à attribuer ce rôle');
        }
      } else if (req.user.id !== id) {
        // Un utilisateur normal ne peut modifier que son propre profil
        throw new UnauthorizedException('Vous n\'êtes pas autorisé à modifier cet utilisateur');
      }
    }
    
    const user = await this.userService.update(id, updateUserDto);
    return {
      success: true,
      user,
    };
  }

  @Delete(':id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async remove(@Param('id') id: string, @Req() req?: any): Promise<DeleteResponse> {
    const existingUser = await this.userService.findById(id);
    
    // Vérifier que l'utilisateur a le droit de supprimer cet utilisateur
    if (req.user.role !== 'admin') {
      // Si c'est un superadmin, vérifier qu'il appartient à la même entreprise
      if (req.user.role === 'superadmin' && existingUser.companyId !== req.user.companyId) {
        throw new UnauthorizedException('Vous n\'êtes pas autorisé à supprimer cet utilisateur');
      }
    }
    
    return await this.userService.delete(id);
  }
}