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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Abonnements')
@ApiBearerAuth('JWT-auth')
@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('tiers')
  @ApiOperation({ summary: 'Obtenir tous les forfaits d\'abonnement disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des forfaits d\'abonnement récupérée avec succès', type: [SubscriptionTier] })
  getAvailableTiers(): Promise<SubscriptionTier[]> {
    return this.subscriptionsService.getAvailableTiers();
  }

  @Get('details')
  @ApiOperation({ summary: 'Obtenir les détails de l\'abonnement de l\'utilisateur actuel' })
  @ApiResponse({ status: 200, description: 'Détails de l\'abonnement récupérés avec succès', type: UserSubscription })
  @ApiResponse({ status: 404, description: 'Aucun abonnement trouvé pour cet utilisateur' })
  getUserSubscriptionDetails(@CurrentUser() user: User): Promise<UserSubscription | null> {
    return this.subscriptionsService.getUserSubscriptionDetails(user.id);
  }

  @Post('change-tier')
  @ApiOperation({ summary: 'Changer le forfait d\'abonnement de l\'utilisateur' })
  @ApiBody({ type: ChangeTierDto })
  @ApiResponse({ status: 201, description: 'Forfait d\'abonnement changé avec succès', type: UserSubscription })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @ApiResponse({ status: 404, description: 'Forfait d\'abonnement non trouvé' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  changeSubscriptionTier(
    @CurrentUser() user: User,
    @Body() changeTierDto: ChangeTierDto,
  ): Promise<UserSubscription> {
    return this.subscriptionsService.changeSubscriptionTier(user.id, changeTierDto);
  }

  @Post('topup-tokens')
  @ApiOperation({ summary: 'Recharger les tokens Adha de l\'utilisateur' })
  @ApiBody({ type: TopUpTokensDto })
  @ApiResponse({ status: 201, description: 'Tokens rechargés avec succès', type: UserSubscription })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @ApiResponse({ status: 404, description: 'Forfait de tokens non trouvé' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  topUpAdhaTokens(
    @CurrentUser() user: User,
    @Body() topUpTokensDto: TopUpTokensDto,
  ): Promise<UserSubscription> {
    return this.subscriptionsService.topUpAdhaTokens(user.id, topUpTokensDto);
  }

  @Post('payment-proof')
  @ApiOperation({ summary: 'Soumettre une preuve de paiement' })
  @ApiBody({ type: CreatePaymentProofDto })
  @ApiResponse({ status: 201, description: 'Preuve de paiement soumise avec succès', type: PaymentProof })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  submitPaymentProof(
    @CurrentUser() user: User,
    @Body() createPaymentProofDto: CreatePaymentProofDto,
  ): Promise<PaymentProof> {
    return this.subscriptionsService.submitPaymentProof(user.id, createPaymentProofDto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Lister les factures de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des factures récupérée avec succès', type: [Invoice] })
  listUserInvoices(@CurrentUser() user: User): Promise<Invoice[]> {
    return this.subscriptionsService.listUserInvoices(user.id);
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Lister les méthodes de paiement de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des méthodes de paiement récupérée avec succès', type: [PaymentMethod] })
  listUserPaymentMethods(@CurrentUser() user: User): Promise<PaymentMethod[]> {
    return this.subscriptionsService.listUserPaymentMethods(user.id);
  }
}
