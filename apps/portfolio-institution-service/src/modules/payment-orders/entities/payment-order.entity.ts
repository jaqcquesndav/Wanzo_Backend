import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Institution } from '../../institution/entities/institution.entity';
import { Disbursement } from '../../virements/entities/disbursement.entity';

// Types de financement pour portefeuille traditionnel selon documentation
export enum TraditionalFundingType {
  OCTROI_CREDIT = 'octroi_crédit',
  COMPLEMENT_CREDIT = 'complément_crédit', 
  RESTRUCTURATION = 'restructuration',
  AUTRES = 'autres',
}

// Statuts alignés avec la documentation
export enum PaymentOrderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

// Types de portefeuille selon documentation
export enum PortfolioType {
  TRADITIONAL = 'traditional',
}

@Entity('payment_orders')
export class PaymentOrder {
  @ApiProperty({ description: 'Unique identifier for the payment order' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Portfolio type', enum: PortfolioType })
  @Column({
    type: 'enum',
    enum: PortfolioType,
    default: PortfolioType.TRADITIONAL,
  })
  portfolioType: PortfolioType;

  @ApiProperty({ description: 'Type of funding for traditional portfolio', enum: TraditionalFundingType })
  @Column({
    type: 'enum',
    enum: TraditionalFundingType,
    default: TraditionalFundingType.OCTROI_CREDIT,
  })
  fundingType: TraditionalFundingType;

  @ApiProperty({ description: 'Payment amount' })
  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'Payment date' })
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({ description: 'Company/Beneficiary name' })
  @Column()
  company: string;

  @ApiProperty({ description: 'Current status of the payment order', enum: PaymentOrderStatus })
  @Column({
    type: 'enum',
    enum: PaymentOrderStatus,
    default: PaymentOrderStatus.PENDING,
  })
  status: PaymentOrderStatus;

  @ApiProperty({ description: 'Reference number for the payment' })
  @Column({ unique: true })
  reference: string;

  @ApiProperty({ description: 'Description of the payment order' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Related contract reference' })
  @Column()
  contractReference: string;

  @ApiProperty({ description: 'Product name/type' })
  @Column()
  product: string;

  @ApiProperty({ description: 'Related credit request ID', required: false })
  @Column({ nullable: true })
  requestId?: string;

  @ApiProperty({ description: 'Institution ID' })
  @Column()
  institutionId: string;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @ApiProperty({ description: 'Related portfolio ID' })
  @Column()
  portfolioId: string;

  @ApiProperty({ description: 'Additional metadata' })
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Disbursement, disbursement => disbursement.paymentOrder)
  disbursements: Disbursement[];

  @ApiProperty({ description: 'Created date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Updated date' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  @Column()
  createdBy: string;

  @ApiProperty({ description: 'Last modified by user ID' })
  @Column({ nullable: true })
  modifiedBy: string;
}