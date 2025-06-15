import { Inject, Injectable, Logger, OnModuleInit, forwardRef, Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  UserCreatedEventData,
  UserEventTopics,
  UserStatusChangedEvent,
  SubscriptionChangedEvent,
  DataSharingConsentChangedEventData,
  EventUserType,
  EntityType as SharedEntityType, // Import aliased EntityType
} from '../../../../../../packages/shared/events/kafka-config';
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
        // Assuming organizationDetails.id from UserCreatedEventData is the institutionId for new institutional users.
        // This needs to be confirmed based on how auth-service populates this for institutional users.
        // If organizationDetails.id is not the institutionId, this logic will need adjustment.
        const institutionId = event.organizationDetails?.id;
        if (!institutionId && (event.userType === EventUserType.INSTITUTION_ADMIN || event.userType === EventUserType.INSTITUTION_USER)) {
            this.logger.warn(`Institution ID is missing in UserCreatedEventData for institutional user ${event.userId}. Cannot link user to an institution.`);
            // Optionally, create the user without linking, or handle as an error state.
            // For now, we proceed to create/update the user profile without a direct institution link if ID is missing.
        }
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

  @EventPattern(UserEventTopics.USER_STATUS_CHANGED)
  async handleUserStatusChanged(@Payload() event: UserStatusChangedEvent): Promise<void> {
    this.logger.log(`Processing ${UserEventTopics.USER_STATUS_CHANGED} event: ${JSON.stringify(event)}`);
    if (event.userType === EventUserType.INSTITUTION_ADMIN || event.userType === EventUserType.INSTITUTION_USER) {
      try {
        await this.institutionService.updateUserStatus(event.userId, event.newStatus, event.reason);
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

  @EventPattern(UserEventTopics.SUBSCRIPTION_CHANGED)
  async handleSubscriptionChanged(@Payload() event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`Processing ${UserEventTopics.SUBSCRIPTION_CHANGED} event: ${JSON.stringify(event)}`);
    if (event.entityType === SharedEntityType.INSTITUTION) { // Corrected comparison
      try {
        await this.institutionService.updateInstitutionSubscription(
          event.entityId, // This is the institutionId
          event.newPlan,
          event.status,
          event.expiresAt,
        );
        this.logger.log(
          `Successfully processed ${UserEventTopics.SUBSCRIPTION_CHANGED} for entityId: ${event.entityId}`,
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.stack : String(error);
        this.logger.error(
          `Error processing ${UserEventTopics.SUBSCRIPTION_CHANGED} for entityId: ${event.entityId}: ${errorMessage}`,
        );
      }
    } else {
      this.logger.log(
        `Skipping ${UserEventTopics.SUBSCRIPTION_CHANGED} event for entityId: ${event.entityId} - not an institution. EntityType: ${event.entityType}`
      );
    }
  }

  @EventPattern(UserEventTopics.DATA_SHARING_CONSENT_CHANGED)
  async handleDataSharingConsentChanged(@Payload() event: DataSharingConsentChangedEventData): Promise<void> {
    this.logger.log(
      `Processing ${UserEventTopics.DATA_SHARING_CONSENT_CHANGED} event for SME Org ID: ${event.smeOrganizationId}`,
    );
    try {
      await this.prospectService.updateSmeDataSharingConsent(
        event.smeOrganizationId,
        event.shareWithAll,
        event.targetInstitutionTypes === null ? undefined : event.targetInstitutionTypes,
        event.consentingUserId,
      );
      this.logger.log(
        `Successfully processed ${UserEventTopics.DATA_SHARING_CONSENT_CHANGED} for SME Org ID: ${event.smeOrganizationId}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `Error processing ${UserEventTopics.DATA_SHARING_CONSENT_CHANGED} for SME Org ID: ${event.smeOrganizationId}: ${errorMessage}`,
      );
    }
  }
}
