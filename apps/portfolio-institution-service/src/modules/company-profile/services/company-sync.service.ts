import { Injectable, Logger, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, Between } from 'typeorm';
import { CompanyProfile } from '../entities/company-profile.entity';
import { AccountingIntegrationService, SMEFinancialData } from '../../integration/accounting-integration.service';
import { 
  CustomerCompanyProfileEventDto, 
  AccountingFinancialDataDto,
  CompanyProfileResponseDto,
  SyncResponseDto,
  CompanyProfileSearchDto,
  CompanyProfileStatsDto
} from '../dtos/company-profile.dto';

/**
 * Service orchestrant la synchronisation hybride des profils company
 * 
 * STRATÉGIE DE SYNCHRONISATION:
 * 1. SOURCE PRIMAIRE: accounting-service (HTTP) - données financières opérationnelles
 *    - Fréquence: 24h
 *    - Priorité: HAUTE
 *    - Champs: métriques financières, score crédit, rating
 * 
 * 2. SOURCE SECONDAIRE: customer-service (Kafka) - enrichissement administratif
 *    - Fréquence: événementielle + 7 jours
 *    - Priorité: BASSE
 *    - Champs: données légales, contacts, structure organisationnelle
 * 
 * 3. RÉSOLUTION DE CONFLITS:
 *    - Si companyName diffère: accounting-service gagne
 *    - Si employeeCount diffère: accounting-service gagne
 *    - Autres champs: customer-service enrichit sans écraser accounting
 */
@Injectable()
export class CompanySyncService {
  private readonly logger = new Logger(CompanySyncService.name);

  constructor(
    @InjectRepository(CompanyProfile)
    private companyProfileRepository: Repository<CompanyProfile>,
    private accountingIntegrationService: AccountingIntegrationService,
  ) {}

  // ============================================================
  // SYNCHRONISATION DEPUIS ACCOUNTING-SERVICE (SOURCE PRIMAIRE)
  // ============================================================

  /**
   * Synchronise les données financières depuis accounting-service
   * SOURCE PRIMAIRE - Priorité HAUTE
   */
  async syncFromAccounting(companyId: string, forceRefresh = false): Promise<CompanyProfile> {
    this.logger.log(`[ACCOUNTING-SYNC] Starting sync for company ${companyId} (force: ${forceRefresh})`);

    try {
      // Vérifier si la company existe dans le cache local
      let profile = await this.companyProfileRepository.findOne({ where: { id: companyId } });

      // Si existe et pas de force refresh, vérifier si sync nécessaire
      if (profile && !forceRefresh && !profile.needsAccountingSync()) {
        this.logger.log(`[ACCOUNTING-SYNC] Company ${companyId} data is fresh, skipping sync`);
        return profile;
      }

      // Récupérer les données depuis accounting-service
      const financialData = await this.accountingIntegrationService.getSMEFinancialData(companyId);
      const sector = await this.getSectorFromAccounting(companyId);
      const employeeCount = await this.getEmployeeCountFromAccounting(companyId);
      const websiteUrl = await this.getWebsiteFromAccounting(companyId);

      if (profile) {
        // Mise à jour du profil existant
        this.logger.log(`[ACCOUNTING-SYNC] Updating existing profile for ${companyId}`);
        
        // Détecter les conflits de nom
        if (profile.companyName && profile.companyName !== financialData.companyName) {
          this.logger.warn(
            `[CONFLICT] Company name mismatch for ${companyId}: ` +
            `existing="${profile.companyName}", accounting="${financialData.companyName}"`
          );
          profile.recordConflict('companyName', financialData.companyName, profile.companyName, 'accounting');
        }

        // Détecter les conflits d'employeeCount
        if (profile.employeeCount && profile.employeeCount !== employeeCount) {
          this.logger.warn(
            `[CONFLICT] Employee count mismatch for ${companyId}: ` +
            `existing=${profile.employeeCount}, accounting=${employeeCount}`
          );
          profile.recordConflict('employeeCount', employeeCount, profile.employeeCount, 'accounting');
        }

        // Appliquer les données accounting (source de vérité)
        this.applyAccountingData(profile, financialData, sector, employeeCount, websiteUrl);
        
        profile.lastSyncFromAccounting = new Date();
        profile.isAccountingDataFresh = true;
        profile.lastModifiedBy = 'accounting-sync';
        profile.recordSync('accounting', 'success');

      } else {
        // Création d'un nouveau profil
        this.logger.log(`[ACCOUNTING-SYNC] Creating new profile for ${companyId}`);
        
        profile = this.companyProfileRepository.create({
          id: companyId,
          companyName: financialData.companyName,
          sector: sector,
          totalRevenue: financialData.totalRevenue,
          annualRevenue: financialData.annual_revenue,
          netProfit: financialData.netProfit,
          totalAssets: financialData.totalAssets,
          totalLiabilities: financialData.totalLiabilities,
          cashFlow: financialData.cashFlow,
          debtRatio: financialData.debt_ratio,
          workingCapital: financialData.working_capital,
          creditScore: financialData.credit_score,
          financialRating: financialData.financial_rating,
          revenueGrowth: financialData.revenue_growth,
          profitMargin: financialData.profit_margin,
          ebitda: financialData.ebitda,
          employeeCount: employeeCount,
          companySize: this.classifyCompanySize(financialData.annual_revenue, financialData.totalAssets),
          websiteUrl: websiteUrl,
          lastSyncFromAccounting: new Date(),
          isAccountingDataFresh: true,
          isCustomerDataFresh: false,
          createdBy: 'accounting-sync',
          metadata: {
            syncHistory: [],
            conflicts: []
          }
        });

        profile.recordSync('accounting', 'success');
      }

      // Calculer la complétude du profil
      profile.profileCompleteness = profile.calculateCompleteness();

      // Sauvegarder
      const saved = await this.companyProfileRepository.save(profile);
      this.logger.log(`[ACCOUNTING-SYNC] Successfully synced company ${companyId} (completeness: ${saved.profileCompleteness}%)`);
      
      return saved;

    } catch (error: any) {
      this.logger.error(`[ACCOUNTING-SYNC] Failed to sync company ${companyId}:`, error?.stack);
      
      // Enregistrer l'échec si le profil existe
      const profile = await this.companyProfileRepository.findOne({ where: { id: companyId } });
      if (profile) {
        profile.isAccountingDataFresh = false;
        profile.recordSync('accounting', 'failed', error?.message);
        await this.companyProfileRepository.save(profile);
      }

      throw new HttpException(
        `Failed to sync accounting data for company ${companyId}: ${error?.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Applique les données accounting sur un profil existant
   */
  private applyAccountingData(
    profile: CompanyProfile,
    financialData: SMEFinancialData,
    sector: string,
    employeeCount: number,
    websiteUrl?: string
  ): void {
    profile.companyName = financialData.companyName; // Source de vérité
    profile.sector = sector;
    profile.totalRevenue = financialData.totalRevenue;
    profile.annualRevenue = financialData.annual_revenue;
    profile.netProfit = financialData.netProfit;
    profile.totalAssets = financialData.totalAssets;
    profile.totalLiabilities = financialData.totalLiabilities;
    profile.cashFlow = financialData.cashFlow;
    profile.debtRatio = financialData.debt_ratio;
    profile.workingCapital = financialData.working_capital;
    profile.creditScore = financialData.credit_score;
    profile.financialRating = financialData.financial_rating;
    profile.revenueGrowth = financialData.revenue_growth;
    profile.profitMargin = financialData.profit_margin;
    profile.ebitda = financialData.ebitda;
    profile.employeeCount = employeeCount; // Source de vérité
    profile.companySize = this.classifyCompanySize(financialData.annual_revenue, financialData.totalAssets);
    
    if (websiteUrl) {
      profile.websiteUrl = websiteUrl;
    }
  }

  // ============================================================
  // SYNCHRONISATION DEPUIS CUSTOMER-SERVICE (SOURCE SECONDAIRE)
  // ============================================================

  /**
   * Enrichit un profil avec les données de customer-service
   * SOURCE SECONDAIRE - Priorité BASSE
   */
  async enrichFromCustomer(event: CustomerCompanyProfileEventDto): Promise<CompanyProfile> {
    this.logger.log(`[CUSTOMER-SYNC] Enriching profile for company ${event.customerId}`);

    try {
      // Récupérer le profil existant (doit exister via accounting d'abord)
      let profile = await this.companyProfileRepository.findOne({ where: { id: event.customerId } });

      if (!profile) {
        // Créer un profil minimal si n'existe pas encore
        this.logger.warn(
          `[CUSTOMER-SYNC] Profile ${event.customerId} doesn't exist, creating minimal entry. ` +
          `Accounting sync should be triggered.`
        );
        
        profile = this.companyProfileRepository.create({
          id: event.customerId,
          companyName: event.name,
          sector: event.companyProfile?.industry || 'Unknown',
          totalRevenue: 0,
          annualRevenue: 0,
          netProfit: 0,
          totalAssets: 0,
          totalLiabilities: 0,
          cashFlow: 0,
          debtRatio: 0,
          workingCapital: 0,
          creditScore: 0,
          financialRating: 'N/A',
          revenueGrowth: 0,
          profitMargin: 0,
          employeeCount: event.companyProfile?.employeeCount || 0,
          companySize: event.companyProfile?.size || 'small',
          isAccountingDataFresh: false,
          isCustomerDataFresh: true,
          createdBy: 'customer-sync',
          metadata: {
            syncHistory: [],
            conflicts: []
          }
        });
      }

      // Enrichir avec les données customer (ne pas écraser accounting)
      this.applyCustomerData(profile, event);
      
      profile.lastSyncFromCustomer = new Date();
      profile.isCustomerDataFresh = true;
      profile.lastModifiedBy = 'customer-sync';
      profile.recordSync('customer', 'success');

      // Recalculer la complétude
      profile.profileCompleteness = profile.calculateCompleteness();

      // Sauvegarder
      const saved = await this.companyProfileRepository.save(profile);
      this.logger.log(`[CUSTOMER-SYNC] Successfully enriched company ${event.customerId} (completeness: ${saved.profileCompleteness}%)`);
      
      return saved;

    } catch (error: any) {
      this.logger.error(`[CUSTOMER-SYNC] Failed to enrich company ${event.customerId}:`, error?.stack);
      
      const profile = await this.companyProfileRepository.findOne({ where: { id: event.customerId } });
      if (profile) {
        profile.isCustomerDataFresh = false;
        profile.recordSync('customer', 'failed', error?.message);
        await this.companyProfileRepository.save(profile);
      }

      throw new HttpException(
        `Failed to enrich customer data for company ${event.customerId}: ${error?.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Applique les données customer sur un profil (enrichissement uniquement)
   */
  private applyCustomerData(profile: CompanyProfile, event: CustomerCompanyProfileEventDto): void {
    const cp = event.companyProfile;

    // NE PAS écraser companyName (accounting est source de vérité)
    // Mais noter le conflit si différent
    if (profile.companyName && event.name && profile.companyName !== event.name) {
      this.logger.warn(
        `[CONFLICT] Company name from customer (${event.name}) differs from accounting (${profile.companyName}). ` +
        `Keeping accounting value.`
      );
      profile.recordConflict('companyName', profile.companyName, event.name, 'accounting');
    }

    // Enrichir les champs administratifs/légaux (customer-service uniquement)
    if (cp) {
      profile.legalForm = cp.legalForm;
      profile.industry = cp.industry;
      profile.rccm = cp.rccm;
      profile.taxId = cp.taxId;
      profile.natId = cp.natId;
      profile.yearFounded = cp.yearFounded;
      profile.capital = cp.capital;
      profile.owner = cp.owner;
      profile.associates = cp.associates;
      profile.locations = cp.locations;
      profile.contactPersons = cp.contactPersons;
      profile.affiliations = cp.affiliations;
      profile.socialMedia = cp.socialMedia;

      // NE PAS écraser employeeCount si déjà set par accounting
      if (!profile.employeeCount || profile.employeeCount === 0) {
        profile.employeeCount = cp.employeeCount || 0;
      } else if (cp.employeeCount && profile.employeeCount !== cp.employeeCount) {
        this.logger.warn(
          `[CONFLICT] Employee count from customer (${cp.employeeCount}) differs from accounting (${profile.employeeCount}). ` +
          `Keeping accounting value.`
        );
        profile.recordConflict('employeeCount', profile.employeeCount, cp.employeeCount, 'accounting');
      }
    }

    // Enrichir les infos de contact basiques
    profile.email = event.email;
    profile.phone = event.phone;
    profile.logo = event.logo;
    profile.address = event.address;
    profile.customerServiceStatus = event.status;

    // Extraire les coordonnées géographiques de la location primaire
    if (cp?.locations && Array.isArray(cp.locations)) {
      const primaryLocation = cp.locations.find(loc => loc.isPrimary);
      if (primaryLocation?.coordinates) {
        profile.latitude = primaryLocation.coordinates.lat;
        profile.longitude = primaryLocation.coordinates.lng;
      } else if (cp.locations.length > 0 && cp.locations[0].coordinates) {
        // Si pas de location primaire, prendre la première avec coordonnées
        profile.latitude = cp.locations[0].coordinates.lat;
        profile.longitude = cp.locations[0].coordinates.lng;
      }
    }
  }

  // ============================================================
  // SYNCHRONISATION COMPLÈTE (ACCOUNTING + CUSTOMER)
  // ============================================================

  /**
   * Synchronise un profil depuis les deux sources
   */
  async syncComplete(companyId: string, forceRefresh = false): Promise<SyncResponseDto> {
    this.logger.log(`[COMPLETE-SYNC] Starting complete sync for company ${companyId}`);

    const syncDetails: SyncResponseDto['syncDetails'] = {
      accountingSynced: false,
      customerSynced: false,
      fieldsUpdated: [],
      conflicts: []
    };

    try {
      // 1. Synchroniser depuis accounting (primaire)
      const profileAfterAccounting = await this.syncFromAccounting(companyId, forceRefresh);
      syncDetails.accountingSynced = true;
      syncDetails.fieldsUpdated.push('accounting-financial-data');

      // 2. Essayer d'enrichir depuis customer-service
      // Note: Customer data vient via Kafka events, pas de pull HTTP
      // On vérifie juste si les données customer sont fraîches
      if (profileAfterAccounting.needsCustomerSync()) {
        this.logger.warn(
          `[COMPLETE-SYNC] Customer data for ${companyId} is stale. ` +
          `Waiting for Kafka event from customer-service.`
        );
        syncDetails.customerSynced = false;
      } else {
        syncDetails.customerSynced = true;
        syncDetails.fieldsUpdated.push('customer-administrative-data');
      }

      // 3. Collecter les conflits enregistrés
      if (profileAfterAccounting.metadata?.conflicts) {
        syncDetails.conflicts = profileAfterAccounting.metadata.conflicts.slice(-5); // 5 derniers
      }

      return {
        success: true,
        message: `Company ${companyId} synchronized successfully`,
        syncDetails,
        profile: this.toDto(profileAfterAccounting)
      };

    } catch (error: any) {
      this.logger.error(`[COMPLETE-SYNC] Failed complete sync for ${companyId}:`, error?.stack);
      
      return {
        success: false,
        message: `Failed to sync company ${companyId}: ${error?.message}`,
        syncDetails
      };
    }
  }

  // ============================================================
  // RÉCUPÉRATION ET RECHERCHE
  // ============================================================

  /**
   * Récupère un profil par ID
   */
  async getProfile(companyId: string, autoSync = true): Promise<CompanyProfile> {
    const profile = await this.companyProfileRepository.findOne({ where: { id: companyId } });

    if (!profile) {
      if (autoSync) {
        this.logger.log(`[GET-PROFILE] Profile ${companyId} not found, triggering accounting sync`);
        return await this.syncFromAccounting(companyId);
      }
      throw new NotFoundException(`Company profile ${companyId} not found`);
    }

    // Synchroniser automatiquement si les données sont périmées
    if (autoSync && profile.needsAccountingSync()) {
      this.logger.log(`[GET-PROFILE] Profile ${companyId} data is stale, triggering refresh`);
      return await this.syncFromAccounting(companyId);
    }

    return profile;
  }

  /**
   * Recherche de profils avec filtres
   */
  async searchProfiles(searchDto: CompanyProfileSearchDto): Promise<{
    profiles: CompanyProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<CompanyProfile> = {};

    if (searchDto.companyName) {
      where.companyName = Like(`%${searchDto.companyName}%`);
    }
    if (searchDto.sector) {
      where.sector = searchDto.sector;
    }
    if (searchDto.financialRating) {
      where.financialRating = searchDto.financialRating;
    }
    if (searchDto.companySize) {
      where.companySize = searchDto.companySize;
    }
    if (searchDto.rccm) {
      where.rccm = searchDto.rccm;
    }
    if (searchDto.taxId) {
      where.taxId = searchDto.taxId;
    }
    if (searchDto.minCreditScore !== undefined || searchDto.maxCreditScore !== undefined) {
      where.creditScore = Between(
        searchDto.minCreditScore || 0,
        searchDto.maxCreditScore || 100
      );
    }

    const [profiles, total] = await this.companyProfileRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { companyName: 'ASC' }
    });

    return { profiles, total, page, limit };
  }

  /**
   * Récupère les statistiques des profils
   */
  async getStats(): Promise<CompanyProfileStatsDto> {
    const [profiles, total] = await this.companyProfileRepository.findAndCount();

    const profilesWithFreshAccounting = profiles.filter(p => p.isAccountingDataFresh).length;
    const profilesWithFreshCustomer = profiles.filter(p => p.isCustomerDataFresh).length;
    const averageCompleteness = profiles.reduce((sum, p) => sum + p.profileCompleteness, 0) / (total || 1);

    const bySector: Record<string, number> = {};
    const bySize: Record<string, number> = {};
    const byFinancialRating: Record<string, number> = {};

    profiles.forEach(p => {
      bySector[p.sector] = (bySector[p.sector] || 0) + 1;
      bySize[p.companySize] = (bySize[p.companySize] || 0) + 1;
      byFinancialRating[p.financialRating] = (byFinancialRating[p.financialRating] || 0) + 1;
    });

    return {
      totalProfiles: total,
      profilesWithFreshAccountingData: profilesWithFreshAccounting,
      profilesWithFreshCustomerData: profilesWithFreshCustomer,
      averageCompleteness: Math.round(averageCompleteness),
      bySector,
      bySize,
      byFinancialRating,
      lastCalculated: new Date().toISOString()
    };
  }

  // ============================================================
  // MÉTHODES UTILITAIRES
  // ============================================================

  /**
   * Convertit une entity en DTO pour l'API
   */
  toDto(profile: CompanyProfile): CompanyProfileResponseDto {
    return {
      id: profile.id,
      companyName: profile.companyName,
      sector: profile.sector,
      totalRevenue: profile.totalRevenue,
      annualRevenue: profile.annualRevenue,
      netProfit: profile.netProfit,
      totalAssets: profile.totalAssets,
      totalLiabilities: profile.totalLiabilities,
      cashFlow: profile.cashFlow,
      debtRatio: profile.debtRatio,
      workingCapital: profile.workingCapital,
      creditScore: profile.creditScore,
      financialRating: profile.financialRating,
      revenueGrowth: profile.revenueGrowth,
      profitMargin: profile.profitMargin,
      ebitda: profile.ebitda,
      employeeCount: profile.employeeCount,
      companySize: profile.companySize,
      websiteUrl: profile.websiteUrl,
      legalForm: profile.legalForm,
      industry: profile.industry,
      rccm: profile.rccm,
      taxId: profile.taxId,
      natId: profile.natId,
      yearFounded: profile.yearFounded,
      capital: profile.capital,
      owner: profile.owner,
      associates: profile.associates,
      locations: profile.locations,
      contactPersons: profile.contactPersons,
      affiliations: profile.affiliations,
      socialMedia: profile.socialMedia,
      email: profile.email,
      phone: profile.phone,
      logo: profile.logo,
      address: profile.address,
      customerServiceStatus: profile.customerServiceStatus,
      latitude: profile.latitude,
      longitude: profile.longitude,
      lastSyncFromAccounting: profile.lastSyncFromAccounting?.toISOString(),
      lastSyncFromCustomer: profile.lastSyncFromCustomer?.toISOString(),
      profileCompleteness: profile.profileCompleteness,
      isAccountingDataFresh: profile.isAccountingDataFresh,
      isCustomerDataFresh: profile.isCustomerDataFresh,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString()
    };
  }

  /**
   * Classifie la taille de l'entreprise
   */
  private classifyCompanySize(revenue: number, assets: number): string {
    if (revenue < 500000000) return 'small';
    if (revenue < 2000000000) return 'medium';
    return 'large';
  }

  /**
   * Récupère le secteur depuis accounting-service
   */
  private async getSectorFromAccounting(companyId: string): Promise<string> {
    try {
      return await this.accountingIntegrationService.getSMESector(companyId);
    } catch {
      return 'Other';
    }
  }

  /**
   * Récupère le nombre d'employés depuis accounting-service
   */
  private async getEmployeeCountFromAccounting(companyId: string): Promise<number> {
    try {
      return await this.accountingIntegrationService.getSMEEmployeeCount(companyId);
    } catch {
      return 0;
    }
  }

  /**
   * Récupère le site web depuis accounting-service
   */
  private async getWebsiteFromAccounting(companyId: string): Promise<string | undefined> {
    try {
      return await this.accountingIntegrationService.getSMEWebsite(companyId);
    } catch {
      return undefined;
    }
  }
}
