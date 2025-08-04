import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  PricingConfigService, 
  FeatureCode, 
  CustomerType,
  SUBSCRIPTION_PLANS 
} from '../../../config/subscription-pricing.config';
import { TokenUsage, TokenServiceType } from '../../tokens/entities/token-usage.entity';
import { TokenPurchase } from '../../tokens/entities/token-purchase.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { DatabaseFeatureAccessService } from './database-feature-access.service';

export interface FeatureAccessCheck {
  hasAccess: boolean;
  remainingUsage?: number;
  totalLimit?: number;
  reason?: string;
}

export interface CustomerSubscriptionInfo {
  customerId: string;
  customerType: CustomerType;
  currentPlanId: string;
  subscriptionStatus: 'active' | 'trial' | 'expired' | 'canceled';
  remainingTokens: number;
  monthlyTokenAllocation: number;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
}

@Injectable()
export class FeatureAccessService {
  
  constructor(
    @InjectRepository(TokenUsage)
    private tokenUsageRepository: Repository<TokenUsage>,
    @InjectRepository(TokenPurchase)
    private tokenPurchaseRepository: Repository<TokenPurchase>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}
  
  /**
   * Vérifie si un client a accès à une fonctionnalité spécifique
   */
  async checkFeatureAccess(
    customerInfo: CustomerSubscriptionInfo,
    featureCode: FeatureCode,
    requestedUsage: number = 1
  ): Promise<FeatureAccessCheck> {
    
    // Vérifier si l'abonnement est actif
    if (customerInfo.subscriptionStatus !== 'active' && customerInfo.subscriptionStatus !== 'trial') {
      return {
        hasAccess: false,
        reason: 'Subscription is not active'
      };
    }
    
    // Récupérer la configuration du plan
    const plan = PricingConfigService.getPlanById(customerInfo.currentPlanId);
    if (!plan) {
      return {
        hasAccess: false,
        reason: 'Plan configuration not found'
      };
    }
    
    // Vérifier si la fonctionnalité est disponible dans le plan
    const featureConfig = plan.features[featureCode];
    if (!featureConfig || !featureConfig.enabled) {
      return {
        hasAccess: false,
        reason: `Feature ${featureCode} is not available in current plan`
      };
    }
    
    // Si pas de limite, accès autorisé
    if (featureConfig.limit === undefined) {
      return {
        hasAccess: true,
        reason: 'Unlimited access'
      };
    }
    
    // Pour les fonctionnalités consommant des tokens
    if (this.isTokenBasedFeature(featureCode)) {
      return this.checkTokenBasedAccess(customerInfo, requestedUsage);
    }
    
    // Pour les autres fonctionnalités avec limite
    // Ici vous devriez implémenter la logique pour récupérer l'usage actuel
    // depuis la base de données
    const currentUsage = await this.getCurrentFeatureUsage(
      customerInfo.customerId, 
      featureCode
    );
    
    const remainingUsage = featureConfig.limit - currentUsage;
    
    if (requestedUsage > remainingUsage) {
      return {
        hasAccess: false,
        remainingUsage,
        totalLimit: featureConfig.limit,
        reason: `Feature limit exceeded. ${remainingUsage} remaining out of ${featureConfig.limit}`
      };
    }
    
    return {
      hasAccess: true,
      remainingUsage,
      totalLimit: featureConfig.limit
    };
  }
  
  /**
   * Vérifie l'accès basé sur les tokens
   */
  private checkTokenBasedAccess(
    customerInfo: CustomerSubscriptionInfo,
    requestedTokens: number
  ): FeatureAccessCheck {
    if (requestedTokens > customerInfo.remainingTokens) {
      return {
        hasAccess: false,
        remainingUsage: customerInfo.remainingTokens,
        totalLimit: customerInfo.monthlyTokenAllocation,
        reason: `Insufficient tokens. ${customerInfo.remainingTokens} remaining, ${requestedTokens} requested`
      };
    }
    
    return {
      hasAccess: true,
      remainingUsage: customerInfo.remainingTokens,
      totalLimit: customerInfo.monthlyTokenAllocation
    };
  }
  
  /**
   * Détermine si une fonctionnalité consomme des tokens
   */
  private isTokenBasedFeature(featureCode: FeatureCode): boolean {
    const tokenBasedFeatures = [
      FeatureCode.AI_CHAT_ASSISTANCE,
      FeatureCode.DOCUMENT_ANALYSIS,
      FeatureCode.PREDICTIVE_ANALYTICS,
      FeatureCode.CREDIT_SCORING,
      FeatureCode.RISK_ASSESSMENT
    ];
    
    return tokenBasedFeatures.includes(featureCode);
  }
  
  /**
   * Récupère l'usage actuel d'une fonctionnalité
   * Cette méthode utilise maintenant la base de données
   */
  private async getCurrentFeatureUsage(
    customerId: string, 
    featureCode: FeatureCode
  ): Promise<number> {
    // Calculer l'usage du mois en cours
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const startOfMonth = new Date(currentMonth + '-01');
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const usages = await this.tokenUsageRepository
      .createQueryBuilder('usage')
      .where('usage.customerId = :customerId', { customerId })
      .andWhere('usage.timestamp >= :startOfMonth', { startOfMonth })
      .andWhere('usage.timestamp < :endOfMonth', { endOfMonth })
      .getMany();

    // Pour l'instant, on retourne le nombre d'usages
    // Plus tard, on pourrait mapper les codes de fonctionnalités
    return usages.length;
  }
  
  /**
   * Enregistre l'usage d'une fonctionnalité
   */
  async recordFeatureUsage(
    customerId: string,
    featureCode: FeatureCode,
    usage: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Créer un enregistrement d'usage de tokens
    const tokenUsage = this.tokenUsageRepository.create({
      customerId,
      userId: customerId, // Pour l'instant, on utilise le customerId
      amount: usage,
      serviceType: this.mapFeatureToServiceType(featureCode),
      context: { featureCode, usage },
      metadata: metadata || {}
    });

    await this.tokenUsageRepository.save(tokenUsage);
  }
  
  /**
   * Consomme des tokens et enregistre l'usage
   */
  async consumeTokens(
    customerId: string,
    tokenAmount: number,
    featureCode: FeatureCode,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Enregistrer la consommation de tokens
    const tokenUsage = this.tokenUsageRepository.create({
      customerId,
      userId: customerId,
      amount: tokenAmount,
      serviceType: this.mapFeatureToServiceType(featureCode),
      context: { featureCode, consumed: true },
      metadata: metadata || {}
    });

    await this.tokenUsageRepository.save(tokenUsage);
  }
  
  /**
   * Récupère les informations d'abonnement d'un client
   */
  async getCustomerSubscriptionInfo(customerId: string): Promise<CustomerSubscriptionInfo> {
    // Pour l'instant, on retourne des données mock
    // Plus tard, on devra récupérer les vraies données depuis la DB
    const customer = await this.customerRepository.findOne({ 
      where: { id: customerId },
      relations: ['subscriptions']
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Calculer les tokens restants (logique simplifiée)
    const monthlyAllocation = 100000; // Valeur par défaut
    const usedTokens = await this.getUsedTokensThisMonth(customerId);
    const remainingTokens = Math.max(0, monthlyAllocation - usedTokens);

    // Mapper le type de client
    const customerType = customer.type === 'financial' 
      ? CustomerType.FINANCIAL_INSTITUTION 
      : CustomerType.SME;

    return {
      customerId,
      customerType,
      currentPlanId: 'sme-freemium', // Par défaut
      subscriptionStatus: 'active',
      remainingTokens,
      monthlyTokenAllocation: monthlyAllocation,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }
  
  /**
   * Calcule les recommandations d'upgrade pour un client
   */
  async getUpgradeRecommendations(customerId: string): Promise<{
    currentPlan: string;
    recommendedPlans: Array<{
      planId: string;
      planName: string;
      benefits: string[];
      monthlyPrice: number;
      annualPrice: number;
    }>;
  }> {
    const customerInfo = await this.getCustomerSubscriptionInfo(customerId);
    const availablePlans = PricingConfigService.getPlansByCustomerType(customerInfo.customerType);
    
    const currentPlanIndex = availablePlans.findIndex(plan => plan.id === customerInfo.currentPlanId);
    const higherPlans = availablePlans.slice(currentPlanIndex + 1);
    
    return {
      currentPlan: customerInfo.currentPlanId,
      recommendedPlans: higherPlans.map(plan => ({
        planId: plan.id,
        planName: plan.name,
        benefits: this.getPlanBenefits(customerInfo.currentPlanId, plan.id),
        monthlyPrice: plan.monthlyPriceUSD,
        annualPrice: plan.annualPriceUSD
      }))
    };
  }
  
  /**
   * Compare deux plans et retourne les bénéfices du plan supérieur
   */
  private getPlanBenefits(currentPlanId: string, targetPlanId: string): string[] {
    const currentPlan = PricingConfigService.getPlanById(currentPlanId);
    const targetPlan = PricingConfigService.getPlanById(targetPlanId);
    
    if (!currentPlan || !targetPlan) return [];
    
    const benefits: string[] = [];
    
    // Comparer les tokens
    if (targetPlan.tokenAllocation.monthlyTokens > currentPlan.tokenAllocation.monthlyTokens) {
      benefits.push(`${targetPlan.tokenAllocation.monthlyTokens.toLocaleString()} tokens/mois (+${(targetPlan.tokenAllocation.monthlyTokens - currentPlan.tokenAllocation.monthlyTokens).toLocaleString()})`);
    }
    
    // Comparer les fonctionnalités
    Object.keys(targetPlan.features).forEach(featureKey => {
      const featureCode = featureKey as FeatureCode;
      const currentFeature = currentPlan.features[featureCode];
      const targetFeature = targetPlan.features[featureCode];
      
      if (!currentFeature.enabled && targetFeature.enabled) {
        benefits.push(`Accès à ${this.getFeatureDisplayName(featureCode)}`);
      } else if (
        currentFeature.enabled && 
        targetFeature.enabled && 
        targetFeature.limit && 
        currentFeature.limit &&
        targetFeature.limit > currentFeature.limit
      ) {
        benefits.push(`${this.getFeatureDisplayName(featureCode)}: ${targetFeature.limit} (vs ${currentFeature.limit})`);
      }
    });
    
    return benefits;
  }
  
  /**
   * Convertit un code de fonctionnalité en nom d'affichage
   */
  private getFeatureDisplayName(featureCode: FeatureCode): string {
    const displayNames: Record<FeatureCode, string> = {
      [FeatureCode.COMMERCIAL_MANAGEMENT]: 'Gestion commerciale',
      [FeatureCode.CUSTOMER_MANAGEMENT]: 'Gestion clients',
      [FeatureCode.SALES_TRACKING]: 'Suivi des ventes',
      [FeatureCode.INVENTORY_MANAGEMENT]: 'Gestion stocks',
      [FeatureCode.ACCOUNTING_BASIC]: 'Comptabilité de base',
      [FeatureCode.ACCOUNTING_ADVANCED]: 'Comptabilité avancée',
      [FeatureCode.FINANCIAL_REPORTS]: 'Rapports financiers',
      [FeatureCode.TAX_MANAGEMENT]: 'Gestion fiscale',
      [FeatureCode.AI_CHAT_ASSISTANCE]: 'Assistant IA',
      [FeatureCode.DOCUMENT_ANALYSIS]: 'Analyse de documents',
      [FeatureCode.PREDICTIVE_ANALYTICS]: 'Analytics prédictifs',
      [FeatureCode.MULTI_USER_ACCESS]: 'Accès multi-utilisateurs',
      [FeatureCode.USER_INVITATIONS]: 'Invitations utilisateurs',
      [FeatureCode.ROLE_MANAGEMENT]: 'Gestion des rôles',
      [FeatureCode.FINANCING_REQUESTS]: 'Demandes de financement',
      [FeatureCode.CREDIT_SCORING]: 'Scoring crédit',
      [FeatureCode.COMPANY_PROSPECTING]: 'Prospection entreprises',
      [FeatureCode.PORTFOLIO_MANAGEMENT]: 'Gestion portefeuille',
      [FeatureCode.RISK_ASSESSMENT]: 'Évaluation des risques',
      [FeatureCode.API_ACCESS]: 'Accès API',
      [FeatureCode.THIRD_PARTY_INTEGRATIONS]: 'Intégrations tierces',
      [FeatureCode.PRIORITY_SUPPORT]: 'Support prioritaire',
      [FeatureCode.DEDICATED_SUPPORT]: 'Support dédié'
    };
    
    return displayNames[featureCode] || featureCode;
  }

  /**
   * Calcule les tokens utilisés ce mois-ci
   */
  private async getUsedTokensThisMonth(customerId: string): Promise<number> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const startOfMonth = new Date(currentMonth + '-01');
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const result = await this.tokenUsageRepository
      .createQueryBuilder('usage')
      .select('SUM(usage.amount)', 'total')
      .where('usage.customerId = :customerId', { customerId })
      .andWhere('usage.timestamp >= :startOfMonth', { startOfMonth })
      .andWhere('usage.timestamp < :endOfMonth', { endOfMonth })
      .getRawOne();

    return parseInt(result?.total || '0', 10);
  }

  /**
   * Mappe un code de fonctionnalité vers un type de service de tokens
   */
  private mapFeatureToServiceType(featureCode: FeatureCode): TokenServiceType {
    const mapping: Record<FeatureCode, TokenServiceType> = {
      [FeatureCode.COMMERCIAL_MANAGEMENT]: TokenServiceType.OTHER,
      [FeatureCode.CUSTOMER_MANAGEMENT]: TokenServiceType.OTHER,
      [FeatureCode.SALES_TRACKING]: TokenServiceType.ANALYTICS,
      [FeatureCode.INVENTORY_MANAGEMENT]: TokenServiceType.OTHER,
      [FeatureCode.ACCOUNTING_BASIC]: TokenServiceType.ACCOUNTING_AI,
      [FeatureCode.ACCOUNTING_ADVANCED]: TokenServiceType.ACCOUNTING_AI,
      [FeatureCode.FINANCIAL_REPORTS]: TokenServiceType.ANALYTICS,
      [FeatureCode.TAX_MANAGEMENT]: TokenServiceType.ACCOUNTING_AI,
      [FeatureCode.AI_CHAT_ASSISTANCE]: TokenServiceType.CHATBOT,
      [FeatureCode.DOCUMENT_ANALYSIS]: TokenServiceType.DOCUMENT_PROCESSING,
      [FeatureCode.PREDICTIVE_ANALYTICS]: TokenServiceType.ANALYTICS,
      [FeatureCode.MULTI_USER_ACCESS]: TokenServiceType.OTHER,
      [FeatureCode.USER_INVITATIONS]: TokenServiceType.OTHER,
      [FeatureCode.ROLE_MANAGEMENT]: TokenServiceType.OTHER,
      [FeatureCode.FINANCING_REQUESTS]: TokenServiceType.ANALYTICS,
      [FeatureCode.CREDIT_SCORING]: TokenServiceType.ANALYTICS,
      [FeatureCode.COMPANY_PROSPECTING]: TokenServiceType.ANALYTICS,
      [FeatureCode.PORTFOLIO_MANAGEMENT]: TokenServiceType.ANALYTICS,
      [FeatureCode.RISK_ASSESSMENT]: TokenServiceType.ANALYTICS,
      [FeatureCode.API_ACCESS]: TokenServiceType.OTHER,
      [FeatureCode.THIRD_PARTY_INTEGRATIONS]: TokenServiceType.OTHER,
      [FeatureCode.PRIORITY_SUPPORT]: TokenServiceType.OTHER,
      [FeatureCode.DEDICATED_SUPPORT]: TokenServiceType.OTHER
    };

    return mapping[featureCode] || TokenServiceType.OTHER;
  }
}
