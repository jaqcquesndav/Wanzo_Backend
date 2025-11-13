import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { CustomersService } from '../../customers/services/customers.service';
import { CustomersSyncService } from '../../customers/services/customers-sync.service';
import {
  CompanyCoreFullSyncDto,
  InstitutionCoreFullSyncDto,
  CompanyAssetsSyncDto,
  CompanyStocksSyncDto,
  PatrimoineSyncDto,
  InstitutionBranchesSyncDto,
  InstitutionLeadershipSyncDto,
  CustomerProfileIncrementalUpdateDto,
  CriticalChangesNotificationDto,
  RevalidationRequestDto,
} from '../../customers/dtos/customer-sync.dto';

/**
 * Consumer ENRICHI pour recevoir et traiter TOUS les profils clients détaillés
 * depuis le customer-service via Kafka
 * 
 * VERSION 2.1 - Résout tous les problèmes d'incompatibilité
 */
@Injectable()
export class CustomerProfileConsumer {
  private readonly logger = new Logger(CustomerProfileConsumer.name);

  constructor(
    private readonly customersService: CustomersService,
    private readonly syncService: CustomersSyncService,
  ) {}

  // =====================================================
  // EVENTS EXISTANTS (Legacy - Maintenus pour compatibilité)
  // =====================================================

  /**
   * @deprecated Utiliser handleCompanyCoreFullSync pour une synchronisation complète
   * Reçoit et traite les profils complets d'entreprises (PME)
   */
  @EventPattern('admin.customer.company.profile.shared')
  async handleCompanyProfileShared(
    @Payload() profileData: any,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`[LEGACY] Received company profile for customer: ${profileData.customerId}`);
    
    try {
      const customerProfile = await this.customersService.createOrUpdateCustomerProfile({
        customerId: profileData.customerId,
        customerType: 'PME' as any,
        basicInfo: {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          logo: profileData.logo,
          address: profileData.address,
          status: profileData.status as any,
          accountType: profileData.accountType as any,
        },
        detailedProfile: {
          companyProfile: profileData.companyProfile,
          extendedProfile: profileData.extendedProfile,
          patrimoine: profileData.patrimoine,
        },
        metadata: {
          profileCompleteness: profileData.profileCompleteness,
          lastSyncFromCustomerService: profileData.lastProfileUpdate,
          dataSource: 'customer-service-kafka',
        }
      });

      this.logger.log(`[LEGACY] Successfully processed company profile for customer ${profileData.customerId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[LEGACY] Failed to process company profile for customer ${profileData.customerId}: ${err.message}`, err.stack);
    }
  }

  /**
   * @deprecated Utiliser handleInstitutionCoreFullSync pour une synchronisation complète
   * Reçoit et traite les profils complets d'institutions financières
   */
  @EventPattern('admin.customer.institution.profile.shared')
  async handleInstitutionProfileShared(
    @Payload() profileData: any,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`[LEGACY] Received institution profile for customer: ${profileData.customerId}`);
    
    try {
      const customerProfile = await this.customersService.createOrUpdateCustomerProfile({
        customerId: profileData.customerId,
        customerType: 'FINANCIAL_INSTITUTION' as any,
        basicInfo: {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          logo: profileData.logo,
          address: profileData.address,
          status: profileData.status as any,
          accountType: profileData.accountType as any,
        },
        detailedProfile: {
          institutionProfile: profileData.institutionProfile,
          regulatoryProfile: profileData.regulatoryProfile,
        },
        metadata: {
          profileCompleteness: profileData.profileCompleteness,
          lastSyncFromCustomerService: profileData.lastProfileUpdate,
          dataSource: 'customer-service-kafka',
        }
      });

      this.logger.log(`[LEGACY] Successfully processed institution profile for customer ${profileData.customerId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[LEGACY] Failed to process institution profile for customer ${profileData.customerId}: ${err.message}`, err.stack);
    }
  }

  // =====================================================
  // NOUVEAUX EVENTS v2.1 (Synchronisation Complète)
  // =====================================================

  /**
   * Event 1: Synchronisation COMPLÈTE du profil CompanyCore
   * Inclut TOUS les champs manquants identifiés dans l'audit
   */
  @EventPattern('admin.customer.company.core.full.sync')
  async handleCompanyCoreFullSync(
    @Payload() data: CompanyCoreFullSyncDto,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`[v2.1] Full sync CompanyCore for customer: ${data.customerId}`);
    
    try {
      await this.syncService.syncCompanyProfileComplete({
        customerId: data.customerId,
        customerType: data.customerType,
        
        // Informations de base enrichies
        basicInfo: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          logo: data.logo,
          address: data.address,
          status: data.status,
          accountType: data.accountType,
          description: data.description,
          
          // NOUVEAUX champs critiques
          billingContactName: data.billingContactName,
          billingContactEmail: data.billingContactEmail,
          stripeCustomerId: data.stripeCustomerId,
          ownerId: data.ownerId,
          ownerEmail: data.ownerEmail,
          preferences: data.preferences,
        },
        
        // Profil company structuré 100% compatible
        companyProfile: data.companyProfile,
        
        // Profil étendu
        extendedProfile: data.extendedProfile,
        
        // Métadonnées
        profileCompleteness: data.profileCompleteness,
        syncMetadata: {
          lastSyncFromCustomerService: data.lastProfileUpdate,
          dataSource: 'customer-service-kafka-v2.1',
          syncVersion: data.syncVersion || '2.1.0',
          dataVersion: data.dataVersion || '2.1.0',
        },
      });

      this.logger.log(`[v2.1] Successfully synced CompanyCore for customer ${data.customerId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[v2.1] Failed to sync CompanyCore for customer ${data.customerId}: ${err.message}`, err.stack);
      
      // Enregistrer l'erreur pour retry
      await this.syncService.recordSyncError(data.customerId, {
        event: 'admin.customer.company.core.full.sync',
        error: err.message,
        timestamp: new Date().toISOString(),
        payload: data,
      });
    }
  }

  /**
   * Event 2: Synchronisation COMPLÈTE du profil InstitutionCore
   * Inclut TOUS les champs manquants identifiés dans l'audit
   */
  @EventPattern('admin.customer.institution.core.full.sync')
  async handleInstitutionCoreFullSync(
    @Payload() data: InstitutionCoreFullSyncDto,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`[v2.1] Full sync InstitutionCore for customer: ${data.customerId}`);
    
    try {
      await this.syncService.syncInstitutionProfileComplete({
        customerId: data.customerId,
        customerType: data.customerType,
        
        // Informations de base enrichies
        basicInfo: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          logo: data.logo,
          address: data.address,
          status: data.status,
          accountType: data.accountType,
          description: data.description,
          
          // NOUVEAUX champs critiques
          billingContactName: data.billingContactName,
          billingContactEmail: data.billingContactEmail,
          stripeCustomerId: data.stripeCustomerId,
          ownerId: data.ownerId,
          ownerEmail: data.ownerEmail,
          preferences: data.preferences,
        },
        
        // Profil institution structuré 100% compatible
        institutionProfile: data.institutionProfile,
        
        // Profil réglementaire
        regulatoryProfile: data.regulatoryProfile,
        
        // Métadonnées
        profileCompleteness: data.profileCompleteness,
        syncMetadata: {
          lastSyncFromCustomerService: data.lastProfileUpdate,
          dataSource: 'customer-service-kafka-v2.1',
          syncVersion: data.syncVersion || '2.1.0',
          dataVersion: data.dataVersion || '2.1.0',
        },
      });

      this.logger.log(`[v2.1] Successfully synced InstitutionCore for customer ${data.customerId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[v2.1] Failed to sync InstitutionCore for customer ${data.customerId}: ${err.message}`, err.stack);
      
      await this.syncService.recordSyncError(data.customerId, {
        event: 'admin.customer.institution.core.full.sync',
        error: err.message,
        timestamp: new Date().toISOString(),
        payload: data,
      });
    }
  }

  // =====================================================
  // NOUVEAUX EVENTS v2.1 (Patrimoine - Assets & Stocks)
  // =====================================================

  /**
   * Event 3: Synchronisation des ACTIFS (CompanyAssets)
   * RÉSOUT: 0% de couverture actuelle → 100%
   */
  @EventPattern('admin.customer.company.assets.sync')
  async handleCompanyAssetsSync(
    @Payload() data: CompanyAssetsSyncDto,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`[v2.1] Assets sync (${data.syncType}) for customer: ${data.customerId} - ${data.assets.length} assets`);
    
    try {
      await this.syncService.syncCompanyAssets({
        customerId: data.customerId,
        syncType: data.syncType,
        assets: data.assets,
        assetsSummary: data.assetsSummary,
        timestamp: data.timestamp,
      });

      this.logger.log(`[v2.1] Successfully synced ${data.assets.length} assets for customer ${data.customerId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[v2.1] Failed to sync assets for customer ${data.customerId}: ${err.message}`, err.stack);
      
      await this.syncService.recordSyncError(data.customerId, {
        event: 'admin.customer.company.assets.sync',
        error: err.message,
        timestamp: new Date().toISOString(),
        assetsCount: data.assets.length,
      });
    }
  }

  /**
   * Event 4: Synchronisation des STOCKS (CompanyStocks)
   * RÉSOUT: 0% de couverture actuelle → 100%
   */
  @EventPattern('admin.customer.company.stocks.sync')
  async handleCompanyStocksSync(
    @Payload() data: CompanyStocksSyncDto,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`[v2.1] Stocks sync (${data.syncType}) for customer: ${data.customerId} - ${data.stocks.length} items`);
    
    try {
      await this.syncService.syncCompanyStocks({
        customerId: data.customerId,
        syncType: data.syncType,
        stocks: data.stocks,
        stocksSummary: data.stocksSummary,
        timestamp: data.timestamp,
      });

      this.logger.log(`[v2.1] Successfully synced ${data.stocks.length} stock items for customer ${data.customerId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[v2.1] Failed to sync stocks for customer ${data.customerId}: ${err.message}`, err.stack);
      
      await this.syncService.recordSyncError(data.customerId, {
        event: 'admin.customer.company.stocks.sync',
        error: err.message,
        timestamp: new Date().toISOString(),
        stocksCount: data.stocks.length,
      });
    }
  }

  /**
   * Event 5: Synchronisation COMPLÈTE du patrimoine
   * Combine Assets + Stocks en une seule opération
   */
  @EventPattern('admin.customer.company.patrimoine.full.sync')
  async handlePatrimoineFullSync(
    @Payload() data: PatrimoineSyncDto,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`[v2.1] Full patrimoine sync for customer: ${data.customerId}`);
    
    try {
      await this.syncService.syncPatrimoineComplete({
        customerId: data.customerId,
        syncType: data.syncType,
        patrimoine: data.patrimoine,
        timestamp: data.timestamp,
      });

      this.logger.log(`[v2.1] Successfully synced complete patrimoine for customer ${data.customerId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[v2.1] Failed to sync patrimoine for customer ${data.customerId}: ${err.message}`, err.stack);
      
      await this.syncService.recordSyncError(data.customerId, {
        event: 'admin.customer.company.patrimoine.full.sync',
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // =====================================================
  // NOUVEAUX EVENTS v2.1 (Institutions - Branches & Leadership)
  // =====================================================

  /**
   * Event 6: Synchronisation des BRANCHES d'institution
   * RÉSOUT: 17% de couverture actuelle → 100%
   */
  @EventPattern('admin.customer.institution.branches.sync')
  async handleInstitutionBranchesSync(
    @Payload() data: InstitutionBranchesSyncDto,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`[v2.1] Branches sync for customer: ${data.customerId} - ${data.branches.length} branches`);
    
    try {
      await this.syncService.syncInstitutionBranches({
        customerId: data.customerId,
        branches: data.branches,
        timestamp: data.timestamp,
      });

      this.logger.log(`[v2.1] Successfully synced ${data.branches.length} branches for customer ${data.customerId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[v2.1] Failed to sync branches for customer ${data.customerId}: ${err.message}`, err.stack);
      
      await this.syncService.recordSyncError(data.customerId, {
        event: 'admin.customer.institution.branches.sync',
        error: err.message,
        timestamp: new Date().toISOString(),
        branchesCount: data.branches.length,
      });
    }
  }

  /**
   * Event 7: Synchronisation du LEADERSHIP d'institution
   * RÉSOUT: 33% de couverture actuelle → 100%
   */
  @EventPattern('admin.customer.institution.leadership.sync')
  async handleInstitutionLeadershipSync(
    @Payload() data: InstitutionLeadershipSyncDto,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`[v2.1] Leadership sync for customer: ${data.customerId} - ${data.leadership.length} leaders`);
    
    try {
      await this.syncService.syncInstitutionLeadership({
        customerId: data.customerId,
        leadership: data.leadership,
        timestamp: data.timestamp,
      });

      this.logger.log(`[v2.1] Successfully synced ${data.leadership.length} leaders for customer ${data.customerId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[v2.1] Failed to sync leadership for customer ${data.customerId}: ${err.message}`, err.stack);
      
      await this.syncService.recordSyncError(data.customerId, {
        event: 'admin.customer.institution.leadership.sync',
        error: err.message,
        timestamp: new Date().toISOString(),
        leadershipCount: data.leadership.length,
      });
    }
  }

  // =====================================================
  // NOUVEAUX EVENTS v2.1 (Updates Incrémentaux)
  // =====================================================

  /**
   * Event 8: Mise à jour INCRÉMENTALE de champs spécifiques
   * Pour éviter les syncs complets inutiles
   */
  @EventPattern('admin.customer.profile.incremental.update')
  async handleIncrementalUpdate(
    @Payload() data: CustomerProfileIncrementalUpdateDto,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`[v2.1] Incremental update for customer: ${data.customerId} - ${data.fieldPaths.length} fields`);
    
    try {
      await this.syncService.updateProfileFieldsIncremental({
        customerId: data.customerId,
        updatedFields: data.updatedFields,
        fieldPaths: data.fieldPaths,
        timestamp: data.timestamp,
        updateType: data.updateType,
      });

      this.logger.log(`[v2.1] Successfully updated ${data.fieldPaths.length} fields for customer ${data.customerId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[v2.1] Failed incremental update for customer ${data.customerId}: ${err.message}`, err.stack);
      
      await this.syncService.recordSyncError(data.customerId, {
        event: 'admin.customer.profile.incremental.update',
        error: err.message,
        timestamp: new Date().toISOString(),
        fieldsUpdated: data.fieldPaths,
      });
    }
  }

  // =====================================================
  // NOUVEAUX EVENTS v2.1 (Notifications & Workflows)
  // =====================================================

  /**
   * Event 9: Notification de changements CRITIQUES
   * Nécessite approbation admin avant sync
   */
  @EventPattern('admin.customer.profile.critical.changes')
  async handleCriticalChangesNotification(
    @Payload() data: CriticalChangesNotificationDto,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`[v2.1] Critical changes notification for customer: ${data.customerId} - Priority: ${data.priority}`);
    
    try {
      await this.syncService.handleCriticalChanges({
        customerId: data.customerId,
        requestId: data.requestId,
        changes: data.changes,
        syncType: data.syncType,
        requiresApproval: data.requiresApproval,
        priority: data.priority,
        timestamp: data.timestamp,
      });

      this.logger.log(`[v2.1] Critical changes recorded for customer ${data.customerId} - Request: ${data.requestId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[v2.1] Failed to handle critical changes for customer ${data.customerId}: ${err.message}`, err.stack);
    }
  }

  /**
   * Event 10: Demande de REVALIDATION
   * Après changements majeurs dans customer-service
   */
  @EventPattern('admin.customer.profile.revalidation.request')
  async handleRevalidationRequest(
    @Payload() data: RevalidationRequestDto,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`[v2.1] Revalidation request for customer: ${data.customerId} - Priority: ${data.priority}`);
    
    try {
      await this.syncService.scheduleRevalidation({
        customerId: data.customerId,
        requestId: data.requestId,
        reason: data.reason,
        priority: data.priority,
        changedFields: data.changedFields,
        requiresAdminAction: data.requiresAdminAction,
        timestamp: data.timestamp,
      });

      this.logger.log(`[v2.1] Revalidation scheduled for customer ${data.customerId} - Request: ${data.requestId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[v2.1] Failed to schedule revalidation for customer ${data.customerId}: ${err.message}`, err.stack);
    }
  }

  // =====================================================
  // UTILITAIRES & HELPERS
  // =====================================================

  /**
   * Vérifie la santé de la synchronisation
   */
  @EventPattern('admin.customer.sync.health.check')
  async handleSyncHealthCheck(
    @Payload() data: { customerId: string },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`[v2.1] Health check for customer: ${data.customerId}`);
    
    try {
      const health = await this.syncService.checkSyncHealth(data.customerId);
      
      this.logger.log(`[v2.1] Health check completed for ${data.customerId}: ${health.status}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[v2.1] Health check failed for customer ${data.customerId}: ${err.message}`, err.stack);
    }
  }
}
