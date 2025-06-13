import { Injectable, Logger } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  UserEventTopics,
  UserStatusChangedEvent,
  SubscriptionChangedEvent,
  UserCreatedEventData, // Correctly import UserCreatedEventData
  // Import other relevant event types from '@wanzo/shared/events/kafka-config' as needed
} from '@wanzo/shared/events/kafka-config';

// Import services from accounting-service that will handle the business logic
import { AccountService } from '../../accounts/services/account.service';
import { OrganizationService } from '../../organization/services/organization.service';
import { Organization } from '../../organization/entities/organization.entity'; // Import Organization entity

@Controller() // Required for NestJS to recognize this as a potential message handler container
@Injectable()  // Required for dependency injection
export class UserEventsConsumer {
  private readonly logger = new Logger(UserEventsConsumer.name);

  constructor(
    // Inject necessary accounting-service services here
    private readonly accountService: AccountService,
    private readonly organizationService: OrganizationService,
  ) {}

  @MessagePattern(UserEventTopics.USER_STATUS_CHANGED)
  async handleUserStatusChanged(@Payload() event: UserStatusChangedEvent): Promise<void> {
    this.logger.log(`Received ${UserEventTopics.USER_STATUS_CHANGED} event: ${JSON.stringify(event)}`);
    try {
      // Business logic for accounting-service when a user's status changes:
      this.logger.log(`Processing user status change for user ${event.userId}, new status: ${event.newStatus}`);
      
      // Example: Potentially find organization(s) linked to this user if status change impacts organization-level accounting.
      // const organizations = await this.organizationService.findByUserId(event.userId);
      // if (organizations && organizations.length > 0) {
      //   for (const org of organizations) {
      //     this.logger.log(`User ${event.userId} status changed to ${event.newStatus}, impacting organization ${org.id}`);
      //     // Add specific logic if organization's accounting status needs update based on user status
      //   }
      // }


      if (['inactive', 'suspended', 'deleted'].includes(event.newStatus)) {
        this.logger.warn(`User ${event.userId} is now ${event.newStatus}. Accounting actions may be required for associated entities.`);
        // e.g., if a primary contact becomes inactive, an alert might be needed.
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling ${UserEventTopics.USER_STATUS_CHANGED} for user ${event.userId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  @MessagePattern(UserEventTopics.SUBSCRIPTION_CHANGED)
  async handleSubscriptionChanged(@Payload() event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`Received ${UserEventTopics.SUBSCRIPTION_CHANGED} event: ${JSON.stringify(event)}`);
    try {
      this.logger.log(`Processing subscription change for organization ${event.entityId}, new plan: ${event.newPlan}, status: ${event.status}`);

      // Ensure entityId is treated as organizationId for this context
      const organizationId = event.entityId; 
      const organization = await this.organizationService.findById(organizationId); // Assuming findById exists and is appropriate
      
      if (!organization) {
        this.logger.error(`Organization with ID ${organizationId} not found. Cannot update subscription.`);
        return;
      }

      const updateDto: Partial<Organization> = {
        subscriptionPlan: event.newPlan,
        subscriptionStatus: event.status,
        subscriptionExpiresAt: event.expiresAt ? new Date(event.expiresAt) : undefined, // Changed null to undefined
      };

      if (event.status === 'active' && !organization.subscriptionStartedAt) {
        updateDto.subscriptionStartedAt = event.timestamp ? new Date(event.timestamp) : new Date(); 
      } else if (event.status === 'active' && event.timestamp) {
        // If already active but a new timestamp is provided (e.g. renewal), update start date
        updateDto.subscriptionStartedAt = new Date(event.timestamp);
      }


      await this.organizationService.update(organizationId, updateDto);
      this.logger.log(`Successfully updated subscription details for organization ${organizationId}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling ${UserEventTopics.SUBSCRIPTION_CHANGED} for entity ${event.entityId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  @MessagePattern(UserEventTopics.USER_CREATED)
  async handleUserCreated(@Payload() event: UserCreatedEventData): Promise<void> { // Use UserCreatedEventData
    this.logger.log(`Received ${UserEventTopics.USER_CREATED} event: ${JSON.stringify(event)}`);
    try {
      if (event.isOwner && event.organizationDetails) {
        this.logger.log(`Processing new SME registration for owner ${event.userId} and organization ${event.organizationDetails.name}`);
        
        // Use a dedicated ID for the organization if provided, otherwise, consider alternatives.
        // It's crucial that organizationDetails.id is unique and managed by the emitting service (e.g., auth-service or admin-service).
        const organizationIdToFind = event.organizationDetails.id; 
        if (!organizationIdToFind) {
            this.logger.error(`Organization ID is missing in the event payload for owner ${event.userId}. Cannot create organization.`);
            return;
        }

        let existingOrganization = await this.organizationService.findById(organizationIdToFind);
        
        if (existingOrganization) {
          this.logger.warn(`Organization with ID ${organizationIdToFind} already exists. Skipping creation. Owner: ${event.userId}`);
          // Potentially link user to existing org if that's the desired logic, or update org details.
          // For now, we skip if org exists.
          return;
        }

        const newOrganizationData: Partial<Organization> = {
            id: organizationIdToFind,
            name: event.organizationDetails.name,
            email: event.email, // User's email as organization email initially
            // industry: event.organizationDetails.industry, // Uncomment if available
            // country: event.organizationDetails.country, // Uncomment if available
            subscriptionPlan: event.organizationDetails.initialPlan || 'pack_pme_trial', // Default plan
            subscriptionStatus: 'trial', // Default status for a new organization
            subscriptionStartedAt: event.timestamp ? new Date(event.timestamp) : new Date(),
            // subscriptionExpiresAt: calculate trial expiry if applicable
            createdBy: event.userId, // Store the ID of the user who initiated creation
        };
        
        // Add ownerId to the organization entity if your entity supports it directly
        // newOrganizationData.ownerId = event.userId;


        const newOrganization = await this.organizationService.create(newOrganizationData, event.userId);
        this.logger.log(`Successfully created new organization ${newOrganization.name} with ID ${newOrganization.id} by user ${event.userId}`);

        // Setup default Chart of Accounts for the new organization
        try {
            await this.accountService.setupDefaultChartOfAccounts(newOrganization.id, event.userId); // Pass userId for audit/context
            this.logger.log(`Successfully set up default chart of accounts for organization ${newOrganization.id}`);
        } catch (coaError) {
            const coaErrorMessage = coaError instanceof Error ? coaError.message : 'Unknown error';
            this.logger.error(`Failed to set up default chart of accounts for organization ${newOrganization.id}: ${coaErrorMessage}`, coaError instanceof Error ? coaError.stack : undefined);
            // Decide if this error is critical enough to warrant further action (e.g., rollback, notification)
        }

      } else {
        this.logger.log(`Processing regular user creation for user ${event.userId} (not an owner or no organization details). No new organization created in accounting.`);
        // If a non-owner user is created, and they belong to an organization,
        // you might need to ensure the organization exists and potentially link the user if accounting needs this info.
        // However, this event might be more about user lifecycle than direct accounting org creation.
        // If event.organizationDetails.id is present, you could verify the org exists.
        if (event.organizationDetails && event.organizationDetails.id) {
            const orgExists = await this.organizationService.findById(event.organizationDetails.id);
            if (!orgExists) {
                this.logger.warn(`User ${event.userId} created for non-existent organization ${event.organizationDetails.id}. This might indicate an issue.`);
            } else {
                this.logger.log(`User ${event.userId} associated with existing organization ${orgExists.id}.`);
            }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling ${UserEventTopics.USER_CREATED} for user ${event.userId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  // Add more handlers for other relevant UserEventTopics as needed
  // e.g., @MessagePattern(UserEventTopics.USER_DELETED)
  // async handleUserDeleted(@Payload() event: UserDeletedEvent): Promise<void> { ... }

}
