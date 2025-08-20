import { Injectable } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SubscriptionEventTopics } from '@wanzobe/shared';
import { SubscriptionChangedEvent } from '@wanzobe/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  Institution, 
  SubscriptionStatus, 
  SubscriptionPlan 
} from '../../institution/entities/institution.entity';
import { Logger } from '@nestjs/common';
import { SubscriptionPlanType, SubscriptionStatusType } from '@wanzobe/shared';

@Controller()
@Injectable()
export class SubscriptionEventsConsumer {
  private readonly logger = new Logger(SubscriptionEventsConsumer.name);

  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
  ) {}

  @MessagePattern(SubscriptionEventTopics.SUBSCRIPTION_STATUS_CHANGED)
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
      const planMapping: Record<SubscriptionPlanType, SubscriptionPlan> = {
        [SubscriptionPlanType.BASIC]: SubscriptionPlan.BASIC,
        [SubscriptionPlanType.PROFESSIONAL]: SubscriptionPlan.PROFESSIONAL,
        [SubscriptionPlanType.ENTERPRISE]: SubscriptionPlan.ENTERPRISE,
        // Add other mappings as necessary, ensure all enum members are covered or handled
        [SubscriptionPlanType.FREE]: SubscriptionPlan.BASIC, // Example: map FREE to BASIC or a specific FREE plan if it exists
        [SubscriptionPlanType.PREMIUM]: SubscriptionPlan.PROFESSIONAL, // Example: map PREMIUM to PROFESSIONAL
      };
      
      // Map the subscription status from the event to the institution's enum
      const statusMapping: Record<SubscriptionStatusType, SubscriptionStatus> = {
        [SubscriptionStatusType.ACTIVE]: SubscriptionStatus.ACTIVE,
        [SubscriptionStatusType.EXPIRED]: SubscriptionStatus.EXPIRED,
        [SubscriptionStatusType.SUSPENDED]: SubscriptionStatus.SUSPENDED,
        [SubscriptionStatusType.CANCELLED]: SubscriptionStatus.CANCELLED,
        // Add other mappings as necessary
        [SubscriptionStatusType.INACTIVE]: SubscriptionStatus.EXPIRED, // Example mapping
        [SubscriptionStatusType.PAST_DUE]: SubscriptionStatus.SUSPENDED, // Example mapping
        [SubscriptionStatusType.TRIAL]: SubscriptionStatus.ACTIVE, // Example mapping
      };

      // Update institution subscription details
      institution.subscriptionPlan = planMapping[event.newPlan as SubscriptionPlanType] || SubscriptionPlan.BASIC;
      institution.subscriptionStatus = statusMapping[event.newStatus as SubscriptionStatusType] || SubscriptionStatus.ACTIVE;
      institution.subscriptionExpiresAt = new Date(event.endDate);
      institution.updated_at = new Date(event.timestamp);
      
      await this.institutionRepository.save(institution);
      this.logger.log(`Successfully updated subscription for institution ${event.entityId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error handling subscription change';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error handling subscription change: ${errorMessage}`, errorStack);
    }
  }

  @MessagePattern(SubscriptionEventTopics.SUBSCRIPTION_EXPIRED)
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
      institution.updated_at = new Date(event.timestamp);
      
      await this.institutionRepository.save(institution);
      this.logger.log(`Successfully marked subscription as expired for institution ${event.entityId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error handling subscription expiration';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error handling subscription expiration: ${errorMessage}`, errorStack);
    }
  }
}
