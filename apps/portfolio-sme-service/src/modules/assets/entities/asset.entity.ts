import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AssetValuation } from './asset-valuation.entity';

export enum AssetType {
  REAL_ESTATE = 'real_estate',
  VEHICLE = 'vehicle',
  EQUIPMENT = 'equipment',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  OTHER = 'other'
}

export enum AssetStatus {
  ACTIVE = 'active',
  UNDER_MAINTENANCE = 'under_maintenance',
  INACTIVE = 'inactive',
  SOLD = 'sold'
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: AssetType,
  })
  type!: AssetType;

  @Column({
    type: 'enum',
    enum: AssetStatus,
    default: AssetStatus.ACTIVE
  })
  status!: AssetStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  acquisitionValue!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  currentValue!: number;

  @Column()
  acquisitionDate!: Date;

  @Column('jsonb')
  specifications!: {
    location?: string;
    dimensions?: string;
    condition?: string;
    documents?: {
      type: string;
      url: string;
      validUntil?: Date;
    }[];
    [key: string]: any;
  };

  @Column('jsonb')
  maintenanceHistory!: {
    date: Date;
    type: string;
    description: string;
    cost: number;
    provider: string;
  }[];

  @Column('jsonb')
  insuranceInfo!: {
    provider: string;
    policyNumber: string;
    coverage: string[];
    startDate: Date;
    endDate: Date;
    cost: number;
  };

  @OneToMany(() => AssetValuation, valuation => valuation.asset)
  valuations!: AssetValuation[];

  @Column({ nullable: true })
  companyId?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}