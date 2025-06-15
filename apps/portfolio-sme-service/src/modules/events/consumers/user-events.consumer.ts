import { Controller, Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserCreatedEventData, UserEventTopics, UserStatusChangedEvent, SubscriptionChangedEvent } from '../../../../../../packages/shared/events/kafka-config'; // Corrected import path
// Import services from portfolio-sme-service that need to react to these events
import { PortfolioService } from '../../portfolios/services/portfolio.service'; // Corrected import path
// e.g., import { OrganizationService } from '../organization/services/organization.service'; // If you have an org concept here

@Controller() // Added Controller decorator
@Injectable()
export class UserEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(UserEventsConsumer.name);

  constructor(
    @Inject(PortfolioService) private readonly portfolioService: PortfolioService, // Injected PortfolioService
    // @Inject(OrganizationService) private readonly organizationService: OrganizationService,
  ) {}

  onModuleInit() {
    this.logger.log('UserEventsConsumer initialized and listening for Kafka events...');
  }

  @EventPattern(UserEventTopics.USER_CREATED)
  async handleUserCreated(@Payload() event: UserCreatedEventData): Promise<void> {
    this.logger.log(`Received ${UserEventTopics.USER_CREATED} event: ${JSON.stringify(event)}`);
    // Business logic for portfolio-sme-service when a user is created
    // This service might not directly react to USER_CREATED unless it needs to create
    // a portfolio or some user-specific entity immediately upon registration.
    // Typically, it might be more interested when a user becomes part of an SME/organization
    // that this service manages portfolios for.

    if (event.isOwner && event.organizationDetails && event.organizationDetails.id) {
      this.logger.log(`Processing new SME owner and organization: ${event.organizationDetails.name}`);
      // Potentially create a default portfolio or set up organization-related entities if applicable
      const organizationId = event.organizationDetails.id;
      try {
        await this.portfolioService.createDefaultPortfolioForOrganization(organizationId, event.userId, event.organizationDetails.name);
        this.logger.log(`Default portfolio creation process initiated for organization ${organizationId} by user ${event.userId}`);
      } catch (error: any) { // Explicitly type error as any or Error
        this.logger.error(`Failed to create default portfolio for organization ${organizationId}: ${error.message}`, error.stack);
      }
    } else {
      // Handle non-owner user creation if necessary
      this.logger.log(`User ${event.userId} created, no immediate portfolio action required (not an owner or organizationDetails missing/incomplete).`);
    }
  }

  @EventPattern(UserEventTopics.USER_STATUS_CHANGED)
  async handleUserStatusChanged(@Payload() event: UserStatusChangedEvent): Promise<void> {
    this.logger.log(`Received ${UserEventTopics.USER_STATUS_CHANGED} event: ${JSON.stringify(event)}`);
    // Business logic for portfolio-sme-service when a user's status changes
    // e.g., if user becomes inactive, might need to restrict access to portfolios
    // await this.portfolioService.updateUserAccessBasedOnStatus(event.userId, event.newStatus);
  }

  @EventPattern(UserEventTopics.SUBSCRIPTION_CHANGED)
  async handleSubscriptionChanged(@Payload() event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`Received ${UserEventTopics.SUBSCRIPTION_CHANGED} event: ${JSON.stringify(event)}`);
    // Business logic for portfolio-sme-service when a subscription changes
    // This could affect features available in portfolios, access levels, etc.
    // await this.portfolioService.updatePortfolioFeaturesForSubscription(event.entityId, event.newPlan, event.status);
  }

  // Add other event handlers as needed, for example:
  // @EventPattern(UserEventTopics.USER_DELETED)
  // async handleUserDeleted(@Payload() event: UserDeletedEvent): Promise<void> {
  //   this.logger.log(`Received UserDeletedEvent: ${JSON.stringify(event)}`);
  //   // Logic to handle user deletion, e.g., remove from portfolios, clean up data
  // }
}
