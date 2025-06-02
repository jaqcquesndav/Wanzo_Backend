import { Injectable } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserEventTopics, UserStatusChangedEvent, UserRoleChangedEvent } from '@wanzo/shared/events/kafka-config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionUser } from '../../institution/entities/institution-user.entity';
import { Logger } from '@nestjs/common';

@Controller()
@Injectable()
export class UserEventsConsumer {
  private readonly logger = new Logger(UserEventsConsumer.name);

  constructor(
    @InjectRepository(InstitutionUser)
    private readonly userRepository: Repository<InstitutionUser>,
  ) {}

  @MessagePattern(UserEventTopics.USER_STATUS_CHANGED)
  async handleUserStatusChanged(@Payload() event: UserStatusChangedEvent): Promise<void> {
    this.logger.log(`Received user status changed event: ${JSON.stringify(event)}`);
    
    try {
      const user = await this.userRepository.findOne({ where: { id: event.userId } });
      
      if (!user) {
        this.logger.warn(`User with ID ${event.userId} not found in institution-service`);
        return;
      }

      // Update user status - map the status to the active boolean
      if (event.newStatus === 'active') {
        user.active = true;
      } else if (['inactive', 'suspended'].includes(event.newStatus)) {
        user.active = false;
      }
      
      // Update the updatedAt timestamp
      user.updatedAt = event.timestamp;
      
      await this.userRepository.save(user);
      this.logger.log(`Successfully updated institution user ${event.userId} active status to ${user.active}`);
    } catch (error) {
      this.logger.error(`Error handling user status change: ${error.message}`, error.stack);
    }
  }

  @MessagePattern(UserEventTopics.USER_ROLE_CHANGED)
  async handleUserRoleChanged(@Payload() event: UserRoleChangedEvent): Promise<void> {
    this.logger.log(`Received user role changed event: ${JSON.stringify(event)}`);
    
    try {
      const user = await this.userRepository.findOne({ where: { id: event.userId } });
      
      if (!user) {
        this.logger.warn(`User with ID ${event.userId} not found in institution-service`);
        return;
      }

      // Update user role - map from admin-service roles to institution-service roles if needed
      // This is a simplified example - you'll need to define your own mapping logic
      const roleMapping = {
        'super_admin': 'admin',
        'cto': 'admin',
        'company_admin': 'admin',
        'growth_finance': 'manager',
        'content_manager': 'manager',
        'customer_support': 'viewer',
        'company_user': 'viewer'
      };
      
      const mappedRole = roleMapping[event.newRole] || 'viewer';
      user.role = mappedRole as any; // Cast to the enum type
      
      await this.userRepository.save(user);
      this.logger.log(`Successfully updated institution user ${event.userId} role to ${mappedRole}`);
    } catch (error) {
      this.logger.error(`Error handling user role change: ${error.message}`, error.stack);
    }
  }
}
