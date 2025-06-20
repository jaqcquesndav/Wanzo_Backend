import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserService } from '@/modules/auth/services/user.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Récupérer tous les utilisateurs', 
    description: 'Récupère la liste de tous les utilisateurs de l\'organisation'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des utilisateurs récupérée avec succès'
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  async findAll(): Promise<any> {
    const users = await this.userService.findAll();
    return {
      success: true,
      data: users
    };
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Créer un utilisateur', 
    description: 'Crée un nouvel utilisateur dans l\'organisation'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Utilisateur créé avec succès'
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  async create(@Body() createUserDto: any): Promise<any> {
    const user = await this.userService.create(createUserDto);
    return {
      success: true,
      data: user
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Mettre à jour un utilisateur', 
    description: 'Met à jour les informations d\'un utilisateur existant'
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ 
    status: 200, 
    description: 'Utilisateur mis à jour avec succès'
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async update(@Param('id') id: string, @Body() updateUserDto: any): Promise<any> {
    const user = await this.userService.update(id, updateUserDto);
    return {
      success: true,
      data: user
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Supprimer un utilisateur', 
    description: 'Supprime un compte utilisateur'
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ 
    status: 204, 
    description: 'Utilisateur supprimé avec succès'
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.userService.remove(id);
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Activer/Désactiver un utilisateur', 
    description: 'Active ou désactive un compte utilisateur'
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        active: { type: 'boolean' }
      },
      required: ['active']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statut de l\'utilisateur mis à jour avec succès'
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async updateStatus(@Param('id') id: string, @Body('active') active: boolean): Promise<any> {
    const user = await this.userService.updateStatus(id, active);
    return {
      success: true,
      data: user
    };
  }
}
