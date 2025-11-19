import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserSyncManagerService } from '../../system-users/services/user-sync-manager.service';

/**
 * Consumer pour les confirmations de synchronisation des autres services
 * Gère les ACK/NACK pour la réconciliation
 */
@Injectable()
export class SyncConfirmationConsumer {
  private readonly logger = new Logger(SyncConfirmationConsumer.name);

  constructor(
    private readonly userSyncManager: UserSyncManagerService,
  ) {}

  /**
   * Confirmation de synchronisation réussie d'un service
   */
  @EventPattern('sync.user.confirmed')
  async handleSyncConfirmed(@Payload() event: {
    userId: string;
    serviceName: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    this.logger.log(
      `Received sync confirmation from ${event.serviceName} for user ${event.userId}`
    );

    try {
      await this.userSyncManager.markServiceSynced(event.userId, event.serviceName);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error processing sync confirmation from ${event.serviceName}: ${errorMessage}`
      );
    }
  }

  /**
   * Échec de synchronisation d'un service
   */
  @EventPattern('sync.user.failed')
  async handleSyncFailed(@Payload() event: {
    userId: string;
    serviceName: string;
    error: string;
    timestamp: string;
    retryable: boolean;
  }): Promise<void> {
    this.logger.error(
      `Received sync failure from ${event.serviceName} for user ${event.userId}: ${event.error}`
    );

    try {
      await this.userSyncManager.markServiceFailed(
        event.userId,
        event.serviceName,
        event.error
      );

      // Si l'erreur est retryable, programmer un nouveau essai
      if (event.retryable) {
        this.logger.log(
          `Scheduling retry for user ${event.userId} on service ${event.serviceName}`
        );
        // Le cron job du UserSyncManagerService s'en occupera
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error processing sync failure from ${event.serviceName}: ${errorMessage}`
      );
    }
  }

  /**
   * Demande de réconciliation depuis un autre service
   */
  @EventPattern('sync.user.reconciliation.request')
  async handleReconciliationRequest(@Payload() event: {
    userId: string;
    serviceName: string;
    reason: string;
  }): Promise<void> {
    this.logger.log(
      `Received reconciliation request from ${event.serviceName} for user ${event.userId}`
    );

    try {
      const result = await this.userSyncManager.reconcileUserData(event.userId);

      // Émettre le résultat de la réconciliation
      // TODO: Implémenter l'émission via CustomerEventsProducer
      this.logger.log(
        `Reconciliation for user ${event.userId}: consistent=${result.isConsistent}, discrepancies=${result.discrepancies.join(', ')}`
      );

      // Si des incohérences sont détectées, forcer une resynchronisation
      if (!result.isConsistent) {
        await this.userSyncManager.forceResync(event.userId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing reconciliation request: ${errorMessage}`);
    }
  }
}
