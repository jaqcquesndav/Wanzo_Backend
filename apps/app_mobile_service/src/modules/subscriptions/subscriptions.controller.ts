import { Controller, Get, Post, Body, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { ChangeTierDto } from './dto/change-tier.dto';
import { TopUpTokensDto } from './dto/topup-tokens.dto';
import { CreatePaymentProofDto } from './dto/create-payment-proof.dto';
import { SubscriptionTier } from './entities/subscription-tier.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { Invoice } from './entities/invoice.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentProof } from './entities/payment-proof.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity'; // Import User entity

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('tiers')
  getAvailableTiers(): Promise<SubscriptionTier[]> {
    return this.subscriptionsService.getAvailableTiers();
  }

  @Get('details')
  getUserSubscriptionDetails(@CurrentUser() user: User): Promise<UserSubscription | null> {
    return this.subscriptionsService.getUserSubscriptionDetails(user.id);
  }

  @Post('change-tier')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  changeSubscriptionTier(
    @CurrentUser() user: User,
    @Body() changeTierDto: ChangeTierDto,
  ): Promise<UserSubscription> {
    return this.subscriptionsService.changeSubscriptionTier(user.id, changeTierDto);
  }

  @Post('topup-tokens')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  topUpAdhaTokens(
    @CurrentUser() user: User,
    @Body() topUpTokensDto: TopUpTokensDto,
  ): Promise<UserSubscription> {
    return this.subscriptionsService.topUpAdhaTokens(user.id, topUpTokensDto);
  }

  @Post('payment-proof')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  submitPaymentProof(
    @CurrentUser() user: User,
    @Body() createPaymentProofDto: CreatePaymentProofDto,
  ): Promise<PaymentProof> {
    return this.subscriptionsService.submitPaymentProof(user.id, createPaymentProofDto);
  }

  @Get('invoices')
  listUserInvoices(@CurrentUser() user: User): Promise<Invoice[]> {
    return this.subscriptionsService.listUserInvoices(user.id);
  }

  @Get('payment-methods')
  listUserPaymentMethods(@CurrentUser() user: User): Promise<PaymentMethod[]> {
    return this.subscriptionsService.listUserPaymentMethods(user.id);
  }
}
