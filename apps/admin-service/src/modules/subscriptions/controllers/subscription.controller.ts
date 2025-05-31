import { Controller, Get, Put, Post, Body, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubscriptionService } from '../services/subscription.service';
import { UpdateSubscriptionDto } from '../dtos/subscription.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscription')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get company subscription',
    description: 'Retrieve subscription details for the authenticated company'
  })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getSubscription(@Req() req: any) {
    const subscription = await this.subscriptionService.findByCompanyId(req.user.companyId);
    return {
      success: true,
      subscription,
    };
  }

  @Put()
  @Roles('admin', 'superadmin')
  @ApiOperation({ 
    summary: 'Update subscription',
    description: 'Update subscription plan and features'
  })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async update(@Body() updateSubscriptionDto: UpdateSubscriptionDto, @Req() req: any) {
    const subscription = await this.subscriptionService.update(
      req.user.companyId,
      updateSubscriptionDto,
    );
    return {
      success: true,
      subscription,
    };
  }

  @Get('tokens')
  @ApiOperation({ 
    summary: 'Get token information',
    description: 'Retrieve token usage and balance information'
  })
  @ApiResponse({ status: 200, description: 'Token information retrieved successfully' })
  async getTokens(@Req() req: any) {
    const tokens = await this.subscriptionService.getTokens(req.user.companyId);
    return {
      success: true,
      tokens,
    };
  }

  @Post('tokens/use')
  @ApiOperation({ 
    summary: 'Use tokens',
    description: 'Use tokens for a specific action'
  })
  @ApiResponse({ status: 200, description: 'Tokens used successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient tokens' })
  async useTokens(
    @Body() body: { amount: number; description: string },
    @Req() req: any
  ) {
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException('Invalid token amount');
    }

    await this.subscriptionService.useTokens(
      { companyId: req.user.companyId, amount: req.user.id, tokenAmount: body.amount, description: body.description }    );

    const tokens = await this.subscriptionService.getTokens(req.user.companyId);
    return {
      success: true,
      tokens,
    };
  }

  @Get('tokens/transactions')
  @ApiOperation({ 
    summary: 'Get token transactions',
    description: 'Retrieve token transaction history'
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Token transactions retrieved successfully' })
  async getTokenTransactions(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Req() req: any
  ) {
    const result = await this.subscriptionService.getTokenTransactions(
      req.user.companyId,
      +page,
      +perPage
    );
    return {
      success: true,
      ...result,
    };
  }
}