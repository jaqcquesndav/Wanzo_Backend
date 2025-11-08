import { Controller, Get, Post, Query, UseGuards, Logger, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles, UserRole } from '../../auth/decorators/roles.decorator';
import { SubscriptionService } from '../services/subscription.service';
import { PricingDataSyncService } from '../services/pricing-data-sync.service';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

@Controller('subscriptions/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminSubscriptionController {
  private readonly logger = new Logger(AdminSubscriptionController.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly pricingDataSyncService: PricingDataSyncService,
  ) {}

  /**
   * Récupère tous les plans (actifs et inactifs) - Accès admin uniquement
   */
  @Get('plans/all')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllPlans(
    @Query('includeInactive') includeInactive?: string,
    @Query('customerType') customerType?: string
  ): Promise<ApiResponse<any[]>> {
    try {
      // Pour les admins, on peut récupérer tous les plans même inactifs
      const whereCondition: any = {};
      
      if (includeInactive !== 'true') {
        whereCondition.isActive = true;
      }
      
      if (customerType) {
        whereCondition.customerType = customerType === 'pme' ? 'sme' : customerType;
      }

      const plans = await this.subscriptionService.getSubscriptionPlans();
      
      return {
        success: true,
        data: plans,
        message: `Retrieved ${plans.length} subscription plans`
      };
    } catch (error) {
      this.logger.error('Error retrieving all plans', error);
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve subscription plans',
        error: (error as Error).message
      };
    }
  }

  /**
   * Synchronise les plans depuis la configuration locale
   */
  @Post('plans/sync')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async syncPlans(): Promise<ApiResponse<any>> {
    try {
      this.logger.log('Starting manual plan synchronization...');
      
      await this.pricingDataSyncService.syncSubscriptionPlans();
      
      // Récupérer les plans mis à jour
      const updatedPlans = await this.subscriptionService.getSubscriptionPlans();
      
      return {
        success: true,
        data: {
          totalPlans: updatedPlans.length,
          syncedAt: new Date().toISOString()
        },
        message: 'Subscription plans synchronized successfully'
      };
    } catch (error) {
      this.logger.error('Error during plan synchronization', error);
      return {
        success: false,
        data: null,
        message: 'Failed to synchronize subscription plans',
        error: (error as Error).message
      };
    }
  }

  /**
   * Valide la cohérence des données de tarification
   */
  @Get('plans/validate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async validatePricingData(): Promise<ApiResponse<any>> {
    try {
      const validation = await this.pricingDataSyncService.validatePricingData();
      
      return {
        success: true,
        data: validation,
        message: validation.isValid ? 'Pricing data is valid' : 'Pricing data has inconsistencies'
      };
    } catch (error) {
      this.logger.error('Error validating pricing data', error);
      return {
        success: false,
        data: null,
        message: 'Failed to validate pricing data',
        error: (error as Error).message
      };
    }
  }

  /**
   * Génère un rapport de synchronisation
   */
  @Get('plans/sync-report')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async generateSyncReport(): Promise<ApiResponse<any>> {
    try {
      const report = await this.pricingDataSyncService.generateSyncReport();
      
      return {
        success: true,
        data: report,
        message: 'Sync report generated successfully'
      };
    } catch (error) {
      this.logger.error('Error generating sync report', error);
      return {
        success: false,
        data: null,
        message: 'Failed to generate sync report',
        error: (error as Error).message
      };
    }
  }

  /**
   * Récupère les statistiques des plans
   */
  @Get('plans/stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getPlanStats(): Promise<ApiResponse<any>> {
    try {
      const allPlans = await this.subscriptionService.getSubscriptionPlans();
      
      const stats = {
        total: allPlans.length,
        byCustomerType: {
          sme: allPlans.filter(p => p.customerType === 'sme' || p.customerType === 'financial_institution').length,
          financial: allPlans.filter(p => p.customerType === 'financial_institution').length
        },
        byTier: {
          basic: allPlans.filter(p => p.planType === 'BASIC').length,
          standard: allPlans.filter(p => p.planType === 'STANDARD').length,
          premium: allPlans.filter(p => p.planType === 'PREMIUM').length,
          enterprise: allPlans.filter(p => p.planType === 'ENTERPRISE').length,
          custom: allPlans.filter(p => p.planType === 'CUSTOM').length
        },
        popular: allPlans.filter(p => p.isPopular).length,
        fromAdminService: allPlans.filter(p => p.metadata?.fromAdminService).length,
        priceRange: {
          min: Math.min(...allPlans.map(p => p.monthlyPriceUSD)),
          max: Math.max(...allPlans.map(p => p.monthlyPriceUSD)),
          average: allPlans.reduce((sum, p) => sum + p.monthlyPriceUSD, 0) / allPlans.length
        }
      };
      
      return {
        success: true,
        data: stats,
        message: 'Plan statistics retrieved successfully'
      };
    } catch (error) {
      this.logger.error('Error retrieving plan stats', error);
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve plan statistics',
        error: (error as Error).message
      };
    }
  }

  /**
   * Force la mise à jour d'un plan spécifique depuis l'Admin Service
   */
  @Post('plans/:planId/refresh')
  @Roles(UserRole.SUPER_ADMIN)
  async refreshPlan(@Param('planId') planId: string): Promise<ApiResponse<any>> {
    try {
      // Cette méthode pourrait être étendue pour faire un appel API à l'Admin Service
      // pour récupérer les dernières informations d'un plan spécifique
      
      const plan = await this.subscriptionService.getSubscriptionPlan(planId);
      
      if (!plan) {
        return {
          success: false,
          data: null,
          message: `Plan with ID ${planId} not found`
        };
      }
      
      return {
        success: true,
        data: plan,
        message: 'Plan information retrieved successfully'
      };
    } catch (error) {
      this.logger.error(`Error refreshing plan ${planId}`, error);
      return {
        success: false,
        data: null,
        message: 'Failed to refresh plan information',
        error: (error as Error).message
      };
    }
  }
}