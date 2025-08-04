import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { 
  PricingConfigService, 
  CustomerType, 
  SubscriptionPlan,
  TokenPurchasePackage,
  BillingPeriod,
  PRICING_CONFIG
} from '../../../config/subscription-pricing.config';
import { FeatureAccessService } from '../services/feature-access.service';
import { CurrentCustomer, RequestCustomer } from '../decorators/feature-access.decorator';

export class GetPricingDto {
  customerType?: CustomerType;
  billingPeriod?: BillingPeriod;
}

export class CalculatePriceDto {
  planId!: string;
  billingPeriod!: BillingPeriod;
  customDiscountPercentage?: number;
}

export class TokenPurchaseEstimateDto {
  packageId!: string;
  quantity?: number;
}

@ApiTags('Pricing')
@Controller('pricing')
@ApiBearerAuth()
export class PricingController {
  constructor(
    private featureAccessService: FeatureAccessService,
  ) {}

  @Get('plans')
  @ApiOperation({ summary: 'Récupérer les plans d\'abonnement disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des plans d\'abonnement' })
  async getSubscriptionPlans(@Query() query: GetPricingDto): Promise<{
    plans: SubscriptionPlan[];
    config: typeof PRICING_CONFIG;
  }> {
    let plans = query.customerType 
      ? PricingConfigService.getPlansByCustomerType(query.customerType)
      : PricingConfigService.getPlansByCustomerType(CustomerType.SME)
        .concat(PricingConfigService.getPlansByCustomerType(CustomerType.FINANCIAL_INSTITUTION));

    return {
      plans,
      config: PRICING_CONFIG
    };
  }

  @Get('plans/:planId')
  @ApiOperation({ summary: 'Récupérer les détails d\'un plan spécifique' })
  async getPlanDetails(@Param('planId') planId: string): Promise<{
    plan: SubscriptionPlan | null;
    annualSavings?: number;
  }> {
    const plan = PricingConfigService.getPlanById(planId);
    
    if (!plan) {
      return { plan: null };
    }

    const annualSavings = plan.monthlyPriceUSD > 0 
      ? (plan.monthlyPriceUSD * 12) - plan.annualPriceUSD
      : 0;

    return {
      plan,
      annualSavings
    };
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculer le prix d\'un abonnement avec options personnalisées' })
  async calculatePrice(@Body() dto: CalculatePriceDto): Promise<{
    planId: string;
    billingPeriod: BillingPeriod;
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    savings?: number;
  }> {
    const plan = PricingConfigService.getPlanById(dto.planId);
    
    if (!plan) {
      throw new Error('Plan not found');
    }

    const originalPrice = dto.billingPeriod === BillingPeriod.ANNUAL 
      ? plan.annualPriceUSD 
      : plan.monthlyPriceUSD;

    const discountPercentage = dto.customDiscountPercentage || 0;
    const discountAmount = originalPrice * (discountPercentage / 100);
    const finalPrice = originalPrice - discountAmount;

    let savings: number | undefined = undefined;
    if (dto.billingPeriod === BillingPeriod.ANNUAL && plan.monthlyPriceUSD > 0) {
      savings = (plan.monthlyPriceUSD * 12) - finalPrice;
    }

    return {
      planId: dto.planId,
      billingPeriod: dto.billingPeriod,
      originalPrice,
      discountAmount,
      finalPrice,
      savings
    };
  }

  @Get('tokens/packages')
  @ApiOperation({ summary: 'Récupérer les packages de tokens disponibles' })
  async getTokenPackages(@Query('customerType') customerType?: CustomerType): Promise<{
    packages: TokenPurchasePackage[];
    pricePerMillion: number;
  }> {
    const packages = customerType 
      ? PricingConfigService.getTokenPackagesByCustomerType(customerType)
      : PricingConfigService.getTokenPackagesByCustomerType(CustomerType.SME)
        .concat(PricingConfigService.getTokenPackagesByCustomerType(CustomerType.FINANCIAL_INSTITUTION));

    return {
      packages,
      pricePerMillion: PRICING_CONFIG.defaultTokenPricePerMillion
    };
  }

  @Post('tokens/estimate')
  @ApiOperation({ summary: 'Estimer le coût d\'achat de tokens' })
  async estimateTokenPurchase(@Body() dto: TokenPurchaseEstimateDto): Promise<{
    package: TokenPurchasePackage | null;
    quantity: number;
    baseTokens: number;
    bonusTokens: number;
    totalTokens: number;
    totalPrice: number;
    pricePerMillion: number;
  }> {
    const pkg = PricingConfigService.getTokenPackageById(dto.packageId);
    
    if (!pkg) {
      return {
        package: null,
        quantity: 0,
        baseTokens: 0,
        bonusTokens: 0,
        totalTokens: 0,
        totalPrice: 0,
        pricePerMillion: 0
      };
    }

    const quantity = dto.quantity || 1;
    const baseTokens = pkg.tokenAmount * quantity;
    const bonusTokens = PricingConfigService.calculateBonusTokens(dto.packageId) * quantity;
    const totalTokens = baseTokens + bonusTokens;
    const totalPrice = pkg.priceUSD * quantity;

    return {
      package: pkg,
      quantity,
      baseTokens,
      bonusTokens,
      totalTokens,
      totalPrice,
      pricePerMillion: pkg.pricePerMillionTokens
    };
  }

  @Get('my-subscription')
  @ApiOperation({ summary: 'Récupérer les informations d\'abonnement du client connecté' })
  async getMySubscription(@CurrentCustomer() customer: RequestCustomer): Promise<{
    subscription: any;
    usage: {
      tokensUsed: number;
      tokensRemaining: number;
      tokensTotal: number;
      usagePercentage: number;
    };
    upgradeRecommendations: any;
  }> {
    const customerInfo = await this.featureAccessService.getCustomerSubscriptionInfo(customer.id);
    const recommendations = await this.featureAccessService.getUpgradeRecommendations(customer.id);

    const tokensUsed = customerInfo.monthlyTokenAllocation - customerInfo.remainingTokens;
    const usagePercentage = (tokensUsed / customerInfo.monthlyTokenAllocation) * 100;

    return {
      subscription: customerInfo,
      usage: {
        tokensUsed,
        tokensRemaining: customerInfo.remainingTokens,
        tokensTotal: customerInfo.monthlyTokenAllocation,
        usagePercentage
      },
      upgradeRecommendations: recommendations
    };
  }

  @Get('features/check/:featureCode')
  @ApiOperation({ summary: 'Vérifier l\'accès à une fonctionnalité spécifique' })
  async checkFeatureAccess(
    @CurrentCustomer() customer: RequestCustomer,
    @Param('featureCode') featureCode: string,
    @Query('tokenCost') tokenCost?: number
  ): Promise<{
    hasAccess: boolean;
    remainingUsage?: number;
    totalLimit?: number;
    reason?: string;
    upgradeRequired?: boolean;
  }> {
    const customerInfo = await this.featureAccessService.getCustomerSubscriptionInfo(customer.id);
    const accessCheck = await this.featureAccessService.checkFeatureAccess(
      customerInfo,
      featureCode as any, // Type assertion nécessaire
      tokenCost || 1
    );

    return {
      ...accessCheck,
      upgradeRequired: !accessCheck.hasAccess
    };
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Comparer les plans d\'abonnement' })
  async comparePlans(@Query('customerType') customerType: CustomerType): Promise<{
    plans: Array<{
      plan: SubscriptionPlan;
      features: Array<{
        featureCode: string;
        displayName: string;
        enabled: boolean;
        limit?: number;
        description?: string;
      }>;
      monthlyPrice: number;
      annualPrice: number;
      annualSavings: number;
    }>;
  }> {
    const plans = PricingConfigService.getPlansByCustomerType(customerType);

    const comparison = plans.map(plan => {
      const features = Object.entries(plan.features).map(([featureCode, featureConfig]) => ({
        featureCode,
        displayName: this.getFeatureDisplayName(featureCode),
        enabled: featureConfig.enabled,
        limit: featureConfig.limit,
        description: featureConfig.description
      }));

      const annualSavings = plan.monthlyPriceUSD > 0 
        ? (plan.monthlyPriceUSD * 12) - plan.annualPriceUSD
        : 0;

      return {
        plan,
        features,
        monthlyPrice: plan.monthlyPriceUSD,
        annualPrice: plan.annualPriceUSD,
        annualSavings
      };
    });

    return { plans: comparison };
  }

  private getFeatureDisplayName(featureCode: string): string {
    // Mappings simplifiés pour l'affichage
    const displayNames: Record<string, string> = {
      'commercial_management': 'Gestion commerciale',
      'customer_management': 'Gestion clients',
      'sales_tracking': 'Suivi des ventes',
      'inventory_management': 'Gestion stocks',
      'accounting_basic': 'Comptabilité de base',
      'accounting_advanced': 'Comptabilité avancée',
      'financial_reports': 'Rapports financiers',
      'tax_management': 'Gestion fiscale',
      'ai_chat_assistance': 'Assistant IA',
      'document_analysis': 'Analyse de documents',
      'predictive_analytics': 'Analytics prédictifs',
      'multi_user_access': 'Accès multi-utilisateurs',
      'user_invitations': 'Invitations utilisateurs',
      'role_management': 'Gestion des rôles',
      'financing_requests': 'Demandes de financement',
      'credit_scoring': 'Scoring crédit',
      'company_prospecting': 'Prospection entreprises',
      'portfolio_management': 'Gestion portefeuille',
      'risk_assessment': 'Évaluation des risques',
      'api_access': 'Accès API',
      'third_party_integrations': 'Intégrations tierces',
      'priority_support': 'Support prioritaire',
      'dedicated_support': 'Support dédié'
    };

    return displayNames[featureCode] || featureCode;
  }
}
