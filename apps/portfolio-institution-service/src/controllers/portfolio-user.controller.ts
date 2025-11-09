import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  RequirePortfolioUser,
  RequireActiveUser,
  RequireUserRole,
  CheckFeatureAccess,
  BusinessFeature 
} from '@wanzobe/shared';
import { PortfolioUserService } from '../services/portfolio-user.service';
import { CreatePortfolioUserDto, UpdatePortfolioUserDto, PortfolioUserQueryDto } from '../dto/portfolio-user.dto';

@ApiTags('portfolio-users')
@ApiBearerAuth()
@Controller('portfolio-users')
@UseGuards(JwtAuthGuard)
export class PortfolioUserController {
  constructor(private readonly portfolioUserService: PortfolioUserService) {}

  /**
   * Ajouter un utilisateur au portefeuille
   * Consomme 1 crédit d'utilisateur de portefeuille
   */
  @Post()
  @RequirePortfolioUser(1)
  @ApiOperation({ 
    summary: 'Ajouter un utilisateur au portefeuille',
    description: 'Ajoute un nouvel utilisateur au portefeuille institution. Consomme 1 crédit d\'utilisateur de portefeuille.'
  })
  async addPortfolioUser(@Body() createDto: CreatePortfolioUserDto) {
    return this.portfolioUserService.addUser(createDto);
  }

  /**
   * Activer un utilisateur
   * Consomme 1 crédit d'utilisateur actif global
   */
  @Post(':id/activate')
  @RequireActiveUser(1)
  @ApiOperation({ 
    summary: 'Activer un utilisateur',
    description: 'Active un utilisateur dans le système. Consomme 1 crédit d\'utilisateur actif global.'
  })
  async activateUser(@Param('id') id: string) {
    return this.portfolioUserService.activateUser(id);
  }

  /**
   * Créer un nouveau rôle personnalisé
   * Consomme 1 crédit de rôle personnalisé
   */
  @Post('roles')
  @RequireUserRole(1)
  @ApiOperation({ 
    summary: 'Créer un rôle personnalisé',
    description: 'Crée un nouveau rôle personnalisé pour les utilisateurs. Consomme 1 crédit de rôle personnalisé.'
  })
  async createCustomRole(@Body() roleData: any) {
    return this.portfolioUserService.createCustomRole(roleData);
  }

  /**
   * Vérifier l'accès aux fonctionnalités avancées
   * Vérification seulement, ne consomme pas
   */
  @Get('advanced-analytics/access-check')
  @CheckFeatureAccess(BusinessFeature.ADVANCED_ANALYTICS_FEATURES, {
    customErrorMessage: 'Fonctionnalités d\'analyse avancée non disponibles dans votre plan'
  })
  @ApiOperation({ summary: 'Vérifier l\'accès aux analyses avancées' })
  async checkAdvancedAnalyticsAccess() {
    return { hasAccess: true, message: 'Accès aux analyses avancées confirmé' };
  }

  /**
   * Vérifier l'accès aux outils de conformité
   * Vérification seulement, ne consomme pas
   */
  @Get('compliance-tools/access-check')
  @CheckFeatureAccess(BusinessFeature.COMPLIANCE_MONITORING_TOOLS, {
    customErrorMessage: 'Outils de conformité non disponibles dans votre plan'
  })
  @ApiOperation({ summary: 'Vérifier l\'accès aux outils de conformité' })
  async checkComplianceToolsAccess() {
    return { hasAccess: true, message: 'Accès aux outils de conformité confirmé' };
  }

  /**
   * Récupérer les utilisateurs du portefeuille
   * Lecture gratuite
   */
  @Get()
  @ApiOperation({ summary: 'Récupérer les utilisateurs du portefeuille' })
  async getPortfolioUsers(@Query() query: PortfolioUserQueryDto) {
    // Si institutionId est fourni dans la query, l'utiliser, sinon retourner tous les utilisateurs
    if (query.institutionId) {
      return this.portfolioUserService.getUsers(query.institutionId);
    }
    // Pour une implémentation complète, on pourrait avoir une méthode findAll()
    return this.portfolioUserService.findAll();
  }

  /**
   * Récupérer un utilisateur par ID
   * Lecture gratuite
   */
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  async getUser(@Param('id') id: string) {
    return this.portfolioUserService.getUser(id);
  }

  /**
   * Mettre à jour un utilisateur
   * Ne consomme pas de crédit supplémentaire
   */
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  async updateUser(@Param('id') id: string, @Body() updateDto: UpdatePortfolioUserDto) {
    return this.portfolioUserService.updateUser(id, updateDto);
  }

  /**
   * Supprimer un utilisateur du portefeuille
   * Libère les crédits associés
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur du portefeuille' })
  async removeUser(@Param('id') id: string) {
    return this.portfolioUserService.removeUser(id);
  }

  /**
   * Désactiver un utilisateur
   * Libère le crédit d'utilisateur actif
   */
  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Désactiver un utilisateur' })
  async deactivateUser(@Param('id') id: string) {
    return this.portfolioUserService.deactivateUser(id);
  }

  /**
   * Récupérer les rôles disponibles
   * Lecture gratuite
   */
  @Get('roles/available')
  @ApiOperation({ summary: 'Récupérer les rôles disponibles' })
  async getAvailableRoles() {
    return this.portfolioUserService.getAvailableRoles();
  }

  /**
   * Assigner un rôle à un utilisateur
   * Ne consomme pas de crédit si le rôle existe déjà
   */
  @Post(':userId/assign-role/:roleId')
  @ApiOperation({ summary: 'Assigner un rôle à un utilisateur' })
  async assignRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.portfolioUserService.assignRole(userId, roleId);
  }

  /**
   * Retirer un rôle d'un utilisateur
   * Ne consomme pas de crédit
   */
  @Delete(':userId/remove-role/:roleId')
  @ApiOperation({ summary: 'Retirer un rôle d\'un utilisateur' })
  async removeRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.portfolioUserService.removeRole(userId, roleId);
  }
}