import { Controller, Get, Post, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from '../services/subscription.service';
import { JwtBlacklistGuard } from '../../auth/guards/jwt-blacklist.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SubscriptionPlan } from '../entities/institution.entity';

@ApiTags('subscription')
@Controller('subscription')
@UseGuards(JwtBlacklistGuard, RolesGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get subscription status' })
  @ApiResponse({ status: 200, description: 'Subscription status retrieved successfully' })
  async getStatus(@Req() req: any) {
    const isActive = await this.subscriptionService.checkSubscriptionStatus(req.user.institutionId);
    return {
      success: true,
      active: isActive,
    };
  }

  @Put()
  @Roles('admin')
  @ApiOperation({ summary: 'Update subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  async updateSubscription(
    @Body() body: {
      plan: SubscriptionPlan;
      expiresAt: Date;
    },
    @Req() req: any,
  ) {
    const institution = await this.subscriptionService.updateSubscription(
      req.user.institutionId,
      body.plan,
      new Date(body.expiresAt),
      req.user.id // Pass the user ID
    );
    return {
      success: true,
      subscription: {
        id: institution.id, // Add id
        name: institution.name, // Add name
        plan: institution.subscriptionPlan,
        status: institution.subscriptionStatus,
        expiresAt: institution.subscriptionExpiresAt,
      },
    };
  }

  @Get('tokens')
  @ApiOperation({ summary: 'Get token balance and usage history' })
  @ApiResponse({ status: 200, description: 'Token information retrieved successfully' })
  async getTokens(@Req() req: any) {
    const tokens = await this.subscriptionService.getTokenBalance(req.user.institutionId);
    return {
      success: true,
      tokens,
    };
  }

  @Post('tokens/purchase')
  @Roles('admin')
  @ApiOperation({ summary: 'Purchase tokens' })
  @ApiResponse({ status: 201, description: 'Tokens purchased successfully' })
  async purchaseTokens(
    @Body() body: { amount: number },
    @Req() req: any,
  ) {
    const institution = await this.subscriptionService.addTokens(
      req.user.institutionId,
      body.amount,
      req.user.id // Pass the user ID
    );
    return {
      success: true,
      tokens: {
        balance: institution.tokenBalance,
        added: body.amount,
      },
    };
  }

  @Post('tokens/use')
  @ApiOperation({ summary: 'Use tokens for an operation' })
  @ApiResponse({ status: 200, description: 'Tokens used successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient tokens' })
  async useTokens(
    @Body() body: { amount: number; operation: string },
    @Req() req: any,
  ) {
    const success = await this.subscriptionService.useTokens(
      req.user.institutionId,
      body.amount,
      body.operation,
      req.user.id // Pass the user ID
    );

    if (!success) {
      return {
        success: false,
        message: 'Insufficient tokens',
      };
    }

    const tokens = await this.subscriptionService.getTokenBalance(req.user.institutionId);
    return {
      success: true,
      tokens,
    };
  }
}
