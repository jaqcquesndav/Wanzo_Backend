import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PricingDataSyncService } from '../services/pricing-data-sync.service';

@ApiTags('Admin - Pricing Management')
@Controller('admin/pricing')
@ApiBearerAuth()
// @UseGuards(AdminAuthGuard) // Uncomment when admin authentication is implemented
export class AdminPricingController {
  constructor(
    private pricingDataSyncService: PricingDataSyncService,
  ) {}

  @Post('sync/plans')
  @ApiOperation({ summary: 'Synchroniser les plans d\'abonnement depuis la configuration' })
  @ApiResponse({ status: 200, description: 'Plans synchronisés avec succès' })
  async syncSubscriptionPlans(): Promise<{ success: boolean; message: string }> {
    try {
      await this.pricingDataSyncService.syncSubscriptionPlans();
      return {
        success: true,
        message: 'Subscription plans synchronized successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error synchronizing plans: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  @Post('sync/tokens')
  @ApiOperation({ summary: 'Synchroniser les packages de tokens depuis la configuration' })
  @ApiResponse({ status: 200, description: 'Packages synchronisés avec succès' })
  async syncTokenPackages(): Promise<{ success: boolean; message: string }> {
    try {
      await this.pricingDataSyncService.syncTokenPackages();
      return {
        success: true,
        message: 'Token packages synchronized successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error synchronizing token packages: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  @Post('sync/all')
  @ApiOperation({ summary: 'Synchroniser toutes les données de tarification' })
  @ApiResponse({ status: 200, description: 'Toutes les données synchronisées avec succès' })
  async syncAllPricingData(): Promise<{ success: boolean; message: string }> {
    try {
      await this.pricingDataSyncService.syncAllPricingData();
      return {
        success: true,
        message: 'All pricing data synchronized successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error synchronizing pricing data: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  @Get('validate')
  @ApiOperation({ summary: 'Valider la cohérence des données de tarification' })
  @ApiResponse({ status: 200, description: 'Rapport de validation' })
  async validatePricingData(): Promise<{
    isValid: boolean;
    missingPlans: string[];
    missingPackages: string[];
    inconsistencies: Array<{
      type: 'plan' | 'package';
      id: string;
      issue: string;
    }>;
  }> {
    return await this.pricingDataSyncService.validatePricingData();
  }

  @Get('sync/report')
  @ApiOperation({ summary: 'Générer un rapport de synchronisation' })
  @ApiResponse({ status: 200, description: 'Rapport de synchronisation' })
  async getSyncReport(): Promise<{
    plansToUpdate: string[];
    plansToCreate: string[];
    plansToDeactivate: string[];
    packagesToUpdate: string[];
    packagesToCreate: string[];
    packagesToDeactivate: string[];
  }> {
    return await this.pricingDataSyncService.generateSyncReport();
  }
}
