import { Injectable } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserEventTopics, UserStatusChangedEvent, UserRoleChangedEvent } from '@wanzo/shared/events/kafka-config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Logger } from '@nestjs/common';

@Controller()
@Injectable()
export class UserEventsConsumer {
  private readonly logger = new Logger(UserEventsConsumer.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @MessagePattern(UserEventTopics.USER_STATUS_CHANGED)
  async handleUserStatusChanged(@Payload() event: UserStatusChangedEvent): Promise<void> {
    this.logger.log(`Received user status changed event: ${JSON.stringify(event)}`);
    
    try {
      const user = await this.userRepository.findOne({ where: { id: event.userId } });
      
      if (!user) {
        this.logger.warn(`User with ID ${event.userId} not found in app_mobile_service`);
        return;
      }

      // Update user status
      user.status = event.newStatus as any; // Assuming the status enum is compatible
      
      // Add audit information
      user.updatedAt = event.timestamp;
      
      await this.userRepository.save(user);
      this.logger.log(`Successfully updated user ${event.userId} status to ${event.newStatus}`);
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
        this.logger.warn(`User with ID ${event.userId} not found in app_mobile_service`);
        return;
      }

      // Update user role
      user.role = event.newRole as any; // Assuming the role enum is compatible
      
      // Add audit information
      user.updatedAt = event.timestamp;
      
      await this.userRepository.save(user);
      this.logger.log(`Successfully updated user ${event.userId} role to ${event.newRole}`);
    } catch (error) {
      this.logger.error(`Error handling user role change: ${error.message}`, error.stack);
    }
  }
}
