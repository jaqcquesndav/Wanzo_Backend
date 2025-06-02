import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { TokenBlacklist } from '@wanzo/shared/security/token-blacklist.entity';
import { TokenBlacklistDto } from '@wanzo/shared/security/token-blacklist.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
  ) {}

  async addToBlacklist(tokenData: TokenBlacklistDto): Promise<TokenBlacklist> {
    const blacklistEntry = this.tokenBlacklistRepository.create(tokenData);
    return this.tokenBlacklistRepository.save(blacklistEntry);
  }

  async addUserTokensToBlacklist(userId: string, reason?: string): Promise<void> {
    // This is a placeholder. In a real implementation, you would need to:
    // 1. Get all active tokens for the user from your auth system
    // 2. Add each token to the blacklist
    this.logger.log(`Adding all tokens for user ${userId} to blacklist. Reason: ${reason}`);
    
    // For demonstration purposes, we're creating a placeholder entry
    const entry = this.tokenBlacklistRepository.create({
      userId,
      jti: 'all-tokens', // Special marker to invalidate all tokens
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      reason: reason || 'User status changed',
    });
    
    await this.tokenBlacklistRepository.save(entry);
  }

  async isTokenBlacklisted(jti: string, userId: string): Promise<boolean> {
    const count = await this.tokenBlacklistRepository.count({
      where: [
        { jti, userId },
        { jti: 'all-tokens', userId }
      ]
    });
    return count > 0;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens(): Promise<void> {
    this.logger.log('Cleaning up expired blacklisted tokens');
    
    const now = new Date();
    const result = await this.tokenBlacklistRepository.delete({
      expiresAt: LessThanOrEqual(now),
    });
    
    this.logger.log(`Removed ${result.affected} expired blacklisted tokens`);
  }
}
