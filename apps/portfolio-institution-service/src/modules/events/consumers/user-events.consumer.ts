import { Inject, Injectable, Logger, OnModuleInit, forwardRef, Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  UserCreatedEventData,
  UserEventTopics,
  UserStatusChangedEvent,
  EventUserType,
} from '@wanzobe/shared';
import { SubscriptionChangedEvent, SubscriptionEventTopics } from '@wanzobe/shared';
import { InstitutionService } from '../../institution/services/institution.service';
import { ProspectService } from '../../prospection/services/prospect.service';

@Controller() // Added @Controller() decorator
@Injectable()
export class UserEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(UserEventsConsumer.name);

  constructor(
    @Inject(forwardRef(() => InstitutionService)) private readonly institutionService: InstitutionService,
    @Inject(forwardRef(() => ProspectService)) private readonly prospectService: ProspectService,
  ) {}

  onModuleInit() {
    this.logger.log('UserEventsConsumer for portfolio-institution initialized and listening...');
  }

  @EventPattern(UserEventTopics.USER_CREATED)
  async handleUserCreated(@Payload() event: UserCreatedEventData): Promise<void> {
    this.logger.log(`Processing ${UserEventTopics.USER_CREATED} event: ${JSON.stringify(event)}`);
    if (event.userType === EventUserType.INSTITUTION_ADMIN || event.userType === EventUserType.INSTITUTION_USER) {
      this.logger.log(`Identified institutional user for creation/update: ${event.userId} (${event.email})`);
      try {
        // Correction : UserCreatedEventData n'a pas organizationDetails
        // const institutionId = event.organizationDetails?.id;
        const institutionId = undefined;
        await this.institutionService.createOrUpdateInstitutionUserProfileFromEvent(event, institutionId);
        this.logger.log(
          `Successfully processed ${UserEventTopics.USER_CREATED} for authUserId: ${event.userId}`,
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.stack : String(error);
        this.logger.error(
          `Error processing ${UserEventTopics.USER_CREATED} for authUserId: ${event.userId}: ${errorMessage}`,
        );
      }
    } else {
      this.logger.log(
        `Skipping ${UserEventTopics.USER_CREATED} event for user ${event.userId} - not identified as institutional user. UserType: ${event.userType}`,
      );
    }
  }

  @EventPattern('user.login')
  async handleUserLogin(@Payload() event: any): Promise<void> {
    this.logger.log(`Processing user.login event: ${JSON.stringify(event)}`);
    
    // Vérifier si l'utilisateur a accès au portfolio-institution-service
    const hasAccess = event.accessibleApps?.includes('portfolio-institution-service');
    
    if (hasAccess && (event.userType === 'FINANCIAL_INSTITUTION' || event.role === 'ADMIN' || event.role === 'SUPERADMIN')) {
      try {
        // Appel de la méthode handleUserLogin implémentée
        await this.institutionService.handleUserLogin({
          userId: event.userId,
          auth0Id: event.auth0Id,
          email: event.email,
          financialInstitutionId: event.financialInstitutionId,
          userType: event.userType,
          role: event.role,
          loginTime: event.loginTime,
          isFirstLogin: event.isFirstLogin,
        });
        
        this.logger.log(`User login processed successfully for institutional user ${event.userId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.stack : String(error);
        this.logger.error(`Error processing user.login for user ${event.userId}: ${errorMessage}`);
      }
    } else {
      this.logger.log(`Skipping user.login event for user ${event.userId} - no access to portfolio-institution-service`);
    }
  }

  @EventPattern(UserEventTopics.USER_STATUS_CHANGED)
  async handleUserStatusChanged(@Payload() event: UserStatusChangedEvent): Promise<void> {
    this.logger.log(`Processing ${UserEventTopics.USER_STATUS_CHANGED} event: ${JSON.stringify(event)}`);
    if (event.userType === EventUserType.INSTITUTION_ADMIN || event.userType === EventUserType.INSTITUTION_USER) {
      try {
        // Correction : UserStatusChangedEvent n'a pas de champ reason dans la version utilisée par le service
        await this.institutionService.updateUserStatus(event.userId, event.newStatus);
        this.logger.log(
          `Successfully processed ${UserEventTopics.USER_STATUS_CHANGED} for authUserId: ${event.userId}`,
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.stack : String(error);
        this.logger.error(
          `Error processing ${UserEventTopics.USER_STATUS_CHANGED} for authUserId: ${event.userId}: ${errorMessage}`,
        );
      }
    } else {
      this.logger.log(
        `Skipping ${UserEventTopics.USER_STATUS_CHANGED} event for user ${event.userId} - not an institutional user. UserType: ${event.userType}`
      );
    }
  }

  @EventPattern(SubscriptionEventTopics.SUBSCRIPTION_STATUS_CHANGED)
  async handleSubscriptionChanged(@Payload() event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`Processing ${SubscriptionEventTopics.SUBSCRIPTION_STATUS_CHANGED} event: ${JSON.stringify(event)}`);
    try {
      // Utiliser event.newStatus et event.endDate (pas status ni expiresAt)
      await this.institutionService.updateInstitutionSubscription(
        event.entityId,
        event.newPlan,
        event.newStatus,
        event.endDate ? new Date(event.endDate) : undefined,
      );
      this.logger.log(
        `Successfully processed ${SubscriptionEventTopics.SUBSCRIPTION_STATUS_CHANGED} for entityId: ${event.entityId}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `Error processing ${SubscriptionEventTopics.SUBSCRIPTION_STATUS_CHANGED} for entityId: ${event.entityId}: ${errorMessage}`,
      );
    }
  }
}
