import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm'; // Imported LessThan
import { Institution } from '../entities/institution.entity';
import { EventsService } from '../../events/events.service';
import { EntityType } from '@wanzo/shared/events/subscription-types';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TokenMonitorService {
  private readonly logger = new Logger(TokenMonitorService.name);
  private readonly LOW_TOKEN_THRESHOLD = 10; // Alert when balance goes below this value

  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async monitorLowTokenBalances() {
    this.logger.log('Checking for low token balances');
    
    try {
      // Find all institutions with token balance below threshold
      const institutionsWithLowTokens = await this.institutionRepository.find({
        where: {
          tokenBalance: LessThan(this.LOW_TOKEN_THRESHOLD) // Corrected: Used LessThan operator
        },
        relations: ['users']
      });

      this.logger.log(`Found ${institutionsWithLowTokens.length} institutions with low token balance`);

      // Send alerts for each institution with low tokens
      for (const institution of institutionsWithLowTokens) {
        // Find admin users for this institution
        const adminUsers = institution.users.filter(user => user.role === 'admin');
        
        if (adminUsers.length > 0) {
          const adminUserId = adminUsers[0].id; // Take the first admin
          
          // Publish low token balance alert event
          await this.eventsService.publishTokenAlert({
            userId: adminUserId,
            entityId: institution.id,
            entityType: EntityType.INSTITUTION,
            amount: institution.tokenBalance,
            operation: 'alert', // Removed temporary cast to any
            currentBalance: institution.tokenBalance,
            timestamp: new Date(),
            metadata: {
              alertType: 'low_balance',
              threshold: this.LOW_TOKEN_THRESHOLD
            }
          });
          
          this.logger.log(`Sent low token balance alert for institution ${institution.id}`);
        }
      }
    } catch (error) {
      if (error instanceof Error) { // Added type guard for error
        this.logger.error(`Error monitoring token balances: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Error monitoring token balances: An unknown error occurred`, error);
      }
    }
  }

  // Analyzes token usage patterns and provides insights
  async generateTokenUsageAnalytics(institutionId: string): Promise<any> {
    const institution = await this.institutionRepository.findOne({
      where: { id: institutionId }
    });

    if (!institution) {
      throw new Error('Institution not found');
    }

    // Get token usage history for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsage = institution.tokenUsageHistory.filter(
      entry => new Date(entry.date) >= thirtyDaysAgo
    );

    // Calculate total tokens used in the period
    const totalUsed = recentUsage
      .filter(entry => entry.operation === 'use')
      .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);

    // Calculate daily average usage
    const dailyAverage = totalUsed / 30;

    // Estimate days until tokens run out
    const daysRemaining = institution.tokenBalance / (dailyAverage || 1);

    // Group usage by operation
    const usageByOperation: { [key: string]: number } = {}; // Added explicit type
    recentUsage
      .filter(entry => entry.operation === 'use') // only 'use' operations for this specific analytics object
      .forEach(entry => {
        const operation = entry.operation;
        if (!usageByOperation[operation]) {
          usageByOperation[operation] = 0;
        }
        usageByOperation[operation] += Math.abs(entry.amount);
      });

    return {
      totalUsed,
      dailyAverage,
      daysRemaining: Math.round(daysRemaining),
      usageByOperation,
      usageHistory: recentUsage
    };
  }
}
