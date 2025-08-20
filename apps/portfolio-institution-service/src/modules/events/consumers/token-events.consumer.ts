import { Injectable } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TokenEventTopics, TokenTransactionEvent } from '@wanzobe/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  Institution
} from '../../institution/entities/institution.entity';
import { Logger } from '@nestjs/common';

@Controller()
@Injectable()
export class TokenEventsConsumer {
  private readonly logger = new Logger(TokenEventsConsumer.name);

  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
  ) {}

  @MessagePattern(TokenEventTopics.TOKEN_PURCHASE)
  async handleTokenPurchase(@Payload() event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Received token purchase event: ${JSON.stringify(event)}`);
    
    try {
      // Only process events for institution entities in this service
      if (event.entityType !== 'institution') {
        this.logger.log(`Ignoring non-institution token event for entity type: ${event.entityType}`);
        return;
      }

      const institution = await this.institutionRepository.findOne({ 
        where: { id: event.entityId } 
      });
      
      if (!institution) {
        this.logger.warn(`Institution with ID ${event.entityId} not found`);
        return;
      }

      // Update token balance
      institution.tokenBalance += event.amount;
      
      // Record in token usage history
      institution.tokenUsageHistory.push({
        date: new Date(event.timestamp),
        amount: event.amount,
        operation: 'purchase',
        balance: institution.tokenBalance,
      });
      
      await this.institutionRepository.save(institution);
      this.logger.log(`Successfully updated token balance for institution ${event.entityId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error handling token purchase';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error handling token purchase: ${errorMessage}`, errorStack);
    }
  }

  @MessagePattern(TokenEventTopics.TOKEN_USAGE)
  async handleTokenUsage(@Payload() event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Received token usage event: ${JSON.stringify(event)}`);
    
    try {
      // Only process events for institution entities in this service
      if (event.entityType !== 'institution') {
        this.logger.log(`Ignoring non-institution token event for entity type: ${event.entityType}`);
        return;
      }

      const institution = await this.institutionRepository.findOne({ 
        where: { id: event.entityId } 
      });
      
      if (!institution) {
        this.logger.warn(`Institution with ID ${event.entityId} not found`);
        return;
      }

      // Ensure there's enough balance
      if (institution.tokenBalance < event.amount) {
        this.logger.warn(`Insufficient token balance for institution ${event.entityId}`);
        return;
      }

      // Update token balances
      institution.tokenBalance -= event.amount;
      institution.tokensUsed += event.amount;
      
      // Record in token usage history
      institution.tokenUsageHistory.push({
        date: new Date(event.timestamp),
        amount: -event.amount, // Negative for usage
        operation: 'use',
        balance: institution.tokenBalance,
      });
      
      await this.institutionRepository.save(institution);
      this.logger.log(`Successfully updated token usage for institution ${event.entityId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error handling token usage';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error handling token usage: ${errorMessage}`, errorStack);
    }
  }
}
