import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../users/entities/user.entity';
import { CustomerType, TokenType, TokenTransactionType, AppType } from '../../../shared/enums';

// Re-export enums for backward compatibility
export { CustomerType, TokenType, TokenTransactionType, AppType };

@Entity('token_packages')
export class TokenPackage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column()
    tokenAmount: number;

    @Column('decimal', { precision: 10, scale: 2 })
    priceUSD: number;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    priceLocal?: number;

    @Column({ nullable: true })
    localCurrency?: string;

    @Column({ default: false })
    isPopular?: boolean;

    @Column()
    validityDays: number;

    @Column('simple-array')
    targetCustomerTypes: CustomerType[];

    @Column('jsonb', { nullable: true })
    customerTypeSpecific?: any[]; // CustomerTypeSpecificMetadata

    @Column({ nullable: true })
    minimumPurchase?: number;

    @Column('jsonb', { nullable: true })
    discountPercentages?: any; // Discount tiers
}

@Entity('token_balances')
export class TokenBalance {
    @PrimaryGeneratedColumn('uuid')
    id: string; // Added for TypeORM

    @Column()
    customerId: string;

    @ManyToOne(() => Customer)
    @JoinColumn({ name: 'customerId' })
    customer: Customer;

    @Column({ type: 'enum', enum: TokenType })
    tokenType: TokenType;

    @Column()
    balance: number;

    @UpdateDateColumn()
    lastUpdatedAt: Date;
}

@Entity('token_transactions')
export class TokenTransaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    customerId: string;

    @ManyToOne(() => Customer)
    @JoinColumn({ name: 'customerId' })
    customer: Customer;

    @Column({ nullable: true })
    subscriptionId?: string;

    @Column({ nullable: true })
    packageId?: string;

    @ManyToOne(() => TokenPackage)
    @JoinColumn({ name: 'packageId' })
    package: TokenPackage;

    @Column({ type: 'enum', enum: TokenTransactionType })
    type: TokenTransactionType;

    @Column()
    amount: number;

    @Column()
    balance: number;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn()
    timestamp: Date;

    @Column({ type: 'timestamp', nullable: true })
    expiryDate?: Date;

    @Column('jsonb', { nullable: true })
    metadata?: Record<string, any>;
}

@Entity('token_usages')
export class TokenUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    customerId: string;

    @ManyToOne(() => Customer)
    @JoinColumn({ name: 'customerId' })
    customer: Customer;

    @Column()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'enum', enum: AppType })
    appType: AppType;

    @Column()
    tokensUsed: number;

    @Column({ type: 'timestamp' })
    date: Date;

    @Column()
    feature: string;

    @Column({ type: 'text', nullable: true })
    prompt?: string;

    @Column()
    responseTokens: number;

    @Column()
    requestTokens: number;

    @Column('decimal', { precision: 10, scale: 4 })
    cost: number;
}
