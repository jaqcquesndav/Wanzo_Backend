import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { CustomersSyncService } from '../services/customers-sync.service';

/**
 * Consumer Kafka pour synchroniser les données customers depuis customer-service
 * Écoute les événements customer.* et subscription.* pour maintenir le cache admin
 */
@Controller()
export class CustomerDataConsumer {
  private readonly logger = new Logger(CustomerDataConsumer.name);

  constructor(
    private readonly customersSyncService: CustomersSyncService,
  ) {}

  /**
   * Écoute: admin.customer.company.profile.shared
   * Synchronise le profil complet d'une entreprise PME
   */
  @EventPattern('admin.customer.company.profile.shared')
  async handleCompanyProfileShared(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;

    this.logger.log(
      `[${topic}] Received company profile for customer ${data.customerId} (partition: ${partition}, offset: ${offset})`,
    );

    try {
      // Extraire les données structurées
      const syncData = {
        customerId: data.customerId,
        customerType: 'PME' as const,
        basicInfo: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          logo: data.logo,
          address: data.address,
          status: data.status,
          accountType: data.accountType,
          description: data.companyProfile?.description,
          billingContactName: data.billingContactName,
          billingContactEmail: data.billingContactEmail,
          stripeCustomerId: data.stripeCustomerId,
          ownerId: data.ownerId,
          ownerEmail: data.ownerEmail,
          preferences: data.preferences,
        },
        companyProfile: data.companyProfile,
        extendedProfile: data.extendedProfile,
        profileCompleteness: data.profileCompleteness || {
          percentage: 0,
          missingFields: [],
          completedSections: [],
        },
        syncMetadata: {
          lastSyncFromCustomerService: new Date().toISOString(),
          sourceEvent: topic,
          dataVersion: data.dataVersion || '2.1.0',
          lastProfileUpdate: data.lastProfileUpdate,
        },
      };

      await this.customersSyncService.syncCompanyProfileComplete(syncData);

      // Synchroniser le patrimoine si présent
      if (data.patrimoine) {
        if (data.patrimoine.assets && data.patrimoine.assets.length > 0) {
          await this.customersSyncService.syncCompanyAssets({
            customerId: data.customerId,
            syncType: 'full',
            assets: data.patrimoine.assets,
            assetsSummary: data.patrimoine.assetsSummary || {
              totalValue: data.patrimoine.totalAssetsValue || 0,
              count: data.patrimoine.assets.length,
              currency: 'CDF',
              lastAssetsUpdate: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          });
        }

        if (data.patrimoine.stocks && data.patrimoine.stocks.length > 0) {
          await this.customersSyncService.syncCompanyStocks({
            customerId: data.customerId,
            syncType: 'full',
            stocks: data.patrimoine.stocks,
            stocksSummary: data.patrimoine.stocksSummary || {
              totalValue: data.patrimoine.totalStockValue || 0,
              totalItems: data.patrimoine.stocks.length,
              currency: 'CDF',
              lastStockUpdate: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          });
        }
      }

      this.logger.log(`✓ Company profile synced for customer ${data.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to sync company profile for ${data.customerId}: ${err.message}`,
        err.stack,
      );
      await this.customersSyncService.recordSyncError(data.customerId, {
        error: err.message,
        event: topic,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Écoute: admin.customer.institution.profile.shared
   * Synchronise le profil complet d'une institution financière
   */
  @EventPattern('admin.customer.institution.profile.shared')
  async handleInstitutionProfileShared(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;

    this.logger.log(
      `[${topic}] Received institution profile for customer ${data.customerId} (partition: ${partition}, offset: ${offset})`,
    );

    try {
      const syncData = {
        customerId: data.customerId,
        customerType: 'FINANCIAL_INSTITUTION' as const,
        basicInfo: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          logo: data.logo,
          address: data.address,
          status: data.status,
          accountType: data.accountType,
          description: data.institutionProfile?.description,
          billingContactName: data.billingContactName,
          billingContactEmail: data.billingContactEmail,
          stripeCustomerId: data.stripeCustomerId,
          ownerId: data.ownerId,
          ownerEmail: data.ownerEmail,
          preferences: data.preferences,
        },
        institutionProfile: data.institutionProfile,
        regulatoryProfile: data.regulatoryProfile,
        profileCompleteness: data.profileCompleteness || {
          percentage: 0,
          missingFields: [],
          completedSections: [],
        },
        syncMetadata: {
          lastSyncFromCustomerService: new Date().toISOString(),
          sourceEvent: topic,
          dataVersion: data.dataVersion || '2.1.0',
          lastProfileUpdate: data.lastProfileUpdate,
        },
      };

      await this.customersSyncService.syncInstitutionProfileComplete(syncData);

      // Synchroniser les branches si présentes
      if (data.institutionProfile?.branches && data.institutionProfile.branches.length > 0) {
        await this.customersSyncService.syncInstitutionBranches({
          customerId: data.customerId,
          branches: data.institutionProfile.branches,
          timestamp: new Date().toISOString(),
        });
      }

      // Synchroniser le leadership si présent
      if (data.institutionProfile?.leadership && data.institutionProfile.leadership.length > 0) {
        await this.customersSyncService.syncInstitutionLeadership({
          customerId: data.customerId,
          leadership: data.institutionProfile.leadership,
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.log(`✓ Institution profile synced for customer ${data.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to sync institution profile for ${data.customerId}: ${err.message}`,
        err.stack,
      );
      await this.customersSyncService.recordSyncError(data.customerId, {
        error: err.message,
        event: topic,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Écoute: admin.customer.profile.updated
   * Mise à jour incrémentale du profil
   */
  @EventPattern('admin.customer.profile.updated')
  async handleProfileUpdated(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    
    this.logger.log(`[${topic}] Profile update for customer ${data.customerId}: ${data.updatedFields?.join(', ')}`);

    try {
      await this.customersSyncService.updateProfileFieldsIncremental({
        customerId: data.customerId,
        updatedFields: data.updatedFields || {},
        fieldPaths: data.updatedFields || [],
        timestamp: data.timestamp || new Date().toISOString(),
        updateType: 'partial_sync',
      });

      this.logger.log(`✓ Profile fields updated for customer ${data.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to update profile fields for ${data.customerId}: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Écoute: admin.customer.assets.data
   * Mise à jour des actifs d'une entreprise
   */
  @EventPattern('admin.customer.assets.data')
  async handleAssetsDataUpdate(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    
    this.logger.log(`[${topic}] Assets update for customer ${data.customerId}: ${data.assets?.length || 0} assets`);

    try {
      await this.customersSyncService.syncCompanyAssets({
        customerId: data.customerId,
        syncType: 'full',
        assets: data.assets,
        assetsSummary: data.summary,
        timestamp: data.timestamp,
      });

      this.logger.log(`✓ Assets synced for customer ${data.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to sync assets for ${data.customerId}: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Écoute: admin.customer.stocks.data
   * Mise à jour des stocks d'une entreprise
   */
  @EventPattern('admin.customer.stocks.data')
  async handleStocksDataUpdate(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    
    this.logger.log(`[${topic}] Stocks update for customer ${data.customerId}: ${data.stocks?.length || 0} items`);

    try {
      await this.customersSyncService.syncCompanyStocks({
        customerId: data.customerId,
        syncType: 'full',
        stocks: data.stocks,
        stocksSummary: data.summary,
        timestamp: data.timestamp,
      });

      this.logger.log(`✓ Stocks synced for customer ${data.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to sync stocks for ${data.customerId}: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Écoute: admin.customer.complete.profile.v2_1
   * Profil complet v2.1 (universel)
   */
  @EventPattern('admin.customer.complete.profile.v2_1')
  async handleCompleteProfile(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    
    this.logger.log(`[${topic}] Complete profile (v2.1) for customer ${data.customerId}, type: ${data.customerType}`);

    try {
      if (data.customerType === 'FINANCIAL_INSTITUTION') {
        await this.handleInstitutionProfileShared(data, context);
      } else if (data.customerType === 'COMPANY') {
        await this.handleCompanyProfileShared(data, context);
      }
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to sync complete profile for ${data.customerId}: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Écoute: admin.customer.critical.sync.priority
   * Changements critiques nécessitant attention admin
   */
  @EventPattern('admin.customer.critical.sync.priority')
  async handleCriticalSync(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    
    this.logger.warn(
      `[${topic}] ⚠️ CRITICAL SYNC for customer ${data.customerId}: ${data.syncType} with ${data.changes?.length || 0} changes`,
    );

    try {
      await this.customersSyncService.handleCriticalChanges({
        customerId: data.customerId,
        requestId: data.metadata?.requestId || `${Date.now()}`,
        changes: data.changes,
        syncType: data.syncType,
        requiresApproval: data.metadata?.requiresAdminApproval || false,
        priority: data.priority,
        timestamp: data.timestamp,
      });

      this.logger.log(`✓ Critical sync processed for customer ${data.customerId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to process critical sync for ${data.customerId}: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Écoute: customer.created (événement standard)
   * Nouveau customer créé dans customer-service
   */
  @EventPattern('customer.created')
  async handleCustomerCreated(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    
    this.logger.log(`[${topic}] New customer created: ${data.customerId}, type: ${data.type}`);

    // Pour l'instant juste logger, le profil complet viendra via admin.customer.*.profile.shared
    // On pourrait créer un profil vide ici si nécessaire
  }

  /**
   * Écoute: customer.updated (événement standard)
   * Customer mis à jour dans customer-service
   */
  @EventPattern('customer.updated')
  async handleCustomerUpdated(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    
    this.logger.log(`[${topic}] Customer updated: ${data.customerId}`);

    // Le profil complet viendra via admin.customer.profile.updated
  }

  /**
   * Écoute: customer.status.changed
   * Statut customer changé (validated, suspended, reactivated)
   */
  @EventPattern('customer.status.changed')
  async handleCustomerStatusChanged(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    
    this.logger.log(
      `[${topic}] Customer status changed: ${data.customerId} (${data.previousStatus} → ${data.newStatus})`,
    );

    try {
      await this.customersSyncService.updateProfileFieldsIncremental({
        customerId: data.customerId,
        updatedFields: { status: data.newStatus },
        fieldPaths: ['status'],
        timestamp: data.changedAt,
        updateType: 'field_update',
      });
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to update customer status for ${data.customerId}: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Écoute: subscription.created
   * Nouvelle souscription créée
   */
  @EventPattern('subscription.created')
  async handleSubscriptionCreated(
    @Payload() data: any,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    
    this.logger.log(`[${topic}] Subscription created: ${data.subscriptionId} for customer ${data.customerId}`);

    // TODO: Synchroniser les données de subscription si nécessaire
    // Pour l'instant, les subscriptions sont gérées séparément via finance.controller
  }
}
