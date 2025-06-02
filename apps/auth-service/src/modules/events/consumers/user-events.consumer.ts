import { Injectable } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserEventTopics, UserStatusChangedEvent } from '@wanzo/shared/events/kafka-config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenBlacklist } from '@wanzo/shared/security/token-blacklist.entity';
import { Logger } from '@nestjs/common';

@Controller()
@Injectable()
export class UserEventsConsumer {
  private readonly logger = new Logger(UserEventsConsumer.name);

  constructor(
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
  ) {}

  @MessagePattern(UserEventTopics.USER_STATUS_CHANGED)
  async handleUserStatusChanged(@Payload() event: UserStatusChangedEvent): Promise<void> {
    this.logger.log(`Received user status changed event: ${JSON.stringify(event)}`);
    
    try {
      // If the user is being deactivated or suspended, blacklist all their tokens
      if (['inactive', 'suspended'].includes(event.newStatus)) {
        this.logger.log(`Blacklisting all tokens for user ${event.userId} due to status change to ${event.newStatus}`);
        
        // Create a special entry that will invalidate all tokens for this user
        const blacklistEntry = this.tokenBlacklistRepository.create({
          userId: event.userId,
          jti: 'all-tokens', // Special marker to invalidate all tokens
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          reason: `User status changed to ${event.newStatus}`,
        });
        
        await this.tokenBlacklistRepository.save(blacklistEntry);
        this.logger.log(`Successfully blacklisted all tokens for user ${event.userId}`);
      }
    } catch (error) {
      this.logger.error(`Error handling user status change for token blacklisting: ${error.message}`, error.stack);
    }
  }
}
