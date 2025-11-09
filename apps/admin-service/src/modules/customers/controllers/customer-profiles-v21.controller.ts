import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomersService } from '../services/customers.service';
import { CustomerProfileWorkflowService } from '../services/customer-profile-workflow.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

/**
 * Contrôleur pour la gestion des profils clients v2.1
 * Assure la conformité totale avec les structures étendues entreprise et institution
 */
@ApiTags('Customer Profiles v2.1')
@Controller('api/v2.1/customer-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomerProfilesV21Controller {
  private readonly logger = new Logger(CustomerProfilesV21Controller.name);

  constructor(
    private readonly customersService: CustomersService,
    private readonly workflowService: CustomerProfileWorkflowService,
  ) {}

  /**
   * Obtenir tous les profils avec filtres v2.1
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Get all customer profiles with v2.1 enhanced filtering',
    description: 'Retrieve customer profiles with advanced filtering for v2.1 features including risk assessment, compliance rating, and profile completeness'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'customerType', required: false, enum: ['PME', 'FINANCIAL_INSTITUTION'], description: 'Customer type filter' })
  @ApiQuery({ name: 'adminStatus', required: false, description: 'Admin status filter' })
  @ApiQuery({ name: 'complianceRating', required: false, enum: ['high', 'medium', 'low', 'critical'], description: 'Compliance rating filter' })
  @ApiQuery({ name: 'reviewPriority', required: false, enum: ['low', 'medium', 'high', 'urgent'], description: 'Review priority filter' })
  @ApiQuery({ name: 'requiresAttention', required: false, type: Boolean, description: 'Filter profiles requiring attention' })
  @ApiQuery({ name: 'minCompleteness', required: false, type: Number, description: 'Minimum profile completeness percentage' })
  @ApiQuery({ name: 'syncStatus', required: false, description: 'Synchronization status filter' })
  @ApiQuery({ name: 'hasRiskFlags', required: false, type: Boolean, description: 'Filter profiles with risk flags' })
  @ApiQuery({ name: 'dataVersion', required: false, description: 'Data version filter (e.g., "2.1")' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name, email, or notes' })
  @ApiResponse({
    status: 200,
    description: 'Customer profiles retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        profiles: {
          type: 'array',
          items: { type: 'object' }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
        metadata: {
          type: 'object',
          properties: {
            averageCompleteness: { type: 'number' },
            profilesRequiringAttention: { type: 'number' },
            highRiskProfiles: { type: 'number' },
            recentlyUpdated: { type: 'number' },
          }
        }
      }
    }
  })
  async getCustomerProfiles(@Query() query: any) {
    try {
      const profiles = await this.customersService.getCustomerDetailedProfiles({
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 20,
        customerType: query.customerType,
        adminStatus: query.adminStatus,
        reviewPriority: query.reviewPriority,
        requiresAttention: query.requiresAttention === 'true',
        minCompleteness: query.minCompleteness ? parseInt(query.minCompleteness) : undefined,
        syncStatus: query.syncStatus,
        search: query.search,
      });

      // Ajouter des métadonnées enrichies pour v2.1
      const metadata = await this.generateProfilesMetadata(profiles.profiles);

      return {
        ...profiles,
        metadata,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get customer profiles: ${err.message}`, err.stack);
      throw new HttpException(
        'Failed to retrieve customer profiles',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtenir un profil détaillé spécifique avec données v2.1
   */
  @Get(':customerId')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Get detailed customer profile v2.1',
    description: 'Retrieve complete customer profile including v2.1 enhanced data: assets, stocks, extended identification, risk assessment, and insights'
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        profile: { type: 'object' },
        conformityStatus: {
          type: 'object',
          properties: {
            isConform: { type: 'boolean' },
            overallScore: { type: 'number' },
            issues: { type: 'array' },
            recommendations: { type: 'array' },
          }
        },
        insights: { type: 'object' },
        riskAssessment: { type: 'object' },
        syncStatus: { type: 'object' },
      }
    }
  })
  async getCustomerProfile(@Param('customerId') customerId: string) {
    try {
      const profile = await this.customersService.getCustomerDetailedProfile(customerId);
      
      if (!profile) {
        throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
      }

      // Valider la conformité du profil
      const conformityStatus = await this.workflowService.validateProfileConformity(customerId);

      // Enrichir avec des données contextuelles v2.1
      const enrichedProfile = {
        ...profile,
        // Ajout de données calculées
        calculatedMetrics: this.calculateProfileMetrics(profile),
        complianceHistory: await this.getProfileComplianceHistory(customerId),
        syncHistory: await this.getProfileSyncHistory(customerId),
      };

      return {
        profile: enrichedProfile,
        conformityStatus,
        insights: profile.insights || {},
        riskAssessment: profile.riskProfile || {},
        syncStatus: {
          status: profile.syncStatus,
          lastSync: profile.lastSyncAt,
          nextScheduledSync: profile.nextScheduledSync,
          errors: profile.syncErrors || [],
        },
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get customer profile ${customerId}: ${err.message}`, err.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to retrieve customer profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Déclencher une synchronisation complète v2.1
   */
  @Post(':customerId/sync')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Trigger complete profile synchronization v2.1',
    description: 'Initiate a complete profile synchronization including all v2.1 enhanced data structures'
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Synchronization initiated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        syncId: { type: 'string' },
        steps: { type: 'array' },
        estimatedCompletion: { type: 'string' },
      }
    }
  })
  async triggerProfileSync(
    @Param('customerId') customerId: string,
    @Body() body: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      reason?: string;
      sections?: string[];
    }
  ) {
    try {
      const profile = await this.customersService.getCustomerDetailedProfile(customerId);
      
      if (!profile) {
        throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
      }

      const customerType = profile.customerType === 'FINANCIAL_INSTITUTION' 
        ? 'FINANCIAL_INSTITUTION' 
        : 'COMPANY';

      const result = await this.workflowService.orchestrateCompleteProfileSync({
        customerId,
        customerType,
        triggerReason: 'admin_request',
        requestingService: 'admin-service-api',
        priority: body.priority || 'medium',
      });

      // Estimer le temps de completion basé sur la priorité
      const estimatedMinutes = body.priority === 'urgent' ? 2 : 
                             body.priority === 'high' ? 5 : 
                             body.priority === 'medium' ? 10 : 30;

      return {
        ...result,
        estimatedCompletion: new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString(),
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to trigger sync for customer ${customerId}: ${err.message}`, err.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to trigger profile synchronization',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Valider la conformité d'un profil v2.1
   */
  @Get(':customerId/conformity')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Validate profile conformity v2.1',
    description: 'Perform comprehensive conformity validation including v2.1 compliance checks'
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Conformity validation completed',
    schema: {
      type: 'object',
      properties: {
        isConform: { type: 'boolean' },
        overallScore: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' },
              field: { type: 'string' },
              recommendation: { type: 'string' },
            }
          }
        },
        recommendations: { type: 'array' },
        sectionsAnalysis: { type: 'object' },
        complianceGaps: { type: 'array' },
      }
    }
  })
  async validateProfileConformity(@Param('customerId') customerId: string) {
    try {
      const conformityStatus = await this.workflowService.validateProfileConformity(customerId);
      
      // Ajouter une analyse détaillée des sections
      const sectionsAnalysis = await this.analyzProfileSections(customerId);
      const complianceGaps = await this.identifyComplianceGaps(customerId);

      return {
        ...conformityStatus,
        sectionsAnalysis,
        complianceGaps,
        validatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to validate conformity for customer ${customerId}: ${err.message}`, err.stack);
      throw new HttpException(
        'Failed to validate profile conformity',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtenir les profils nécessitant une attention v2.1
   */
  @Get('/attention/required')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Get profiles requiring attention v2.1',
    description: 'Retrieve profiles that require admin attention based on v2.1 criteria: risk flags, low compliance, sync issues, etc.'
  })
  @ApiQuery({ name: 'priority', required: false, enum: ['low', 'medium', 'high', 'urgent'], description: 'Priority filter' })
  @ApiQuery({ name: 'category', required: false, description: 'Attention category filter' })
  @ApiResponse({
    status: 200,
    description: 'Profiles requiring attention retrieved successfully',
  })
  async getProfilesRequiringAttention(@Query() query: any) {
    try {
      const profiles = await this.customersService.getCustomerDetailedProfiles({
        requiresAttention: true,
        reviewPriority: query.priority,
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 50,
      });

      // Enrichir avec les raisons d'attention
      const enrichedProfiles = profiles.profiles.map(profile => ({
        ...profile,
        attentionReasons: this.identifyAttentionReasons(profile),
        urgencyLevel: this.calculateUrgencyLevel(profile),
        suggestedActions: this.suggestActions(profile),
      }));

      return {
        profiles: enrichedProfiles,
        total: profiles.total,
        summary: {
          byPriority: this.groupByPriority(enrichedProfiles),
          byReason: this.groupByAttentionReason(enrichedProfiles),
          averageUrgency: this.calculateAverageUrgency(enrichedProfiles),
        },
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get profiles requiring attention: ${err.message}`, err.stack);
      throw new HttpException(
        'Failed to retrieve profiles requiring attention',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Mettre à jour le statut administratif v2.1
   */
  @Put(':customerId/admin-status')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Update administrative status v2.1',
    description: 'Update administrative status with v2.1 enhanced tracking and audit trail'
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Administrative status updated successfully',
  })
  async updateAdminStatus(
    @Param('customerId') customerId: string,
    @Body() body: {
      adminStatus: string;
      complianceRating?: string;
      reviewPriority?: 'low' | 'medium' | 'high' | 'urgent';
      adminNotes?: string;
      riskFlags?: string[];
      reason: string;
    }
  ) {
    try {
      const updatedProfile = await this.customersService.updateProfileAdminStatus(customerId, {
        adminStatus: body.adminStatus as any,
        adminNotes: body.adminNotes,
        adminId: 'current-admin-id', // TODO: Get from authenticated user
        adminName: 'Current Admin', // TODO: Get from authenticated user
        reason: body.reason,
      });

      // Log de l'action pour audit trail v2.1
      await this.logAdminAction(customerId, 'admin_status_updated', {
        previousStatus: updatedProfile.adminStatus,
        newStatus: body.adminStatus,
        reason: body.reason,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        profile: updatedProfile,
        actionLogged: true,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to update admin status for customer ${customerId}: ${err.message}`, err.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to update administrative status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtenir les statistiques des profils v2.1
   */
  @Get('/statistics/enhanced')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Get enhanced profile statistics v2.1',
    description: 'Retrieve comprehensive profile statistics including v2.1 metrics: risk distribution, compliance trends, sync health, etc.'
  })
  @ApiResponse({
    status: 200,
    description: 'Enhanced statistics retrieved successfully',
  })
  async getEnhancedStatistics() {
    try {
      const baseStats = await this.customersService.getProfileStatistics();
      
      // Ajouter des statistiques v2.1
      const enhancedStats = {
        ...baseStats,
        riskDistribution: await this.getRiskDistribution(),
        complianceTrends: await this.getComplianceTrends(),
        syncHealth: await this.getSyncHealthMetrics(),
        attentionMetrics: await this.getAttentionMetrics(),
        dataVersionDistribution: await this.getDataVersionDistribution(),
        profileCompletenessDistribution: await this.getCompletenessDistribution(),
        recentActivity: await this.getRecentActivity(),
      };

      return enhancedStats;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get enhanced statistics: ${err.message}`, err.stack);
      throw new HttpException(
        'Failed to retrieve enhanced statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =====================================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // =====================================================

  private async generateProfilesMetadata(profiles: any[]): Promise<any> {
    const totalCompleteness = profiles.reduce((sum, p) => sum + (p.profileCompleteness || 0), 0);
    const averageCompleteness = profiles.length > 0 ? totalCompleteness / profiles.length : 0;
    
    const profilesRequiringAttention = profiles.filter(p => p.requiresAttention).length;
    const highRiskProfiles = profiles.filter(p => p.riskProfile?.riskLevel === 'high').length;
    const recentlyUpdated = profiles.filter(p => {
      const updatedAt = new Date(p.updatedAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return updatedAt > oneDayAgo;
    }).length;

    return {
      averageCompleteness: Math.round(averageCompleteness),
      profilesRequiringAttention,
      highRiskProfiles,
      recentlyUpdated,
    };
  }

  private calculateProfileMetrics(profile: any): any {
    return {
      dataRichness: this.calculateDataRichness(profile),
      syncFrequency: this.calculateSyncFrequency(profile),
      complianceScore: this.calculateComplianceScore(profile),
      riskScore: profile.riskProfile?.overallRiskScore || 0,
    };
  }

  private calculateDataRichness(profile: any): number {
    let score = 0;
    const maxScore = 100;
    
    // Basic info (20 points)
    if (profile.name && profile.email) score += 20;
    
    // Specific profile data (30 points)
    if (profile.companyProfile || profile.institutionProfile) score += 30;
    
    // Extended data (25 points)
    if (profile.extendedProfile) score += 25;
    
    // Assets/stocks for companies (15 points)
    if (profile.patrimoine?.assets?.length || profile.patrimoine?.stocks?.length) score += 15;
    
    // Regulatory data for institutions (15 points)
    if (profile.regulatoryProfile) score += 15;
    
    // Performance metrics (10 points)
    if (profile.performanceMetrics || profile.financialMetrics) score += 10;
    
    return Math.min(score, maxScore);
  }

  private calculateSyncFrequency(profile: any): string {
    if (!profile.lastSyncAt) return 'never';
    
    const lastSync = new Date(profile.lastSyncAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 24) return 'daily';
    if (hoursDiff < 168) return 'weekly'; // 7 days
    if (hoursDiff < 720) return 'monthly'; // 30 days
    return 'rare';
  }

  private calculateComplianceScore(profile: any): number {
    const ratingScores = {
      high: 100,
      medium: 75,
      low: 50,
      critical: 25,
    };
    
    return ratingScores[profile.complianceRating as keyof typeof ratingScores] || 0;
  }

  private async getProfileComplianceHistory(customerId: string): Promise<any[]> {
    // TODO: Implémenter l'historique de conformité
    return [];
  }

  private async getProfileSyncHistory(customerId: string): Promise<any[]> {
    // TODO: Implémenter l'historique de synchronisation
    return [];
  }

  private async analyzProfileSections(customerId: string): Promise<any> {
    // TODO: Implémenter l'analyse détaillée des sections
    return {};
  }

  private async identifyComplianceGaps(customerId: string): Promise<any[]> {
    // TODO: Implémenter l'identification des lacunes de conformité
    return [];
  }

  private identifyAttentionReasons(profile: any): string[] {
    const reasons: string[] = [];
    
    if (profile.profileCompleteness < 70) {
      reasons.push('incomplete_profile');
    }
    
    if (profile.complianceRating === 'critical' || profile.complianceRating === 'low') {
      reasons.push('low_compliance');
    }
    
    if (profile.riskProfile?.riskLevel === 'high') {
      reasons.push('high_risk');
    }
    
    if (profile.syncStatus === 'sync_failed') {
      reasons.push('sync_issues');
    }
    
    if (profile.alerts?.some((a: any) => !a.acknowledged)) {
      reasons.push('unacknowledged_alerts');
    }
    
    return reasons;
  }

  private calculateUrgencyLevel(profile: any): number {
    let urgency = 0;
    
    if (profile.reviewPriority === 'urgent') urgency += 40;
    else if (profile.reviewPriority === 'high') urgency += 30;
    else if (profile.reviewPriority === 'medium') urgency += 20;
    else urgency += 10;
    
    if (profile.complianceRating === 'critical') urgency += 30;
    else if (profile.complianceRating === 'low') urgency += 20;
    
    if (profile.riskProfile?.riskLevel === 'high') urgency += 20;
    
    if (profile.syncStatus === 'sync_failed') urgency += 10;
    
    return Math.min(urgency, 100);
  }

  private suggestActions(profile: any): string[] {
    const actions: string[] = [];
    
    if (profile.profileCompleteness < 70) {
      actions.push('Request profile completion from customer');
    }
    
    if (profile.syncStatus === 'sync_failed') {
      actions.push('Retry profile synchronization');
    }
    
    if (profile.complianceRating === 'critical') {
      actions.push('Immediate compliance review required');
    }
    
    if (profile.riskProfile?.riskLevel === 'high') {
      actions.push('Risk assessment and mitigation planning');
    }
    
    return actions;
  }

  private groupByPriority(profiles: any[]): any {
    return profiles.reduce((acc, profile) => {
      const priority = profile.reviewPriority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByAttentionReason(profiles: any[]): any {
    const reasons: any = {};
    profiles.forEach(profile => {
      profile.attentionReasons?.forEach((reason: string) => {
        reasons[reason] = (reasons[reason] || 0) + 1;
      });
    });
    return reasons;
  }

  private calculateAverageUrgency(profiles: any[]): number {
    if (profiles.length === 0) return 0;
    const totalUrgency = profiles.reduce((sum, p) => sum + (p.urgencyLevel || 0), 0);
    return Math.round(totalUrgency / profiles.length);
  }

  private async logAdminAction(customerId: string, action: string, details: any): Promise<void> {
    // TODO: Implémenter le logging des actions admin
    this.logger.log(`Admin action logged: ${action} for customer ${customerId}`, details);
  }

  private async getRiskDistribution(): Promise<any> {
    // TODO: Implémenter la distribution des risques
    return { low: 0, medium: 0, high: 0 };
  }

  private async getComplianceTrends(): Promise<any> {
    // TODO: Implémenter les tendances de conformité
    return [];
  }

  private async getSyncHealthMetrics(): Promise<any> {
    // TODO: Implémenter les métriques de santé de synchronisation
    return { healthy: 0, issues: 0, failed: 0 };
  }

  private async getAttentionMetrics(): Promise<any> {
    // TODO: Implémenter les métriques d'attention
    return { total: 0, byCategory: {} };
  }

  private async getDataVersionDistribution(): Promise<any> {
    // TODO: Implémenter la distribution des versions de données
    return { '2.1': 0, '2.0': 0, legacy: 0 };
  }

  private async getCompletenessDistribution(): Promise<any> {
    // TODO: Implémenter la distribution de complétude
    return { complete: 0, partial: 0, minimal: 0 };
  }

  private async getRecentActivity(): Promise<any[]> {
    // TODO: Implémenter l'activité récente
    return [];
  }
}