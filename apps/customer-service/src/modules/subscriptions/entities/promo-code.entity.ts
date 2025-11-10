import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

export enum PromoCodeType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_TRIAL = 'free_trial',
  FREE_MONTHS = 'free_months',
}

export enum PromoCodeStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  DEPLETED = 'depleted',
  CANCELLED = 'cancelled',
}

export enum PromoCodeRestriction {
  NEW_CUSTOMERS_ONLY = 'new_customers_only',
  SPECIFIC_PLANS = 'specific_plans',
  MINIMUM_AMOUNT = 'minimum_amount',
  FIRST_TIME_USERS = 'first_time_users',
}

@Entity('promo_codes')
@Index(['code'], { unique: true })
@Index(['status', 'validFrom', 'validUntil'])
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 50 })
  code!: string;

  @Column({ length: 200 })
  name!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: PromoCodeType })
  type!: PromoCodeType;

  @Column('decimal', { precision: 10, scale: 2 })
  value!: number; // Pourcentage ou montant fixe

  @Column({ type: 'enum', enum: PromoCodeStatus, default: PromoCodeStatus.ACTIVE })
  status!: PromoCodeStatus;

  // Dates de validité
  @Column({ type: 'timestamp' })
  validFrom!: Date;

  @Column({ type: 'timestamp' })
  validUntil!: Date;

  // Limites d'utilisation
  @Column('int', { nullable: true })
  maxUses?: number; // null = illimité

  @Column('int', { default: 0 })
  currentUses!: number;

  @Column('int', { default: 1 })
  maxUsesPerCustomer!: number;

  // Restrictions
  @Column('simple-array', { nullable: true })
  restrictions?: PromoCodeRestriction[];

  @Column('simple-array', { nullable: true })
  applicablePlanIds?: string[];

  @Column('simple-array', { nullable: true })
  applicableCustomerTypes?: string[]; // 'sme', 'financial_institution'

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minimumOrderAmount?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  maximumDiscountAmount?: number; // Pour les % avec plafond

  // Stackabilité
  @Column('boolean', { default: false })
  stackable!: boolean;

  @Column('simple-array', { nullable: true })
  stackableWith?: string[]; // IDs d'autres codes promo

  // Métadonnées et tracking
  @Column('jsonb', { nullable: true })
  metadata?: {
    campaign?: string;
    source?: string;
    affiliateId?: string;
    targetAudience?: string;
    launchDate?: string;
    expectedUsage?: number;
    budget?: number;
    roi?: number;
  };

  @Column('jsonb', { nullable: true })
  analytics?: {
    totalRevenue: number;
    totalDiscount: number;
    conversionRate: number;
    averageOrderValue: number;
    topPlans: Array<{ planId: string; usage: number }>;
    customerSegments: Record<string, number>;
  };

  // Relations
  @OneToMany(() => PromoCodeUsage, usage => usage.promoCode)
  usages!: PromoCodeUsage[];

  // Administration
  @Column()
  createdBy!: string; // Admin user ID

  @Column({ nullable: true })
  updatedBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Méthodes utilitaires
  isValid(): boolean {
    const now = new Date();
    return (
      this.status === PromoCodeStatus.ACTIVE &&
      now >= this.validFrom &&
      now <= this.validUntil &&
      (this.maxUses === null || this.currentUses < this.maxUses!)
    );
  }

  canBeUsedBy(customerId: string): boolean {
    if (!this.isValid()) return false;
    
    // Vérifier le nombre d'utilisations par client
    // Cette logique sera dans le service
    return true;
  }

  calculateDiscount(orderAmount: number): number {
    if (!this.isValid()) return 0;

    let discount = 0;

    switch (this.type) {
      case PromoCodeType.PERCENTAGE:
        discount = orderAmount * (this.value / 100);
        break;
      case PromoCodeType.FIXED_AMOUNT:
        discount = this.value;
        break;
      case PromoCodeType.FREE_TRIAL:
      case PromoCodeType.FREE_MONTHS:
        // Logique spéciale dans le service
        return this.value;
    }

    // Appliquer le plafond si défini
    if (this.maximumDiscountAmount && discount > this.maximumDiscountAmount) {
      discount = this.maximumDiscountAmount;
    }

    // Ne pas dépasser le montant de la commande
    return Math.min(discount, orderAmount);
  }

  getRemainingUses(): number | null {
    if (this.maxUses === null) return null;
    return Math.max(0, this.maxUses! - this.currentUses);
  }

  isExpiringSoon(days: number = 7): boolean {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + days);
    return this.validUntil <= warningDate;
  }
}

@Entity('promo_code_usage')
@Index(['promoCodeId', 'customerId'])
@Index(['createdAt'])
export class PromoCodeUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  promoCodeId!: string;

  @Column()
  customerId!: string;

  @Column({ nullable: true })
  subscriptionId?: string;

  @Column({ nullable: true })
  invoiceId?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  orderAmount!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  discountAmount!: number;

  @Column({ length: 50 })
  planId!: string;

  @Column({ length: 50 })
  planName!: string;

  @Column()
  currency!: string;

  @Column('jsonb', { nullable: true })
  context?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    campaign?: string;
    source?: string;
  };

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @Column()
  promoCode!: PromoCode;
}