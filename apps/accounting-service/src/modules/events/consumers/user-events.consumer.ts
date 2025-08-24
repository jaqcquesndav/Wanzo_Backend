import { Injectable, Logger } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  UserEventTopics,
  UserStatusChangedEvent,
  UserCreatedEvent, // Base event type
  OrganizationEventTopics,
  OrganizationSyncResponseEvent,
  OrganizationCreatedEvent,
  OrganizationUpdatedEvent,
  // Import other relevant event types from '@wanzobe/shared/events/kafka-config' as needed
} from '@wanzobe/shared/events/kafka-config';
import { SubscriptionChangedEvent, SubscriptionEventTopics } from '@wanzobe/shared/events/subscription-events';
import { ExtendedUserCreatedEvent } from '../types/extended-event-types';

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

  @MessagePattern('user.login')
  async handleUserLogin(@Payload() event: any): Promise<void> {
    this.logger.log(`Received user.login event: ${JSON.stringify(event)}`);
    
    // Vérifier si l'utilisateur a accès au accounting-service
    const hasAccess = event.accessibleApps?.includes('accounting-service');
    
    if (hasAccess && (event.userType === 'FINANCIAL_INSTITUTION' || event.role === 'ADMIN' || event.role === 'SUPERADMIN')) {
      try {
        // Vérifier si l'organisation de l'utilisateur existe dans le service comptable
        if (event.financialInstitutionId || event.companyId) {
          const organizationId = event.financialInstitutionId || event.companyId;
          const organization = await this.organizationService.findById(organizationId);
          
          if (organization) {
            // Mettre à jour la dernière activité de l'organisation
            await this.organizationService.updateLastActivity(organizationId, new Date(event.loginTime));
            this.logger.log(`Updated last activity for organization ${organizationId} due to user login`);
            
            // Si c'est la première connexion, initialiser les comptes par défaut si nécessaire
            if (event.isFirstLogin) {
              await this.accountService.initializeDefaultAccountsForOrganization(organizationId);
              this.logger.log(`Initialized default accounts for new organization ${organizationId}`);
            }
          } else {
            this.logger.warn(`Organization ${organizationId} not found in accounting service`);
          }
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Error processing user.login for accounting service user ${event.userId}: ${errorMessage}`);
      }
    } else {
      this.logger.log(`Skipping user.login event for user ${event.userId} - no access to accounting-service`);
    }
  }

  @MessagePattern(SubscriptionEventTopics.SUBSCRIPTION_STATUS_CHANGED)
  async handleSubscriptionChanged(@Payload() event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`Received ${SubscriptionEventTopics.SUBSCRIPTION_STATUS_CHANGED} event: ${JSON.stringify(event)}`);
    try {
      this.logger.log(`Processing subscription change for organization ${event.entityId}, new plan: ${event.newPlan}, status: ${event.newStatus}`);

      // Ensure entityId is treated as organizationId for this context
      const organizationId = event.entityId; 
      const organization = await this.organizationService.findById(organizationId); // Assuming findById exists and is appropriate
      
      if (!organization) {
        this.logger.error(`Organization with ID ${organizationId} not found. Cannot update subscription.`);
        return;
      }

      const updateDto: Partial<Organization> = {
        subscriptionPlan: event.newPlan,
        subscriptionStatus: event.newStatus,
        subscriptionExpiresAt: event.endDate ? new Date(event.endDate) : undefined
      };

      if (event.newStatus === 'active' && !organization.subscriptionStartedAt) {
        updateDto.subscriptionStartedAt = event.startDate ? new Date(event.startDate) : new Date(); 
      } else if (event.newStatus === 'active' && event.timestamp) {
        // If already active but a new timestamp is provided (e.g. renewal), update start date
        updateDto.subscriptionStartedAt = new Date(event.timestamp);
      }


      await this.organizationService.update(organizationId, updateDto);
      this.logger.log(`Successfully updated subscription details for organization ${organizationId}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling ${SubscriptionEventTopics.SUBSCRIPTION_STATUS_CHANGED} for entity ${event.entityId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  @MessagePattern(UserEventTopics.USER_CREATED)
  async handleUserCreated(@Payload() event: ExtendedUserCreatedEvent): Promise<void> { // Using extended type with organization details
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

  // === ORGANIZATION EVENT HANDLERS ===

  @MessagePattern(OrganizationEventTopics.ORGANIZATION_CREATED)
  async handleOrganizationCreated(@Payload() event: OrganizationCreatedEvent): Promise<void> {
    this.logger.log(`Received ${OrganizationEventTopics.ORGANIZATION_CREATED} event: ${JSON.stringify(event)}`);
    try {
      // Créer ou mettre à jour l'organisation dans le service accounting
      const organizationData = {
        id: event.organizationId,
        name: event.name,
        registrationNumber: event.registrationNumber,
        taxId: event.taxId,
        country: event.country,
        createdAt: new Date(event.timestamp),
        updatedAt: new Date(event.timestamp)
      };

      await this.organizationService.createOrUpdate(organizationData);
      this.logger.log(`Organization ${event.organizationId} synchronized from customer service`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling ${OrganizationEventTopics.ORGANIZATION_CREATED} for organization ${event.organizationId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  @MessagePattern(OrganizationEventTopics.ORGANIZATION_UPDATED)
  async handleOrganizationUpdated(@Payload() event: OrganizationUpdatedEvent): Promise<void> {
    this.logger.log(`Received ${OrganizationEventTopics.ORGANIZATION_UPDATED} event: ${JSON.stringify(event)}`);
    try {
      // Mettre à jour l'organisation dans le service accounting
      await this.organizationService.updateFromEvent(event.organizationId, event.updatedFields);
      this.logger.log(`Organization ${event.organizationId} updated from customer service`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling ${OrganizationEventTopics.ORGANIZATION_UPDATED} for organization ${event.organizationId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  @MessagePattern(OrganizationEventTopics.ORGANIZATION_SYNC_RESPONSE)
  async handleOrganizationSyncResponse(@Payload() event: OrganizationSyncResponseEvent): Promise<void> {
    this.logger.log(`Received ${OrganizationEventTopics.ORGANIZATION_SYNC_RESPONSE} event: ${JSON.stringify(event)}`);
    try {
      if (event.found && event.organizationData) {
        // Créer ou mettre à jour l'organisation avec les données reçues
        const organizationData = {
          id: event.organizationData.id,
          name: event.organizationData.name,
          registrationNumber: event.organizationData.registrationNumber,
          taxId: event.organizationData.taxId,
          vatNumber: event.organizationData.vatNumber,
          address: event.organizationData.address,
          city: event.organizationData.city,
          country: event.organizationData.country,
          phone: event.organizationData.phone,
          email: event.organizationData.email,
          createdAt: new Date(event.organizationData.createdAt),
          updatedAt: new Date(event.organizationData.updatedAt)
        };

        await this.organizationService.createOrUpdate(organizationData);
        this.logger.log(`Organization ${event.organizationId} synchronized successfully from customer service`);
      } else {
        this.logger.warn(`Organization ${event.organizationId} not found in customer service`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling ${OrganizationEventTopics.ORGANIZATION_SYNC_RESPONSE} for organization ${event.organizationId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

}
