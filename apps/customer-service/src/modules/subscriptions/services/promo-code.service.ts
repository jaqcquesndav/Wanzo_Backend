import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between, In } from 'typeorm';
import { PromoCode, PromoCodeUsage, PromoCodeStatus, PromoCodeType, PromoCodeRestriction } from '../entities/promo-code.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Subscription } from '../entities/subscription.entity';

export interface PromoValidationResult {
  valid: boolean;
  reason?: string;
  discountAmount?: number;
  finalAmount?: number;
  promoCode?: PromoCode;
  restrictions?: string[];
}

export interface PromoApplicationResult {
  success: boolean;
  promoCodeId: string;
  discountAmount: number;
  finalAmount: number;
  usageId: string;
  message: string;
}

export interface PromoCodeAnalytics {
  totalUsage: number;
  totalRevenue: number;
  totalDiscount: number;
  conversionRate: number;
  averageOrderValue: number;
  topCustomers: Array<{ customerId: string; usage: number; revenue: number }>;
  topPlans: Array<{ planId: string; planName: string; usage: number }>;
  usageByPeriod: Array<{ period: string; usage: number; revenue: number }>;
  customerSegmentation: Record<string, number>;
  projectedROI: number;
}

@Injectable()
export class PromoCodeService {
  private readonly logger = new Logger(PromoCodeService.name);

  constructor(
    @InjectRepository(PromoCode)
    private promoCodeRepository: Repository<PromoCode>,
    @InjectRepository(PromoCodeUsage)
    private usageRepository: Repository<PromoCodeUsage>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  /**
   * Valide un code promo pour un client et un montant donnés
   */
  async validatePromoCode(
    code: string,
    customerId: string,
    planId: string,
    orderAmount: number,
    customerType?: string
  ): Promise<PromoValidationResult> {
    try {
      // Récupérer le code promo
      const promoCode = await this.promoCodeRepository.findOne({
        where: { code: code.toUpperCase() },
        relations: ['usages']
      });

      if (!promoCode) {
        return {
          valid: false,
          reason: 'Code promo invalide'
        };
      }

      // Vérifications de base
      if (!promoCode.isValid()) {
        return {
          valid: false,
          reason: this.getInvalidReason(promoCode)
        };
      }

      // Vérifier les restrictions
      const restrictionCheck = await this.checkRestrictions(
        promoCode,
        customerId,
        planId,
        orderAmount,
        customerType
      );

      if (!restrictionCheck.valid) {
        return restrictionCheck;
      }

      // Calculer la remise
      const discountAmount = this.calculateDiscountAmount(promoCode, orderAmount);
      const finalAmount = Math.max(0, orderAmount - discountAmount);

      return {
        valid: true,
        discountAmount,
        finalAmount,
        promoCode,
        restrictions: restrictionCheck.restrictions
      };

    } catch (error) {
      this.logger.error('Error validating promo code', { code, customerId, error });
      return {
        valid: false,
        reason: 'Erreur de validation du code promo'
      };
    }
  }

  /**
   * Applique un code promo et enregistre l'utilisation
   */
  async applyPromoCode(
    code: string,
    customerId: string,
    planId: string,
    planName: string,
    orderAmount: number,
    currency: string,
    subscriptionId?: string,
    invoiceId?: string,
    context?: any
  ): Promise<PromoApplicationResult> {
    // Valider d'abord
    const validation = await this.validatePromoCode(code, customerId, planId, orderAmount);
    
    if (!validation.valid || !validation.promoCode) {
      throw new BadRequestException(validation.reason);
    }

    const promoCode = validation.promoCode;

    try {
      // Enregistrer l'utilisation
      const usage = this.usageRepository.create({
        promoCodeId: promoCode.id,
        customerId,
        subscriptionId,
        invoiceId,
        orderAmount,
        discountAmount: validation.discountAmount!,
        planId,
        planName,
        currency,
        context
      });

      const savedUsage = await this.usageRepository.save(usage);

      // Mettre à jour le compteur d'utilisations
      await this.promoCodeRepository.increment(
        { id: promoCode.id },
        'currentUses',
        1
      );

      // Mettre à jour les analytics
      await this.updatePromoCodeAnalytics(promoCode.id, validation.discountAmount!, orderAmount);

      this.logger.log(`Promo code applied: ${code} for customer ${customerId}`, {
        discountAmount: validation.discountAmount,
        finalAmount: validation.finalAmount
      });

      return {
        success: true,
        promoCodeId: promoCode.id,
        discountAmount: validation.discountAmount!,
        finalAmount: validation.finalAmount!,
        usageId: savedUsage.id,
        message: `Code promo "${code}" appliqué avec succès. Remise: ${validation.discountAmount} ${currency}`
      };

    } catch (error) {
      this.logger.error('Error applying promo code', { code, customerId, error });
      throw new BadRequestException('Erreur lors de l\'application du code promo');
    }
  }

  /**
   * Vérifie les restrictions d'un code promo
   */
  private async checkRestrictions(
    promoCode: PromoCode,
    customerId: string,
    planId: string,
    orderAmount: number,
    customerType?: string
  ): Promise<PromoValidationResult> {
    const restrictions: string[] = [];

    // Vérifier les utilisations par client
    const customerUsages = await this.usageRepository.count({
      where: {
        promoCodeId: promoCode.id,
        customerId
      }
    });

    if (customerUsages >= promoCode.maxUsesPerCustomer) {
      return {
        valid: false,
        reason: `Ce code a déjà été utilisé le maximum de fois autorisé (${promoCode.maxUsesPerCustomer})`
      };
    }

    // Vérifier les restrictions spécifiques
    if (promoCode.restrictions) {
      for (const restriction of promoCode.restrictions) {
        switch (restriction) {
          case PromoCodeRestriction.NEW_CUSTOMERS_ONLY:
            const hasExistingSubscription = await this.subscriptionRepository.count({
              where: { customerId }
            });
            if (hasExistingSubscription > 0) {
              return {
                valid: false,
                reason: 'Ce code est réservé aux nouveaux clients'
              };
            }
            break;

          case PromoCodeRestriction.SPECIFIC_PLANS:
            if (promoCode.applicablePlanIds && !promoCode.applicablePlanIds.includes(planId)) {
              return {
                valid: false,
                reason: 'Ce code n\'est pas applicable à ce plan'
              };
            }
            break;

          case PromoCodeRestriction.MINIMUM_AMOUNT:
            if (promoCode.minimumOrderAmount && orderAmount < promoCode.minimumOrderAmount) {
              return {
                valid: false,
                reason: `Montant minimum requis: ${promoCode.minimumOrderAmount}`
              };
            }
            break;
        }
      }
    }

    // Vérifier le type de client
    if (promoCode.applicableCustomerTypes && customerType) {
      if (!promoCode.applicableCustomerTypes.includes(customerType)) {
        return {
          valid: false,
          reason: 'Ce code n\'est pas applicable à votre type de compte'
        };
      }
    }

    return {
      valid: true,
      restrictions
    };
  }

  /**
   * Calcule le montant de la remise
   */
  private calculateDiscountAmount(promoCode: PromoCode, orderAmount: number): number {
    let discount = 0;

    switch (promoCode.type) {
      case PromoCodeType.PERCENTAGE:
        discount = orderAmount * (promoCode.value / 100);
        break;
      case PromoCodeType.FIXED_AMOUNT:
        discount = promoCode.value;
        break;
      case PromoCodeType.FREE_TRIAL:
      case PromoCodeType.FREE_MONTHS:
        // Pour les essais gratuits, la remise est égale au montant total
        return orderAmount;
    }

    // Appliquer le plafond si défini
    if (promoCode.maximumDiscountAmount && discount > promoCode.maximumDiscountAmount) {
      discount = promoCode.maximumDiscountAmount;
    }

    // Ne pas dépasser le montant de la commande
    return Math.min(discount, orderAmount);
  }

  /**
   * Met à jour les analytics du code promo
   */
  private async updatePromoCodeAnalytics(
    promoCodeId: string,
    discountAmount: number,
    orderAmount: number
  ): Promise<void> {
    const promoCode = await this.promoCodeRepository.findOne({
      where: { id: promoCodeId }
    });

    if (!promoCode) return;

    const currentAnalytics = promoCode.analytics || {
      totalRevenue: 0,
      totalDiscount: 0,
      conversionRate: 0,
      averageOrderValue: 0,
      topPlans: [],
      customerSegments: {}
    };

    // Mettre à jour les métriques
    currentAnalytics.totalRevenue += orderAmount;
    currentAnalytics.totalDiscount += discountAmount;
    currentAnalytics.averageOrderValue = currentAnalytics.totalRevenue / promoCode.currentUses;

    await this.promoCodeRepository.update(promoCodeId, {
      analytics: currentAnalytics
    });
  }

  /**
   * Obtient les analytics détaillées d'un code promo
   */
  async getPromoCodeAnalytics(promoCodeId: string): Promise<PromoCodeAnalytics> {
    const promoCode = await this.promoCodeRepository.findOne({
      where: { id: promoCodeId },
      relations: ['usages']
    });

    if (!promoCode) {
      throw new NotFoundException('Code promo non trouvé');
    }

    const usages = await this.usageRepository.find({
      where: { promoCodeId }
    });

    // Calculer les métriques
    const totalUsage = usages.length;
    const totalRevenue = usages.reduce((sum, usage) => sum + Number(usage.orderAmount), 0);
    const totalDiscount = usages.reduce((sum, usage) => sum + Number(usage.discountAmount), 0);
    const averageOrderValue = totalUsage > 0 ? totalRevenue / totalUsage : 0;

    // Top customers
    const customerStats = usages.reduce((acc, usage) => {
      if (!acc[usage.customerId]) {
        acc[usage.customerId] = { usage: 0, revenue: 0 };
      }
      acc[usage.customerId].usage++;
      acc[usage.customerId].revenue += Number(usage.orderAmount);
      return acc;
    }, {} as Record<string, { usage: number; revenue: number }>);

    const topCustomers = Object.entries(customerStats)
      .map(([customerId, stats]) => ({ customerId, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top plans
    const planStats = usages.reduce((acc, usage) => {
      if (!acc[usage.planId]) {
        acc[usage.planId] = { planName: usage.planName, usage: 0 };
      }
      acc[usage.planId].usage++;
      return acc;
    }, {} as Record<string, { planName: string; usage: number }>);

    const topPlans = Object.entries(planStats)
      .map(([planId, stats]) => ({ planId, ...stats }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);

    // Calcul du ROI projeté
    const expectedRevenue = promoCode.metadata?.expectedUsage 
      ? promoCode.metadata.expectedUsage * averageOrderValue 
      : totalRevenue * 2; // Estimation

    const projectedROI = promoCode.metadata?.budget 
      ? ((expectedRevenue - promoCode.metadata.budget) / promoCode.metadata.budget) * 100
      : 0;

    return {
      totalUsage,
      totalRevenue,
      totalDiscount,
      conversionRate: totalUsage / (promoCode.maxUses || totalUsage) * 100,
      averageOrderValue,
      topCustomers,
      topPlans,
      usageByPeriod: [], // À implémenter selon les besoins
      customerSegmentation: {},
      projectedROI
    };
  }

  /**
   * Désactive un code promo
   */
  async deactivatePromoCode(promoCodeId: string, reason: string): Promise<void> {
    // Récupérer les métadonnées existantes
    const existingPromoCode = await this.promoCodeRepository.findOne({
      where: { id: promoCodeId }
    });

    const updatedMetadata = {
      ...existingPromoCode?.metadata,
      deactivationReason: reason,
      deactivatedAt: new Date().toISOString()
    };

    await this.promoCodeRepository.update(promoCodeId, {
      status: PromoCodeStatus.CANCELLED,
      metadata: updatedMetadata
    });
  }

  /**
   * Obtient la raison pour laquelle un code promo est invalide
   */
  private getInvalidReason(promoCode: PromoCode): string {
    const now = new Date();

    if (promoCode.status !== PromoCodeStatus.ACTIVE) {
      return `Code désactivé (${promoCode.status})`;
    }

    if (now < promoCode.validFrom) {
      return 'Code pas encore actif';
    }

    if (now > promoCode.validUntil) {
      return 'Code expiré';
    }

    if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
      return 'Code épuisé';
    }

    return 'Code invalide';
  }

  /**
   * Recherche les codes promo stackables avec un code donné
   */
  async findStackableCodes(baseCodeId: string): Promise<PromoCode[]> {
    const baseCode = await this.promoCodeRepository.findOne({
      where: { id: baseCodeId }
    });

    if (!baseCode || !baseCode.stackable) {
      return [];
    }

    const stackableIds = baseCode.stackableWith || [];
    if (stackableIds.length === 0) {
      return [];
    }

    return this.promoCodeRepository.find({
      where: {
        id: In(stackableIds),
        status: PromoCodeStatus.ACTIVE
      }
    });
  }
}