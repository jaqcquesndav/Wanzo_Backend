import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserService } from '../../users/services/user.service';
import { CustomerService } from '../../customers/services/customer.service';
import { 
  UserEventTopics, 
  UserCreatedEvent, 
  EventUserType,
  UserStatusChangedEvent,
  UserRoleChangedEvent 
} from '../../../../../../packages/shared/events/kafka-config';

@Injectable()
export class ExternalUserEventsConsumer {
  private readonly logger = new Logger(ExternalUserEventsConsumer.name);

  constructor(
    private readonly userService: UserService,
    private readonly customerService: CustomerService,
  ) {}

  @EventPattern(UserEventTopics.USER_CREATED)
  async handleExternalUserCreated(@Payload() event: UserCreatedEvent): Promise<void> {
    this.logger.log(`Received external ${UserEventTopics.USER_CREATED} event: ${JSON.stringify(event)}`);
    
    try {
      // Check if this user is being created by an external service (not customer-service itself)
      // We can identify this by checking if the user already exists in our database
      const existingUser = await this.userService.findUserEntityByAuth0Id(event.userId).catch(() => null);
      
      if (existingUser) {
        this.logger.log(`User ${event.userId} already exists in customer-service, skipping creation`);
        return;
      }

      // Find the customer/organization this user should belong to
      let customer;
      if (event.customerAccountId) {
        customer = await this.customerService.findById(event.customerAccountId).catch(() => null);
      }

      if (!customer) {
        this.logger.warn(`Customer ${event.customerAccountId} not found for user ${event.userId}, skipping user creation`);
        return;
      }

      // Determine user role based on the event user type
      let role;
      let userType;
      let isCompanyOwner = false;

      switch (event.userType) {
        case EventUserType.SME_USER:
          role = 'CUSTOMER_USER';
          userType = 'SME';
          break;
        case EventUserType.SME_OWNER:
          role = 'CUSTOMER_ADMIN';
          userType = 'SME';
          isCompanyOwner = true;
          break;
        case EventUserType.INSTITUTION_USER:
          role = 'CUSTOMER_USER';
          userType = 'FINANCIAL_INSTITUTION';
          break;
        case EventUserType.INSTITUTION_ADMIN:
          role = 'CUSTOMER_ADMIN';
          userType = 'FINANCIAL_INSTITUTION';
          isCompanyOwner = true;
          break;
        default:
          role = 'CUSTOMER_USER';
          userType = 'CUSTOMER';
      }

      // Create user in customer-service
      const newUser = await this.userService.createFromExternalEvent({
        name: event.name,
        email: event.email,
        auth0Id: event.userId,
        role,
        userType,
        customerId: customer.id,
        companyId: customer.id,
        isCompanyOwner,
        status: 'ACTIVE',
        createdAt: new Date(event.timestamp),
      });

      this.logger.log(`Successfully created user ${newUser.id} from external event`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling external ${UserEventTopics.USER_CREATED} for user ${event.userId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  @EventPattern(UserEventTopics.USER_STATUS_CHANGED)
  async handleExternalUserStatusChanged(@Payload() event: UserStatusChangedEvent): Promise<void> {
    this.logger.log(`Received external ${UserEventTopics.USER_STATUS_CHANGED} event: ${JSON.stringify(event)}`);
    
    try {
      const user = await this.userService.findUserEntityByAuth0Id(event.userId).catch(() => null);
      
      if (!user) {
        this.logger.warn(`User ${event.userId} not found in customer-service, skipping status update`);
        return;
      }

      // Update user status
      await this.userService.updateStatus(user.id, event.newStatus);
      
      this.logger.log(`Successfully updated status for user ${user.id} to ${event.newStatus}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling external ${UserEventTopics.USER_STATUS_CHANGED} for user ${event.userId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  @EventPattern(UserEventTopics.USER_ROLE_CHANGED)
  async handleExternalUserRoleChanged(@Payload() event: UserRoleChangedEvent): Promise<void> {
    this.logger.log(`Received external ${UserEventTopics.USER_ROLE_CHANGED} event: ${JSON.stringify(event)}`);
    
    try {
      const user = await this.userService.findUserEntityByAuth0Id(event.userId).catch(() => null);
      
      if (!user) {
        this.logger.warn(`User ${event.userId} not found in customer-service, skipping role update`);
        return;
      }

      // Map external role to customer-service role
      let newRole;
      switch (event.newRole.toLowerCase()) {
        case 'admin':
          newRole = 'CUSTOMER_ADMIN';
          break;
        case 'manager':
        case 'accountant':
          newRole = 'MANAGER';
          break;
        default:
          newRole = 'CUSTOMER_USER';
      }

      // Update user role
      await this.userService.updateRole(user.id, newRole);
      
      this.logger.log(`Successfully updated role for user ${user.id} to ${newRole}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling external ${UserEventTopics.USER_ROLE_CHANGED} for user ${event.userId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }
}
