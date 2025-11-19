import { Logger } from '@nestjs/common';

/**
 * Helper pour les autres services qui doit confirmer
 * la réception et le traitement des événements user
 * 
 * À implémenter dans chaque microservice (accounting, gestion commerciale, portfolio, etc.)
 */
export class UserSyncConfirmationHelper {
  private readonly logger = new Logger(UserSyncConfirmationHelper.name);
  private readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Confirme la réception réussie d'un événement user
   * À appeler après traitement réussi dans le consumer
   */
  async confirmUserSync(
    userId: string,
    kafkaClient: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await kafkaClient.emit('sync.user.confirmed', {
        userId,
        serviceName: this.serviceName,
        timestamp: new Date().toISOString(),
        metadata,
      });

      this.logger.log(`Sync confirmed for user ${userId} in service ${this.serviceName}`);
    } catch (error) {
      this.logger.error(`Failed to send sync confirmation for user ${userId}:`, error);
    }
  }

  /**
   * Signale un échec de synchronisation
   * À appeler en cas d'erreur dans le consumer
   */
  async reportSyncFailure(
    userId: string,
    kafkaClient: any,
    error: Error,
    retryable: boolean = true
  ): Promise<void> {
    try {
      await kafkaClient.emit('sync.user.failed', {
        userId,
        serviceName: this.serviceName,
        error: error.message,
        timestamp: new Date().toISOString(),
        retryable,
      });

      this.logger.error(
        `Sync failure reported for user ${userId} in service ${this.serviceName}: ${error.message}`
      );
    } catch (emitError) {
      this.logger.error(`Failed to report sync failure for user ${userId}:`, emitError);
    }
  }

  /**
   * Demande une réconciliation des données
   * À appeler si des incohérences sont détectées
   */
  async requestReconciliation(
    userId: string,
    kafkaClient: any,
    reason: string
  ): Promise<void> {
    try {
      await kafkaClient.emit('sync.user.reconciliation.request', {
        userId,
        serviceName: this.serviceName,
        reason,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Reconciliation requested for user ${userId} from service ${this.serviceName}: ${reason}`
      );
    } catch (error) {
      this.logger.error(`Failed to request reconciliation for user ${userId}:`, error);
    }
  }
}

/**
 * Exemple d'implémentation dans accounting-service
 * 
 * @Injectable()
 * export class UserEventsConsumer {
 *   private readonly syncHelper: UserSyncConfirmationHelper;
 * 
 *   constructor(
 *     @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
 *     private readonly userService: UserService,
 *   ) {
 *     this.syncHelper = new UserSyncConfirmationHelper('accounting-service');
 *   }
 * 
 *   @MessagePattern(UserEventTopics.USER_CREATED)
 *   async handleUserCreated(@Payload() event: UserCreatedEvent): Promise<void> {
 *     try {
 *       // Vérifier l'idempotence
 *       const existingUser = await this.userService.findByAuth0Id(event.userId);
 *       if (existingUser) {
 *         await this.syncHelper.confirmUserSync(event.userId, this.kafkaClient, {
 *           action: 'skipped',
 *           reason: 'already_exists',
 *         });
 *         return;
 *       }
 * 
 *       // Créer le user
 *       const user = await this.userService.create({
 *         auth0Id: event.userId,
 *         email: event.email,
 *         role: event.role,
 *       });
 * 
 *       // Confirmer le succès
 *       await this.syncHelper.confirmUserSync(event.userId, this.kafkaClient, {
 *         action: 'created',
 *         localUserId: user.id,
 *       });
 * 
 *     } catch (error) {
 *       // Signaler l'échec
 *       await this.syncHelper.reportSyncFailure(
 *         event.userId,
 *         this.kafkaClient,
 *         error as Error,
 *         true // retryable
 *       );
 *     }
 *   }
 * }
 */
