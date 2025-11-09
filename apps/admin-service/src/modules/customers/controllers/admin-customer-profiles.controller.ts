import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  ForbiddenException,
  ParseUUIDPipe
} from '@nestjs/common';
import { JwtBlacklistGuard } from '@/modules/auth/guards/jwt-blacklist.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from '../services';
import { User } from '@/modules/users/entities/user.entity';
import {
  AdminCustomerProfileDto,
  AdminCustomerProfileListDto,
  AdminCustomerProfileDetailsDto,
  AdminProfileActionDto,
  AdminProfileQueryDto,
  AdminDashboardStatsDto
} from '../dtos/admin-customer-profile.dto';

/**
 * CONTRÔLEUR ADMIN KYC POUR LA GESTION DES PROFILS CLIENTS
 * 
 * PRINCIPES KYC & ADMINISTRATION SYSTÈME :
 * ✅ Accès COMPLET aux profils clients pour validation KYC
 * ✅ Gestion tokens, abonnements, utilisateurs (administration système)
 * ✅ Validation identité, documents, conformité réglementaire
 * ✅ Monitoring utilisation plateforme et métriques système
 * ✅ Séparation KYC/Administration vs Commercial Operations
 * 
 * WORKFLOWS SUPPORTÉS :
 * - Validation KYC complète (profils, documents, identité)
 * - Gestion abonnements et consommation tokens
 * - Administration utilisateurs clients
 * - Monitoring et métriques système
 * - Actions administratives (validation, suspension, conformité)
 * 
 * DONNÉES INTERDITES (COMMERCIAL OPERATIONS) :
 * ❌ Transactions commerciales des clients
 * ❌ Ventes et chiffres d'affaires clients
 * ❌ Inventaires produits commerciaux clients
 * ❌ Données comptables opérationnelles commerciales
 * ❌ Stratégies business confidentielles clients
 */
@ApiTags('Admin - Customer Profiles Management')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard)
@Controller('admin/customer-profiles')
export class AdminCustomerProfilesController {
  constructor(private readonly customersService: CustomersService) {}

  // ================================================================
  // ENDPOINTS DE CONSULTATION (LECTURE SEULE DES DONNÉES ADMIN)
  // ================================================================
  
  /**
   * Liste tous les profils clients avec données admin autorisées
   * DONNÉES EXPOSÉES : Profils, statuts admin, métriques de gestion
   * DONNÉES CACHÉES : Informations commerciales, financières sensibles
   */
  @Get()
  @ApiOperation({ 
    summary: 'List customer profiles (admin view)',
    description: 'Returns paginated list of customer profiles with admin-safe data only. Commercial data is not accessible to admin users.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns paginated customer profiles with admin data',
    type: AdminCustomerProfileListDto 
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'customerType', required: false, enum: ['PME', 'FINANCIAL_INSTITUTION'] })
  @ApiQuery({ name: 'adminStatus', required: false, description: 'Filter by admin status' })
  @ApiQuery({ name: 'complianceRating', required: false, description: 'Filter by compliance rating' })
  @ApiQuery({ name: 'requiresAttention', required: false, type: 'boolean' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  async listProfiles(
    @Query() queryParams: AdminProfileQueryDto,
    @CurrentUser() user: User
  ): Promise<AdminCustomerProfileListDto> {
    // Conversion des paramètres vers le format service existant
    const serviceParams = {
      page: queryParams.page || 1,
      limit: queryParams.limit || 10,
      customerType: queryParams.customerType,
      adminStatus: queryParams.adminStatus,
      complianceRating: queryParams.complianceRating,
      requiresAttention: queryParams.requiresAttention,
      needsResync: queryParams.needsResync,
      minCompleteness: queryParams.minCompleteness,
      search: queryParams.search
    };

    const result = await this.customersService.findAll(serviceParams);
    
    // Transformation vers le format admin-safe
    return {
      items: result.items.map(item => this.transformToAdminDto(item)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  }

  /**
   * Récupère les détails d'un profil client spécifique
   * WORKFLOW : Admin sélectionne un client pour révision/action
   */
  @Get(':customerId')
  @ApiOperation({ 
    summary: 'Get customer profile details (admin view)',
    description: 'Returns detailed customer profile with admin-relevant data, statistics, and recent activities.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns customer profile with admin data',
    type: AdminCustomerProfileDetailsDto 
  })
  @ApiParam({ name: 'customerId', description: 'Customer unique identifier' })
  async getProfileDetails(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @CurrentUser() user: User
  ): Promise<AdminCustomerProfileDetailsDto> {
    const result = await this.customersService.findOne(customerId);
    
    return {
      profile: this.transformToAdminDto(result.customer),
      statistics: {
        documentsCount: result.statistics?.documentsCount,
        activitiesCount: result.statistics?.activitiesCount,
        lastActivity: result.statistics?.lastActivity?.toISOString(),
        // Ajouter plans et abonnements quand disponibles
      },
      recentActivities: result.activities?.map(activity => ({
        id: activity.id,
        type: activity.type,
        action: activity.action,
        description: activity.description,
        performedAt: activity.performedAt,
        performedBy: activity.performedBy
      })),
      // Documents uniquement admin-relevant
      documents: result.customer.documents?.filter(doc => 
        ['kyc', 'compliance', 'admin'].includes(doc.type)
      ).map(doc => ({
        id: doc.id,
        type: doc.type,
        fileName: doc.fileName,
        status: doc.status,
        uploadedAt: doc.uploadedAt
      }))
    };
  }

  // ================================================================
  // ENDPOINTS D'ACTIONS ADMINISTRATIVES
  // ================================================================
  
  /**
   * Validation d'un profil client (action admin)
   * WORKFLOW : Admin valide un profil après révision
   */
  @Put(':customerId/validate')
  @ApiOperation({ 
    summary: 'Validate customer profile',
    description: 'Admin action to validate a customer profile. Updates admin status and compliance rating.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile validated successfully',
    type: AdminCustomerProfileDto 
  })
  @ApiParam({ name: 'customerId', description: 'Customer unique identifier' })
  @HttpCode(HttpStatus.OK)
  async validateProfile(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @CurrentUser() user: User
  ): Promise<AdminCustomerProfileDto> {
    const result = await this.customersService.validateCustomer(customerId);
    return this.transformToAdminDto(result);
  }

  /**
   * Suspension d'un profil client (action admin)
   * WORKFLOW : Admin suspend un profil pour non-conformité
   */
  @Put(':customerId/suspend')
  @ApiOperation({ 
    summary: 'Suspend customer profile',
    description: 'Admin action to suspend a customer profile for compliance or security reasons.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile suspended successfully',
    type: AdminCustomerProfileDto 
  })
  @ApiParam({ name: 'customerId', description: 'Customer unique identifier' })
  @HttpCode(HttpStatus.OK)
  async suspendProfile(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() suspendData: { reason: string },
    @CurrentUser() user: User
  ): Promise<AdminCustomerProfileDto> {
    const result = await this.customersService.suspendCustomer(customerId, suspendData.reason);
    return this.transformToAdminDto(result);
  }

  /**
   * Réactivation d'un profil suspendu
   * WORKFLOW : Admin réactive un profil après résolution des problèmes
   */
  @Put(':customerId/reactivate')
  @ApiOperation({ 
    summary: 'Reactivate suspended customer profile',
    description: 'Admin action to reactivate a previously suspended customer profile.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile reactivated successfully',
    type: AdminCustomerProfileDto 
  })
  @ApiParam({ name: 'customerId', description: 'Customer unique identifier' })
  @HttpCode(HttpStatus.OK)
  async reactivateProfile(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @CurrentUser() user: User
  ): Promise<AdminCustomerProfileDto> {
    const result = await this.customersService.reactivateCustomer(customerId);
    return this.transformToAdminDto(result);
  }

  /**
   * Mise à jour du statut administratif
   * WORKFLOW : Admin change le statut/compliance d'un profil
   */
  @Put(':customerId/admin-status')
  @ApiOperation({ 
    summary: 'Update customer admin status',
    description: 'Update admin-specific fields: status, compliance rating, notes, risk flags.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Admin status updated successfully',
    type: AdminCustomerProfileDto 
  })
  @ApiParam({ name: 'customerId', description: 'Customer unique identifier' })
  @HttpCode(HttpStatus.OK)
  async updateAdminStatus(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() updateData: AdminProfileActionDto,
    @CurrentUser() user: User
  ): Promise<AdminCustomerProfileDto> {
    // TODO: Implémenter updateProfileAdminStatus dans le service
    throw new Error('Method not implemented yet - requires service update');
  }

  // ================================================================
  // ENDPOINTS DE MONITORING ET STATISTIQUES
  // ================================================================
  
  /**
   * Tableau de bord admin avec statistiques agrégées
   * WORKFLOW : Vue d'ensemble pour les admins
   */
  @Get('dashboard/statistics')
  @ApiOperation({ 
    summary: 'Get admin dashboard statistics',
    description: 'Returns aggregated statistics for admin dashboard: profile counts, status distribution, alerts.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns admin dashboard statistics',
    type: AdminDashboardStatsDto 
  })
  async getDashboardStats(
    @CurrentUser() user: User
  ): Promise<AdminDashboardStatsDto> {
    const stats = await this.customersService.getStatistics();
    
    return {
      totalProfiles: stats.totalCustomers,
      profilesByType: {
        PME: stats.customersByType?.pme || 0,
        FINANCIAL_INSTITUTION: stats.customersByType?.financial || 0
      },
      profilesByAdminStatus: {
        under_review: stats.customersByStatus?.pending || 0,
        validated: stats.customersByStatus?.active || 0,
        flagged: stats.customersByStatus?.flagged || 0,
        suspended: stats.customersByStatus?.suspended || 0,
        archived: stats.customersByStatus?.archived || 0,
        requires_attention: stats.customersRequiringAttention || 0
      },
      profilesByComplianceRating: {
        high: stats.complianceDistribution?.high || 0,
        medium: stats.complianceDistribution?.medium || 0,
        low: stats.complianceDistribution?.low || 0,
        critical: stats.complianceDistribution?.critical || 0
      },
      averageCompleteness: stats.averageCompleteness || 0,
      urgentProfiles: stats.urgentReviews || 0,
      profilesNeedingResync: stats.profilesNeedingResync || 0,
      recentlyUpdated: stats.recentlyUpdated || 0,
      systemHealth: {
        syncLatency: stats.avgSyncLatency || 0,
        pendingActions: stats.pendingActions || 0,
        systemAlerts: stats.systemAlerts || 0
      }
    };
  }

  // ================================================================
  // ENDPOINTS INTERDITS (SÉCURITÉ)
  // ================================================================
  
  /**
   * CRÉATION DE CLIENTS - INTERDIT POUR ADMIN
   * Les admins ne peuvent pas créer de clients, cela doit passer par customer-service
   */
  @ApiOperation({ 
    summary: 'FORBIDDEN - Customer creation not allowed for admin',
    description: 'Admin users cannot create customers. Use customer-service endpoints.'
  })
  createCustomer(): never {
    throw new ForbiddenException(
      'Customer creation is not allowed for admin users. Use customer-service API for business operations.'
    );
  }

  /**
   * MODIFICATION DONNÉES BUSINESS - INTERDIT POUR ADMIN
   * Les admins ne peuvent modifier que les données administratives
   */
  @ApiOperation({ 
    summary: 'FORBIDDEN - Business data modification not allowed for admin',
    description: 'Admin users cannot modify business data. Use customer-service endpoints.'
  })
  updateBusinessData(): never {
    throw new ForbiddenException(
      'Business data modification is not allowed for admin users. Use customer-service API for business operations.'
    );
  }

  // ================================================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ================================================================
  
  /**
   * Transforme les données du service vers le format admin-safe
   * SÉCURITÉ : Filtre les données sensibles, garde seulement les données admin
   */
  private transformToAdminDto(customerData: any): AdminCustomerProfileDto {
    return {
      id: customerData.id,
      customerId: customerData.customerId || customerData.id,
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone ? this.anonymizePhone(customerData.phone) : undefined,
      customerType: customerData.type === 'pme' ? 'PME' : 'FINANCIAL_INSTITUTION',
      profileType: customerData.profileType,
      logo: customerData.logo,
      status: customerData.status,
      accountType: customerData.accountType,
      
      // Données administratives
      adminStatus: customerData.adminStatus,
      complianceRating: customerData.complianceRating,
      profileCompleteness: customerData.profileCompleteness || 0,
      adminNotes: customerData.adminNotes,
      riskFlags: customerData.riskFlags,
      reviewPriority: customerData.reviewPriority || 'medium',
      requiresAttention: customerData.requiresAttention || false,
      
      // Métadonnées
      needsResync: customerData.needsResync || false,
      lastSyncAt: customerData.lastSyncAt || customerData.updatedAt,
      lastReviewedAt: customerData.lastReviewedAt,
      reviewedBy: customerData.reviewedBy,
      
      // Métriques autorisées (sans valeurs monétaires)
      financialMetrics: customerData.financialMetrics ? {
        totalAssetsCount: customerData.financialMetrics.assetsCount,
        lastAssetsUpdate: customerData.financialMetrics.lastAssetsUpdate,
        totalStockItems: customerData.financialMetrics.totalItems,
        lastStockUpdate: customerData.financialMetrics.lastStockUpdate
      } : undefined,
      
      alerts: customerData.alerts,
      validationStatus: customerData.validationStatus,
      riskProfile: customerData.riskProfile,
      insights: customerData.insights,
      
      createdAt: customerData.createdAt,
      updatedAt: customerData.updatedAt
    };
  }

  /**
   * Anonymise les numéros de téléphone pour la sécurité
   * Exemple: +243123456789 -> +243****6789
   */
  private anonymizePhone(phone: string): string {
    if (!phone || phone.length < 8) return phone;
    
    const start = phone.substring(0, 4);
    const end = phone.substring(phone.length - 4);
    const middle = '*'.repeat(phone.length - 8);
    
    return `${start}${middle}${end}`;
  }
}