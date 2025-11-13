import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerDetailedProfile, CompanyProfileStructured, InstitutionProfileStructured, PatrimoineStructured, AdminStatus } from '../entities/customer-detailed-profile.entity';
import * as crypto from 'crypto';

/**
 * Service d'extension pour gérer les nouvelles méthodes de synchronisation v2.1
 * Implémente tous les handlers requis par le consumer enrichi
 */
@Injectable()
export class CustomersSyncService {
  private readonly logger = new Logger(CustomersSyncService.name);

  constructor(
    @InjectRepository(CustomerDetailedProfile)
    private detailedProfilesRepository: Repository<CustomerDetailedProfile>,
  ) {}

  /**
   * Synchronisation COMPLÈTE du profil CompanyCore
   */
  async syncCompanyProfileComplete(data: {
    customerId: string;
    customerType: 'PME';
    basicInfo: any;
    companyProfile: CompanyProfileStructured;
    extendedProfile?: any;
    profileCompleteness: any;
    syncMetadata: any;
  }): Promise<CustomerDetailedProfile> {
    this.logger.log(`[v2.1] Syncing complete CompanyCore for ${data.customerId}`);

    let profile = await this.detailedProfilesRepository.findOne({
      where: { customerId: data.customerId }
    });

    const isNew = !profile;

    if (!profile) {
      profile = this.detailedProfilesRepository.create({
        customerId: data.customerId,
        customerType: 'PME',
        profileType: 'company' as any,
        adminStatus: AdminStatus.UNDER_REVIEW,
        complianceRating: 'MEDIUM' as any,
        profileCompleteness: data.profileCompleteness.percentage || 0,
        needsResync: false,
        lastSyncAt: new Date(),
        syncStatus: 'synced',
      });
    }

    // Mise à jour des informations de base enrichies
    profile.name = data.basicInfo.name;
    profile.email = data.basicInfo.email;
    profile.phone = data.basicInfo.phone;
    profile.logo = data.basicInfo.logo;
    profile.address = data.basicInfo.address;
    profile.status = data.basicInfo.status;
    profile.accountType = data.basicInfo.accountType;
    profile.description = data.basicInfo.description;
    
    // NOUVEAUX champs critiques
    profile.billingContactName = data.basicInfo.billingContactName;
    profile.billingContactEmail = data.basicInfo.billingContactEmail;
    profile.stripeCustomerId = data.basicInfo.stripeCustomerId;
    profile.ownerId = data.basicInfo.ownerId;
    profile.ownerEmail = data.basicInfo.ownerEmail;
    profile.preferences = data.basicInfo.preferences;

    // Profil company structuré
    profile.companyProfile = data.companyProfile;
    profile.extendedProfile = data.extendedProfile;
    profile.profileCompletenessDetails = data.profileCompleteness;
    profile.profileCompleteness = data.profileCompleteness.percentage || 0;

    // Métadonnées de sync enrichies
    profile.syncMetadata = {
      ...profile.syncMetadata,
      ...data.syncMetadata,
      lastSyncFromCustomerService: data.syncMetadata.lastSyncFromCustomerService,
      dataChecksum: this.calculateChecksum(profile),
      lastChecksumValidation: new Date().toISOString(),
    };

    profile.syncStatus = 'synced';
    profile.lastSyncAt = new Date();
    profile.dataVersion = data.syncMetadata.dataVersion || '2.1.0';

    // Ajouter événement dans historique
    this.addSyncEvent(profile, {
      event: 'admin.customer.company.core.full.sync',
      fieldsUpdated: Object.keys(data.basicInfo).concat(Object.keys(data.companyProfile)),
      status: 'success',
    });

    const saved = await this.detailedProfilesRepository.save(profile);
    
    this.logger.log(`[v2.1] ${isNew ? 'Created' : 'Updated'} CompanyCore for ${data.customerId}`);
    
    return saved;
  }

  /**
   * Synchronisation COMPLÈTE du profil InstitutionCore
   */
  async syncInstitutionProfileComplete(data: {
    customerId: string;
    customerType: 'FINANCIAL_INSTITUTION';
    basicInfo: any;
    institutionProfile: InstitutionProfileStructured;
    regulatoryProfile?: any;
    profileCompleteness: any;
    syncMetadata: any;
  }): Promise<CustomerDetailedProfile> {
    this.logger.log(`[v2.1] Syncing complete InstitutionCore for ${data.customerId}`);

    let profile = await this.detailedProfilesRepository.findOne({
      where: { customerId: data.customerId }
    });

    const isNew = !profile;

    if (!profile) {
      profile = this.detailedProfilesRepository.create({
        customerId: data.customerId,
        customerType: 'FINANCIAL_INSTITUTION',
        profileType: 'institution' as any,
        adminStatus: AdminStatus.UNDER_REVIEW,
        complianceRating: 'MEDIUM' as any,
        profileCompleteness: data.profileCompleteness.percentage || 0,
        needsResync: false,
        lastSyncAt: new Date(),
        syncStatus: 'synced',
      });
    }

    // Mise à jour des informations de base enrichies
    profile.name = data.basicInfo.name;
    profile.email = data.basicInfo.email;
    profile.phone = data.basicInfo.phone;
    profile.logo = data.basicInfo.logo;
    profile.address = data.basicInfo.address;
    profile.status = data.basicInfo.status;
    profile.accountType = data.basicInfo.accountType;
    profile.description = data.basicInfo.description;
    
    // NOUVEAUX champs critiques
    profile.billingContactName = data.basicInfo.billingContactName;
    profile.billingContactEmail = data.basicInfo.billingContactEmail;
    profile.stripeCustomerId = data.basicInfo.stripeCustomerId;
    profile.ownerId = data.basicInfo.ownerId;
    profile.ownerEmail = data.basicInfo.ownerEmail;
    profile.preferences = data.basicInfo.preferences;

    // Profil institution structuré
    profile.institutionProfile = data.institutionProfile;
    profile.regulatoryProfile = data.regulatoryProfile;
    profile.profileCompletenessDetails = data.profileCompleteness;
    profile.profileCompleteness = data.profileCompleteness.percentage || 0;

    // Métadonnées de sync enrichies
    profile.syncMetadata = {
      ...profile.syncMetadata,
      ...data.syncMetadata,
      dataChecksum: this.calculateChecksum(profile),
      lastChecksumValidation: new Date().toISOString(),
    };

    profile.syncStatus = 'synced';
    profile.lastSyncAt = new Date();
    profile.dataVersion = data.syncMetadata.dataVersion || '2.1.0';

    // Ajouter événement dans historique
    this.addSyncEvent(profile, {
      event: 'admin.customer.institution.core.full.sync',
      fieldsUpdated: Object.keys(data.basicInfo).concat(Object.keys(data.institutionProfile)),
      status: 'success',
    });

    const saved = await this.detailedProfilesRepository.save(profile);
    
    this.logger.log(`[v2.1] ${isNew ? 'Created' : 'Updated'} InstitutionCore for ${data.customerId}`);
    
    return saved;
  }

  /**
   * Synchronisation des ACTIFS
   */
  async syncCompanyAssets(data: {
    customerId: string;
    syncType: 'full' | 'incremental' | 'partial';
    assets: any[];
    assetsSummary: any;
    timestamp: string;
  }): Promise<void> {
    this.logger.log(`[v2.1] Syncing ${data.assets.length} assets for ${data.customerId} (${data.syncType})`);

    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId: data.customerId }
    });

    if (!profile) {
      throw new Error(`Profile not found for customer ${data.customerId}`);
    }

    // Initialiser patrimoine si nécessaire
    if (!profile.patrimoine) {
      profile.patrimoine = {
        assets: [],
        stocks: [],
        assetsSummary: {
          totalValue: 0,
          currency: 'CDF',
          count: 0,
          byCategory: {},
          depreciationRate: 0,
          lastAssetsUpdate: new Date().toISOString(),
        },
        stocksSummary: {
          totalValue: 0,
          currency: 'CDF',
          totalItems: 0,
          lowStockItemsCount: 0,
          outOfStockItemsCount: 0,
          lastStockUpdate: new Date().toISOString(),
        },
        totalAssetsValue: 0,
        totalStocksValue: 0,
        totalPatrimoineValue: 0,
        lastValuationDate: new Date().toISOString(),
      } as PatrimoineStructured;
    }

    // Mettre à jour les actifs selon le type de sync
    if (data.syncType === 'full') {
      profile.patrimoine.assets = data.assets;
    } else if (data.syncType === 'incremental') {
      // Merge incremental: remplacer assets existants, ajouter nouveaux
      const existingAssetIds = new Set(profile.patrimoine.assets.map(a => a.id));
      const newAssets = data.assets.filter(a => !existingAssetIds.has(a.id));
      const updatedAssets = profile.patrimoine.assets.map(existing => {
        const updated = data.assets.find(a => a.id === existing.id);
        return updated || existing;
      });
      profile.patrimoine.assets = [...updatedAssets, ...newAssets];
    }

    // Mettre à jour le résumé
    profile.patrimoine.assetsSummary = data.assetsSummary;
    profile.patrimoine.totalAssetsValue = data.assetsSummary.totalValue;
    profile.patrimoine.totalPatrimoineValue = 
      profile.patrimoine.totalAssetsValue + (profile.patrimoine.totalStocksValue || 0);
    profile.patrimoine.lastValuationDate = data.timestamp;

    // Mettre à jour les métriques financières
    profile.updateFinancialMetricsFromPatrimoine();

    // Ajouter événement dans historique
    this.addSyncEvent(profile, {
      event: 'admin.customer.company.assets.sync',
      fieldsUpdated: ['patrimoine.assets', 'patrimoine.assetsSummary'],
      status: 'success',
    });

    await this.detailedProfilesRepository.save(profile);
    
    this.logger.log(`[v2.1] Assets synced for ${data.customerId}`);
  }

  /**
   * Synchronisation des STOCKS
   */
  async syncCompanyStocks(data: {
    customerId: string;
    syncType: 'full' | 'incremental' | 'partial';
    stocks: any[];
    stocksSummary: any;
    timestamp: string;
  }): Promise<void> {
    this.logger.log(`[v2.1] Syncing ${data.stocks.length} stocks for ${data.customerId} (${data.syncType})`);

    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId: data.customerId }
    });

    if (!profile) {
      throw new Error(`Profile not found for customer ${data.customerId}`);
    }

    // Initialiser patrimoine si nécessaire
    if (!profile.patrimoine) {
      profile.patrimoine = {
        assets: [],
        stocks: [],
        assetsSummary: {
          totalValue: 0,
          currency: 'CDF',
          count: 0,
          byCategory: {},
          depreciationRate: 0,
          lastAssetsUpdate: new Date().toISOString(),
        },
        stocksSummary: {
          totalValue: 0,
          currency: 'CDF',
          totalItems: 0,
          lowStockItemsCount: 0,
          outOfStockItemsCount: 0,
          lastStockUpdate: new Date().toISOString(),
        },
        totalAssetsValue: 0,
        totalStocksValue: 0,
        totalPatrimoineValue: 0,
        lastValuationDate: new Date().toISOString(),
      } as PatrimoineStructured;
    }

    // Mettre à jour les stocks selon le type de sync
    if (data.syncType === 'full') {
      profile.patrimoine.stocks = data.stocks;
    } else if (data.syncType === 'incremental') {
      // Merge incremental: remplacer stocks existants, ajouter nouveaux
      const existingStockIds = new Set(profile.patrimoine.stocks.map(s => s.id));
      const newStocks = data.stocks.filter(s => !existingStockIds.has(s.id));
      const updatedStocks = profile.patrimoine.stocks.map(existing => {
        const updated = data.stocks.find(s => s.id === existing.id);
        return updated || existing;
      });
      profile.patrimoine.stocks = [...updatedStocks, ...newStocks];
    }

    // Mettre à jour le résumé
    profile.patrimoine.stocksSummary = data.stocksSummary;
    profile.patrimoine.totalStocksValue = data.stocksSummary.totalValue;
    profile.patrimoine.totalPatrimoineValue = 
      (profile.patrimoine.totalAssetsValue || 0) + profile.patrimoine.totalStocksValue;
    profile.patrimoine.lastValuationDate = data.timestamp;

    // Mettre à jour les métriques d'inventaire
    profile.inventoryMetrics = data.stocksSummary.rotationMetrics;

    // Mettre à jour les métriques financières
    profile.updateFinancialMetricsFromPatrimoine();

    // Ajouter événement dans historique
    this.addSyncEvent(profile, {
      event: 'admin.customer.company.stocks.sync',
      fieldsUpdated: ['patrimoine.stocks', 'patrimoine.stocksSummary'],
      status: 'success',
    });

    await this.detailedProfilesRepository.save(profile);
    
    this.logger.log(`[v2.1] Stocks synced for ${data.customerId}`);
  }

  /**
   * Synchronisation COMPLÈTE du patrimoine
   */
  async syncPatrimoineComplete(data: {
    customerId: string;
    syncType: 'full' | 'incremental';
    patrimoine: PatrimoineStructured;
    timestamp: string;
  }): Promise<void> {
    this.logger.log(`[v2.1] Full patrimoine sync for ${data.customerId}`);

    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId: data.customerId }
    });

    if (!profile) {
      throw new Error(`Profile not found for customer ${data.customerId}`);
    }

    profile.patrimoine = data.patrimoine;
    profile.updateFinancialMetricsFromPatrimoine();

    this.addSyncEvent(profile, {
      event: 'admin.customer.company.patrimoine.full.sync',
      fieldsUpdated: ['patrimoine'],
      status: 'success',
    });

    await this.detailedProfilesRepository.save(profile);
    
    this.logger.log(`[v2.1] Patrimoine synced for ${data.customerId}`);
  }

  /**
   * Synchronisation des BRANCHES d'institution
   */
  async syncInstitutionBranches(data: {
    customerId: string;
    branches: any[];
    timestamp: string;
  }): Promise<void> {
    this.logger.log(`[v2.1] Syncing ${data.branches.length} branches for ${data.customerId}`);

    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId: data.customerId }
    });

    if (!profile) {
      throw new Error(`Profile not found for customer ${data.customerId}`);
    }

    if (!profile.institutionProfile) {
      throw new Error(`Institution profile not found for customer ${data.customerId}`);
    }

    profile.institutionProfile.branches = data.branches;
    profile.institutionProfile.totalBranches = data.branches.length;

    this.addSyncEvent(profile, {
      event: 'admin.customer.institution.branches.sync',
      fieldsUpdated: ['institutionProfile.branches'],
      status: 'success',
    });

    await this.detailedProfilesRepository.save(profile);
    
    this.logger.log(`[v2.1] Branches synced for ${data.customerId}`);
  }

  /**
   * Synchronisation du LEADERSHIP d'institution
   */
  async syncInstitutionLeadership(data: {
    customerId: string;
    leadership: any[];
    timestamp: string;
  }): Promise<void> {
    this.logger.log(`[v2.1] Syncing ${data.leadership.length} leaders for ${data.customerId}`);

    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId: data.customerId }
    });

    if (!profile) {
      throw new Error(`Profile not found for customer ${data.customerId}`);
    }

    if (!profile.institutionProfile) {
      throw new Error(`Institution profile not found for customer ${data.customerId}`);
    }

    profile.institutionProfile.leadership = data.leadership;

    this.addSyncEvent(profile, {
      event: 'admin.customer.institution.leadership.sync',
      fieldsUpdated: ['institutionProfile.leadership'],
      status: 'success',
    });

    await this.detailedProfilesRepository.save(profile);
    
    this.logger.log(`[v2.1] Leadership synced for ${data.customerId}`);
  }

  /**
   * Mise à jour INCRÉMENTALE de champs
   */
  async updateProfileFieldsIncremental(data: {
    customerId: string;
    updatedFields: Record<string, any>;
    fieldPaths: string[];
    timestamp: string;
    updateType: 'field_update' | 'partial_sync';
  }): Promise<void> {
    this.logger.log(`[v2.1] Incremental update for ${data.customerId}: ${data.fieldPaths.join(', ')}`);

    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId: data.customerId }
    });

    if (!profile) {
      throw new Error(`Profile not found for customer ${data.customerId}`);
    }

    // Appliquer les mises à jour
    for (const [field, value] of Object.entries(data.updatedFields)) {
      this.setNestedProperty(profile, field, value);
    }

    this.addSyncEvent(profile, {
      event: 'admin.customer.profile.incremental.update',
      fieldsUpdated: data.fieldPaths,
      status: 'success',
    });

    await this.detailedProfilesRepository.save(profile);
    
    this.logger.log(`[v2.1] Incremental update completed for ${data.customerId}`);
  }

  /**
   * Gestion des changements CRITIQUES
   */
  async handleCriticalChanges(data: {
    customerId: string;
    requestId: string;
    changes: any[];
    syncType: string;
    requiresApproval?: boolean;
    priority: string;
    timestamp: string;
  }): Promise<void> {
    this.logger.log(`[v2.1] Critical changes for ${data.customerId}: ${data.requestId}`);

    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId: data.customerId }
    });

    if (!profile) {
      throw new Error(`Profile not found for customer ${data.customerId}`);
    }

    if (!profile.criticalChanges) {
      profile.criticalChanges = [];
    }

    profile.criticalChanges.push({
      requestId: data.requestId,
      changes: data.changes,
      syncType: data.syncType,
      requiresApproval: data.requiresApproval,
      status: data.requiresApproval ? 'pending_approval' : 'pending_sync',
      createdAt: data.timestamp,
    });

    if (data.requiresApproval) {
      profile.requiresAttention = true;
      profile.reviewPriority = data.priority as any;
    }

    await this.detailedProfilesRepository.save(profile);
    
    this.logger.log(`[v2.1] Critical changes recorded for ${data.customerId}`);
  }

  /**
   * Planification de la REVALIDATION
   */
  async scheduleRevalidation(data: {
    customerId: string;
    requestId: string;
    reason: string;
    priority: string;
    changedFields?: string[];
    requiresAdminAction?: boolean;
    timestamp: string;
  }): Promise<void> {
    this.logger.log(`[v2.1] Revalidation requested for ${data.customerId}: ${data.requestId}`);

    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId: data.customerId }
    });

    if (!profile) {
      throw new Error(`Profile not found for customer ${data.customerId}`);
    }

    profile.revalidationScheduled = {
      reason: data.reason,
      priority: data.priority,
      requestId: data.requestId,
      scheduledAt: data.timestamp,
      status: 'pending',
    };

    if (data.requiresAdminAction) {
      profile.requiresAttention = true;
      profile.reviewPriority = data.priority as any;
    }

    await this.detailedProfilesRepository.save(profile);
    
    this.logger.log(`[v2.1] Revalidation scheduled for ${data.customerId}`);
  }

  /**
   * Vérification de la santé de synchronisation
   */
  async checkSyncHealth(customerId: string): Promise<any> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (!profile) {
      return { status: 'not_found', customerId };
    }

    const lastSync = profile.lastSyncAt;
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    return {
      status: hoursSinceSync > 24 ? 'outdated' : 'healthy',
      customerId,
      lastSyncAt: lastSync,
      hoursSinceSync,
      syncStatus: profile.syncStatus,
      needsResync: profile.needsResync || hoursSinceSync > 24,
      dataVersion: profile.dataVersion,
      syncHistory: profile.syncMetadata.syncHistory?.slice(0, 3),
    };
  }

  /**
   * Enregistrement des erreurs de sync
   */
  async recordSyncError(customerId: string, errorData: any): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (!profile) {
      this.logger.error(`Cannot record sync error: Profile not found for ${customerId}`);
      return;
    }

    if (!profile.syncErrors) {
      profile.syncErrors = [];
    }

    profile.syncErrors.unshift({
      timestamp: new Date().toISOString(),
      error: errorData.error,
      details: errorData,
    });

    // Garde seulement les 20 dernières erreurs
    if (profile.syncErrors.length > 20) {
      profile.syncErrors = profile.syncErrors.slice(0, 20);
    }

    profile.syncStatus = 'sync_failed';

    await this.detailedProfilesRepository.save(profile);
    
    this.logger.error(`Sync error recorded for ${customerId}: ${errorData.error}`);
  }

  // =====================================================
  // HELPERS PRIVÉS
  // =====================================================

  private calculateChecksum(profile: CustomerDetailedProfile): string {
    const data = JSON.stringify({
      name: profile.name,
      email: profile.email,
      companyProfile: profile.companyProfile,
      institutionProfile: profile.institutionProfile,
      patrimoine: profile.patrimoine,
    });
    return crypto.createHash('md5').update(data).digest('hex');
  }

  private addSyncEvent(profile: CustomerDetailedProfile, event: {
    event: string;
    fieldsUpdated: string[];
    status: 'success' | 'failed' | 'partial';
    errorMessage?: string;
  }): void {
    profile.addSyncEvent(event);
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((o, k) => {
      if (!o[k]) o[k] = {};
      return o[k];
    }, obj);
    target[lastKey] = value;
  }
}
