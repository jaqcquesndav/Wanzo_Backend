import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Asset } from './asset.entity';

export enum ValuationType {
  MARKET = 'market',
  BOOK = 'book',
  APPRAISAL = 'appraisal'
}

@Entity('asset_valuations')
export class AssetValuation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  assetId!: string;

  @ManyToOne(() => Asset, asset => asset.valuations)
  @JoinColumn({ name: 'assetId' })
  asset!: Asset;

  @Column({
    type: 'enum',
    enum: ValuationType,
  })
  type!: ValuationType;

  @Column('decimal', { precision: 15, scale: 2 })
  value!: number;

  @Column()
  valuationDate!: Date;

  @Column({ nullable: true })
  appraiser?: string;

  @Column('jsonb', { nullable: true })
  methodology?: {
    approach: string;
    comparables?: string[];
    adjustments?: Record<string, number>;
  };

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ nullable: true })
  validUntil?: Date;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;
}