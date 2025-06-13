import { Injectable } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserEventTopics, UserStatusChangedEvent, UserDeletedEvent } from '@wanzo/shared/events/kafka-config';
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
    this.logger.log(`Received ${UserEventTopics.USER_STATUS_CHANGED} event: ${JSON.stringify(event)}`);
    
    try {
      if (['inactive', 'suspended'].includes(event.newStatus)) {
        this.logger.log(`Blacklisting all tokens for user ${event.userId} due to status change to ${event.newStatus}`);
        await this.blacklistAllUserTokens(event.userId, `User status changed to ${event.newStatus}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error handling ${UserEventTopics.USER_STATUS_CHANGED} event for ${event.userId}: ${errorMessage}`, errorStack);
    }
  }

  @MessagePattern(UserEventTopics.USER_DELETED)
  async handleUserDeleted(@Payload() event: UserDeletedEvent): Promise<void> {
    this.logger.log(`Received ${UserEventTopics.USER_DELETED} event: ${JSON.stringify(event)}`);
    try {
      this.logger.log(`Blacklisting all tokens for deleted user ${event.userId}`);
      await this.blacklistAllUserTokens(event.userId, `User deleted by ${event.deletedBy}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error handling ${UserEventTopics.USER_DELETED} event for ${event.userId}: ${errorMessage}`, errorStack);
    }
  }

  private async blacklistAllUserTokens(userId: string, reason: string): Promise<void> {
    const blacklistEntry = this.tokenBlacklistRepository.create({
      userId: userId,
      jti: 'all-tokens', // Special marker to invalidate all tokens for this user
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now, or align with token expiry
      reason: reason,
    });
    
    await this.tokenBlacklistRepository.save(blacklistEntry);
    this.logger.log(`Successfully blacklisted all tokens for user ${userId}. Reason: ${reason}`);
  }
}
