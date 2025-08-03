import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from '../services/subscription.service';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

class CreateSubscriptionDto {
  customerId!: string;
  planId!: string;
  startDate!: Date;
  endDate!: Date;
  amount!: number;
  currency?: string;
  paymentMethod?: string;
  paymentReference?: string;
  autoRenew?: boolean;
  metadata?: Record<string, any>;
}

class UpdateSubscriptionDto {
  planId?: string;
  status?: SubscriptionStatus;
  endDate?: Date;
  autoRenew?: boolean;
  metadata?: Record<string, any>;
}

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('land/api/v1')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel abonnement' })
  @ApiResponse({ status: 201, description: 'Abonnement créé avec succès' })
  async create(@Body() createDto: CreateSubscriptionDto): Promise<Subscription> {
    return this.subscriptionService.create(createDto);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Récupérer tous les abonnements d\'un client' })
  @ApiResponse({ status: 200, description: 'Liste des abonnements récupérée' })
  async findByCustomer(@Param('customerId') customerId: string): Promise<Subscription[]> {
    return this.subscriptionService.findByCustomer(customerId);
  }

  @Get('subscription/plans')
  @ApiOperation({ summary: 'Récupérer tous les plans d\'abonnement disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des plans récupérée' })
  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionService.getSubscriptionPlans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un abonnement par son ID' })
  @ApiResponse({ status: 200, description: 'Abonnement récupéré' })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  async findOne(@Param('id') id: string): Promise<Subscription> {
    return this.subscriptionService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un abonnement' })
  @ApiResponse({ status: 200, description: 'Abonnement mis à jour' })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionDto
  ): Promise<Subscription> {
    return this.subscriptionService.update(id, updateDto);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Annuler un abonnement' })
  @ApiResponse({ status: 200, description: 'Abonnement annulé' })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason?: string
  ): Promise<Subscription> {
    return this.subscriptionService.cancel(id, reason);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activer un abonnement' })
  @ApiResponse({ status: 200, description: 'Abonnement activé' })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  async activate(@Param('id') id: string): Promise<Subscription> {
    return this.subscriptionService.activate(id);
  }

  @Get('expiring/soon')
  @ApiOperation({ summary: 'Récupérer les abonnements qui vont bientôt expirer' })
  @ApiResponse({ status: 200, description: 'Liste des abonnements récupérée' })
  async getExpiringSubscriptions(
    @Query('days') days: number = 7
  ): Promise<Subscription[]> {
    return this.subscriptionService.findExpiringSubscriptions(days);
  }

  @Get('expired')
  @ApiOperation({ summary: 'Récupérer les abonnements expirés' })
  @ApiResponse({ status: 200, description: 'Liste des abonnements récupérée' })
  async getExpiredSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionService.findExpiredSubscriptions();
  }

  @Get('subscriptions/current')
  @ApiOperation({ summary: 'Récupérer l\'abonnement actuel de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Abonnement actuel récupéré' })
  @ApiResponse({ status: 404, description: 'Aucun abonnement actuel trouvé' })
  @UseGuards(JwtAuthGuard)
  async getCurrentSubscription(@Req() req: any): Promise<Subscription | null> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    return this.subscriptionService.getCurrentSubscriptionByAuth0Id(auth0Id);
  }

  @Post('subscriptions/cancel')
  @ApiOperation({ summary: 'Annuler l\'abonnement actuel de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Abonnement annulé avec succès' })
  @ApiResponse({ status: 404, description: 'Aucun abonnement actuel trouvé' })
  @UseGuards(JwtAuthGuard)
  async cancelCurrentSubscription(
    @Req() req: any,
    @Body('reason') reason?: string
  ): Promise<Subscription> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    return this.subscriptionService.cancelCurrentSubscriptionByAuth0Id(auth0Id, reason);
  }

  @Post('subscriptions/change-plan')
  @ApiOperation({ summary: 'Changer le plan d\'abonnement de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Plan changé avec succès' })
  @ApiResponse({ status: 404, description: 'Aucun abonnement actuel trouvé' })
  @UseGuards(JwtAuthGuard)
  async changePlan(
    @Body('planId') planId: string,
    @Req() req: any
  ): Promise<Subscription> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    return this.subscriptionService.changePlanByAuth0Id(auth0Id, planId);
  }
}
