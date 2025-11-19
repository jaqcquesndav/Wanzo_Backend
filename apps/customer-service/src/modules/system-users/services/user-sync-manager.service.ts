import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User, SyncStatus } from '../entities/user.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';

/**
 * Service de gestion de la synchronisation Kafka des utilisateurs
 * Gère les retry, l'idempotence et la réconciliation
 */
@Injectable()
export class UserSyncManagerService {
  private readonly logger = new Logger(UserSyncManagerService.name);
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly RETRY_DELAY_MS = [1000, 5000, 15000, 60000, 300000]; // Exponential backoff

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly customerEventsProducer: CustomerEventsProducer,
  ) {}

  /**
   * Initialise le statut de synchronisation pour un nouveau user
   */
  initializeSyncStatus(user: User, servicesToSync: string[]): void {
    user.syncStatus = SyncStatus.PENDING;
    user.lastSyncAttempt = undefined;
    user.syncRetryCount = 0;
    user.syncMetadata = {
      servicesToSync,
      syncedServices: [],
      failedServices: [],
      lastSuccessfulSync: {},
    };
  }

  /**
   * Tente de synchroniser un user avec retry
   */
  async syncUserWithRetry(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.error(`User ${userId} not found for sync`);
      return false;
    }

    // Vérifier si on a dépassé le nombre max de retry
    if (user.syncRetryCount >= this.MAX_RETRY_ATTEMPTS) {
      this.logger.error(`Max retry attempts reached for user ${userId}`);
      user.syncStatus = SyncStatus.FAILED;
      await this.userRepository.save(user);
      return false;
    }

    try {
      user.syncStatus = SyncStatus.IN_PROGRESS;
      user.lastSyncAttempt = new Date();
      await this.userRepository.save(user);

      // Émettre les événements Kafka
      await this.customerEventsProducer.emitUserCreated(user);

      // Marquer comme synchronisé
      user.syncStatus = SyncStatus.SYNCED;
      user.lastSyncError = undefined;
      
      if (!user.syncMetadata) {
        user.syncMetadata = {
          servicesToSync: [],
          syncedServices: [],
          failedServices: [],
          lastSuccessfulSync: {},
        };
      }
      
      user.syncMetadata.lastSuccessfulSync = {
        ...user.syncMetadata.lastSuccessfulSync,
        timestamp: new Date().toISOString(),
      };

      await this.userRepository.save(user);
      this.logger.log(`User ${userId} successfully synced`);
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Sync failed for user ${userId}: ${errorMessage}`);

      user.syncRetryCount += 1;
      user.syncStatus = SyncStatus.RETRY;
      user.lastSyncError = errorMessage;

      await this.userRepository.save(user);
      
      // Programmer un retry
      await this.scheduleRetry(userId, user.syncRetryCount);
      return false;
    }
  }

  /**
   * Programme un retry avec exponential backoff
   */
  private async scheduleRetry(userId: string, retryCount: number): Promise<void> {
    const delay = this.RETRY_DELAY_MS[Math.min(retryCount - 1, this.RETRY_DELAY_MS.length - 1)];
    
    this.logger.log(`Scheduling retry ${retryCount} for user ${userId} in ${delay}ms`);

    setTimeout(async () => {
      await this.syncUserWithRetry(userId);
    }, delay);
  }

  /**
   * Vérifie et resynchronise les users en échec
   * Exécuté toutes les 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkFailedSyncs(): Promise<void> {
    this.logger.log('Checking failed syncs...');

    try {
      const failedUsers = await this.userRepository.find({
        where: [
          { syncStatus: SyncStatus.RETRY },
          { syncStatus: SyncStatus.FAILED },
        ],
      });

      this.logger.log(`Found ${failedUsers.length} users with sync issues`);

      for (const user of failedUsers) {
        // Réinitialiser le compteur si ça fait plus de 24h
        const lastAttempt = user.lastSyncAttempt;
        if (lastAttempt) {
          const hoursSinceLastAttempt = (Date.now() - lastAttempt.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastAttempt > 24) {
            this.logger.log(`Resetting retry count for user ${user.id} (24h passed)`);
            user.syncRetryCount = 0;
            await this.userRepository.save(user);
          }
        }

        // Réessayer la synchronisation
        if (user.syncRetryCount < this.MAX_RETRY_ATTEMPTS) {
          await this.syncUserWithRetry(user.id);
        }
      }
    } catch (error) {
      this.logger.error('Error checking failed syncs:', error);
    }
  }

  /**
   * Marque un service comme synchronisé (appelé par les consumers)
   */
  async markServiceSynced(userId: string, serviceName: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.syncMetadata) return;

    if (!user.syncMetadata.syncedServices) {
      user.syncMetadata.syncedServices = [];
    }

    if (!user.syncMetadata.syncedServices.includes(serviceName)) {
      user.syncMetadata.syncedServices.push(serviceName);
      
      if (!user.syncMetadata.lastSuccessfulSync) {
        user.syncMetadata.lastSuccessfulSync = {};
      }
      
      user.syncMetadata.lastSuccessfulSync[serviceName] = new Date().toISOString();

      // Vérifier si tous les services sont synchronisés
      const allSynced = user.syncMetadata.servicesToSync?.every(
        s => user.syncMetadata?.syncedServices?.includes(s)
      );

      if (allSynced) {
        user.syncStatus = SyncStatus.SYNCED;
      }

      await this.userRepository.save(user);
      this.logger.log(`Service ${serviceName} marked as synced for user ${userId}`);
    }
  }

  /**
   * Marque un service comme en échec
   */
  async markServiceFailed(userId: string, serviceName: string, error: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.syncMetadata) return;

    if (!user.syncMetadata.failedServices) {
      user.syncMetadata.failedServices = [];
    }

    if (!user.syncMetadata.failedServices.includes(serviceName)) {
      user.syncMetadata.failedServices.push(serviceName);
    }

    user.lastSyncError = `${serviceName}: ${error}`;
    await this.userRepository.save(user);

    this.logger.error(`Service ${serviceName} failed for user ${userId}: ${error}`);
  }

  /**
   * Réconcilie les données entre customer-service et les autres services
   */
  async reconcileUserData(userId: string): Promise<{
    isConsistent: boolean;
    discrepancies: string[];
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { isConsistent: false, discrepancies: ['User not found'] };
    }

    const discrepancies: string[] = [];

    // Vérifier le statut de synchronisation
    if (!user.syncMetadata) {
      discrepancies.push('No sync metadata found');
      return { isConsistent: false, discrepancies };
    }

    const { servicesToSync = [], syncedServices = [], failedServices = [] } = user.syncMetadata;

    // Services qui devraient être synchronisés mais ne le sont pas
    const missingSyncs = servicesToSync.filter(s => !syncedServices.includes(s));
    if (missingSyncs.length > 0) {
      discrepancies.push(`Not synced with: ${missingSyncs.join(', ')}`);
    }

    // Services en échec
    if (failedServices.length > 0) {
      discrepancies.push(`Failed services: ${failedServices.join(', ')}`);
    }

    // Vérifier la cohérence des données
    if (user.customerId && user.syncStatus === SyncStatus.SYNCED) {
      // TODO: Appeler les APIs des autres services pour vérifier la cohérence
      // const accountingUser = await this.accountingServiceClient.getUser(userId);
      // if (!accountingUser) discrepancies.push('User not found in accounting-service');
    }

    return {
      isConsistent: discrepancies.length === 0,
      discrepancies,
    };
  }

  /**
   * Force la resynchronisation complète d'un user
   */
  async forceResync(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    // Réinitialiser le statut
    user.syncStatus = SyncStatus.PENDING;
    user.syncRetryCount = 0;
    user.lastSyncError = undefined;
    
    if (user.syncMetadata) {
      user.syncMetadata.syncedServices = [];
      user.syncMetadata.failedServices = [];
    }

    await this.userRepository.save(user);
    
    // Relancer la synchronisation
    await this.syncUserWithRetry(userId);
    
    this.logger.log(`Forced resync initiated for user ${userId}`);
  }

  /**
   * Obtient les statistiques de synchronisation
   */
  async getSyncStats(): Promise<{
    pending: number;
    inProgress: number;
    synced: number;
    failed: number;
    retry: number;
    total: number;
  }> {
    const [pending, inProgress, synced, failed, retry, total] = await Promise.all([
      this.userRepository.count({ where: { syncStatus: SyncStatus.PENDING } }),
      this.userRepository.count({ where: { syncStatus: SyncStatus.IN_PROGRESS } }),
      this.userRepository.count({ where: { syncStatus: SyncStatus.SYNCED } }),
      this.userRepository.count({ where: { syncStatus: SyncStatus.FAILED } }),
      this.userRepository.count({ where: { syncStatus: SyncStatus.RETRY } }),
      this.userRepository.count(),
    ]);

    return { pending, inProgress, synced, failed, retry, total };
  }

  /**
   * Vérifie l'idempotence d'un événement
   */
  isEventProcessed(user: User, serviceName: string): boolean {
    return user.syncMetadata?.syncedServices?.includes(serviceName) || false;
  }

  /**
   * Nettoie les anciennes tentatives de sync (plus de 30 jours)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldSyncAttempts(): Promise<void> {
    this.logger.log('Cleaning up old sync attempts...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({
          syncRetryCount: 0,
          lastSyncError: undefined,
        })
        .where('syncStatus = :status', { status: SyncStatus.FAILED })
        .andWhere('lastSyncAttempt < :date', { date: thirtyDaysAgo })
        .execute();

      this.logger.log(`Cleaned up ${result.affected} old sync attempts`);
    } catch (error) {
      this.logger.error('Error cleaning up old sync attempts:', error);
    }
  }
}
