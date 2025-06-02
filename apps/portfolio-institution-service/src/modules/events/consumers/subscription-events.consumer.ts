import { Injectable } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserEventTopics, SubscriptionChangedEvent } from '@wanzo/shared/events/kafka-config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  Institution, 
  SubscriptionStatus, 
  SubscriptionPlan 
} from '../../institution/entities/institution.entity';
import { Logger } from '@nestjs/common';

@Controller()
@Injectable()
export class SubscriptionEventsConsumer {
  private readonly logger = new Logger(SubscriptionEventsConsumer.name);

  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
  ) {}

  @MessagePattern(UserEventTopics.SUBSCRIPTION_CHANGED)
  async handleSubscriptionChanged(@Payload() event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`Received subscription changed event: ${JSON.stringify(event)}`);
    
    try {
      // Only process events for institution entities in this service
      if (event.entityType !== 'institution') {
        this.logger.log(`Ignoring non-institution subscription event for entity type: ${event.entityType}`);
        return;
      }

      const institution = await this.institutionRepository.findOne({ 
        where: { id: event.entityId } 
      });
      
      if (!institution) {
        this.logger.warn(`Institution with ID ${event.entityId} not found`);
        return;
      }

      // Map the subscription plan from the event to the institution's enum
      const planMapping = {
        'basic': SubscriptionPlan.BASIC,
        'professional': SubscriptionPlan.PROFESSIONAL,
        'enterprise': SubscriptionPlan.ENTERPRISE,
      };
      
      // Map the subscription status from the event to the institution's enum
      const statusMapping = {
        'active': SubscriptionStatus.ACTIVE,
        'expired': SubscriptionStatus.EXPIRED,
        'suspended': SubscriptionStatus.SUSPENDED,
        'cancelled': SubscriptionStatus.CANCELLED,
      };

      // Update institution subscription details
      institution.subscriptionPlan = planMapping[event.newPlan] || SubscriptionPlan.BASIC;
      institution.subscriptionStatus = statusMapping[event.status] || SubscriptionStatus.ACTIVE;
      institution.subscriptionExpiresAt = event.expiresAt;
      institution.updatedAt = event.timestamp;
      
      await this.institutionRepository.save(institution);
      this.logger.log(`Successfully updated subscription for institution ${event.entityId}`);
    } catch (error) {
      this.logger.error(`Error handling subscription change: ${error.message}`, error.stack);
    }
  }

  @MessagePattern(UserEventTopics.SUBSCRIPTION_EXPIRED)
  async handleSubscriptionExpired(@Payload() event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`Received subscription expired event: ${JSON.stringify(event)}`);
    
    try {
      // Only process events for institution entities in this service
      if (event.entityType !== 'institution') {
        return;
      }

      const institution = await this.institutionRepository.findOne({ 
        where: { id: event.entityId } 
      });
      
      if (!institution) {
        this.logger.warn(`Institution with ID ${event.entityId} not found`);
        return;
      }

      // Mark subscription as expired
      institution.subscriptionStatus = SubscriptionStatus.EXPIRED;
      institution.updatedAt = event.timestamp;
      
      await this.institutionRepository.save(institution);
      this.logger.log(`Successfully marked subscription as expired for institution ${event.entityId}`);
    } catch (error) {
      this.logger.error(`Error handling subscription expiration: ${error.message}`, error.stack);
    }
  }
}
