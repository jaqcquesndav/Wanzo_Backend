import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
  NotFoundException,
  ParseUUIDPipe,
  ValidationPipe
} from '@nestjs/common';
import { CompanySyncService } from '../services/company-sync.service';
import { 
  CompanyProfileResponseDto, 
  SyncCompanyProfileDto, 
  SyncResponseDto,
  CompanyProfileSearchDto,
  CompanyProfileStatsDto
} from '../dtos/company-profile.dto';

/**
 * Controller REST pour l'accès aux profils companies
 * 
 * ENDPOINTS:
 * GET    /company-profiles/:id              - Récupère un profil (avec auto-sync si stale)
 * GET    /company-profiles                  - Recherche de profils avec filtres
 * GET    /company-profiles/stats            - Statistiques globales
 * POST   /company-profiles/:id/sync         - Synchronisation manuelle (force refresh)
 * POST   /company-profiles/:id/sync-complete - Sync complète accounting + customer
 */
@Controller('company-profiles')
export class CompanyProfileController {
  private readonly logger = new Logger(CompanyProfileController.name);

  constructor(
    private readonly companySyncService: CompanySyncService,
  ) {}

  /**
   * Récupère le profil complet d'une company par ID
   * 
   * @param id - UUID de la company (client_id)
   * @param autoSync - Si true (défaut), synchronise depuis accounting si données périmées
   * 
   * @returns CompanyProfileResponseDto avec données accounting + customer
   * 
   * @example
   * GET /company-profiles/550e8400-e29b-41d4-a716-446655440000?autoSync=true
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('autoSync') autoSync?: string,
  ): Promise<CompanyProfileResponseDto> {
    this.logger.log(`[GET] Fetching profile for company ${id} (autoSync: ${autoSync !== 'false'})`);

    try {
      const profile = await this.companySyncService.getProfile(id, autoSync !== 'false');
      return this.companySyncService.toDto(profile);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`[GET] Failed to fetch profile for ${id}:`, error?.stack);
      throw error;
    }
  }

  /**
   * Recherche de profils avec filtres multiples
   * 
   * @param searchDto - Filtres de recherche (companyName, sector, creditScore, etc.)
   * 
   * @returns Liste paginée de profils
   * 
   * @example
   * GET /company-profiles?companyName=ABC&sector=Technology&minCreditScore=70&page=1&limit=20
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async searchProfiles(
    @Query(ValidationPipe) searchDto: CompanyProfileSearchDto,
  ): Promise<{
    profiles: CompanyProfileResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`[SEARCH] Searching profiles with filters: ${JSON.stringify(searchDto)}`);

    try {
      const result = await this.companySyncService.searchProfiles(searchDto);
      
      const profiles = result.profiles.map(p => this.companySyncService.toDto(p));
      const totalPages = Math.ceil(result.total / result.limit);

      return {
        profiles,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages,
      };
    } catch (error: any) {
      this.logger.error(`[SEARCH] Failed to search profiles:`, error?.stack);
      throw error;
    }
  }

  /**
   * Récupère les statistiques globales des profils
   * 
   * @returns Statistiques (total, freshness, distribution par secteur/taille/rating)
   * 
   * @example
   * GET /company-profiles/stats
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats(): Promise<CompanyProfileStatsDto> {
    this.logger.log(`[STATS] Fetching company profiles statistics`);

    try {
      return await this.companySyncService.getStats();
    } catch (error: any) {
      this.logger.error(`[STATS] Failed to fetch statistics:`, error?.stack);
      throw error;
    }
  }

  /**
   * Synchronise manuellement un profil depuis accounting-service
   * 
   * @param id - UUID de la company
   * @param body - Options de synchronisation (source, forceRefresh)
   * 
   * @returns SyncResponseDto avec détails de la synchronisation
   * 
   * @example
   * POST /company-profiles/550e8400-e29b-41d4-a716-446655440000/sync
   * Body: { "source": "accounting", "forceRefresh": true }
   */
  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  async syncProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) body: SyncCompanyProfileDto,
  ): Promise<SyncResponseDto> {
    this.logger.log(
      `[SYNC] Manual sync requested for company ${id} ` +
      `(source: ${body.source || 'accounting'}, force: ${body.forceRefresh})`
    );

    try {
      const source = body.source || 'accounting';
      const forceRefresh = body.forceRefresh ?? true;

      if (source === 'accounting' || source === 'both') {
        const profile = await this.companySyncService.syncFromAccounting(id, forceRefresh);
        
        return {
          success: true,
          message: `Company ${id} synchronized successfully from accounting-service`,
          syncDetails: {
            accountingSynced: true,
            customerSynced: false,
            fieldsUpdated: ['accounting-financial-data'],
            conflicts: profile.metadata?.conflicts?.slice(-5) || [],
          },
          profile: this.companySyncService.toDto(profile),
        };
      }

      // Note: customer sync est événementiel via Kafka
      // Pas de pull HTTP disponible
      return {
        success: false,
        message: 'Customer data sync is event-driven. Use source="accounting" or wait for Kafka events.',
      };

    } catch (error: any) {
      this.logger.error(`[SYNC] Failed to sync profile for ${id}:`, error?.stack);
      
      return {
        success: false,
        message: `Synchronization failed: ${error?.message}`,
      };
    }
  }

  /**
   * Synchronise complètement un profil (accounting + customer)
   * 
   * @param id - UUID de la company
   * @param body - Options (forceRefresh)
   * 
   * @returns SyncResponseDto avec détails complets
   * 
   * @example
   * POST /company-profiles/550e8400-e29b-41d4-a716-446655440000/sync-complete
   * Body: { "forceRefresh": true }
   */
  @Post(':id/sync-complete')
  @HttpCode(HttpStatus.OK)
  async syncComplete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) body: { forceRefresh?: boolean },
  ): Promise<SyncResponseDto> {
    this.logger.log(
      `[SYNC-COMPLETE] Complete sync requested for company ${id} (force: ${body.forceRefresh})`
    );

    try {
      const forceRefresh = body.forceRefresh ?? true;
      const result = await this.companySyncService.syncComplete(id, forceRefresh);
      
      return result;

    } catch (error: any) {
      this.logger.error(`[SYNC-COMPLETE] Failed complete sync for ${id}:`, error?.stack);
      
      return {
        success: false,
        message: `Complete synchronization failed: ${error?.message}`,
      };
    }
  }

  /**
   * Vérifie la fraîcheur des données d'un profil
   * 
   * @param id - UUID de la company
   * 
   * @returns Indicateurs de fraîcheur pour accounting et customer data
   * 
   * @example
   * GET /company-profiles/550e8400-e29b-41d4-a716-446655440000/freshness
   */
  @Get(':id/freshness')
  @HttpCode(HttpStatus.OK)
  async checkFreshness(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    companyId: string;
    accountingDataFresh: boolean;
    customerDataFresh: boolean;
    needsAccountingSync: boolean;
    needsCustomerSync: boolean;
    lastSyncFromAccounting: string | null;
    lastSyncFromCustomer: string | null;
  }> {
    this.logger.log(`[FRESHNESS] Checking data freshness for company ${id}`);

    try {
      const profile = await this.companySyncService.getProfile(id, false);

      return {
        companyId: profile.id,
        accountingDataFresh: profile.isAccountingDataFresh,
        customerDataFresh: profile.isCustomerDataFresh,
        needsAccountingSync: profile.needsAccountingSync(),
        needsCustomerSync: profile.needsCustomerSync(),
        lastSyncFromAccounting: profile.lastSyncFromAccounting?.toISOString() || null,
        lastSyncFromCustomer: profile.lastSyncFromCustomer?.toISOString() || null,
      };

    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`[FRESHNESS] Failed to check freshness for ${id}:`, error?.stack);
      throw error;
    }
  }

  /**
   * Récupère l'historique de synchronisation d'un profil
   * 
   * @param id - UUID de la company
   * 
   * @returns Historique des syncs et conflits résolus
   * 
   * @example
   * GET /company-profiles/550e8400-e29b-41d4-a716-446655440000/sync-history
   */
  @Get(':id/sync-history')
  @HttpCode(HttpStatus.OK)
  async getSyncHistory(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    companyId: string;
    syncHistory: Array<{
      source: string;
      timestamp: string;
      status: string;
      error?: string;
    }>;
    conflicts: Array<{
      field: string;
      accountingValue: any;
      customerValue: any;
      resolvedWith: string;
      timestamp: string;
    }>;
  }> {
    this.logger.log(`[SYNC-HISTORY] Fetching sync history for company ${id}`);

    try {
      const profile = await this.companySyncService.getProfile(id, false);

      return {
        companyId: profile.id,
        syncHistory: profile.metadata?.syncHistory || [],
        conflicts: profile.metadata?.conflicts || [],
      };

    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`[SYNC-HISTORY] Failed to fetch sync history for ${id}:`, error?.stack);
      throw error;
    }
  }
}
