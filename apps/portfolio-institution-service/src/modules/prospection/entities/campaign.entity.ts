import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CampaignType {
  EMAIL = 'email',
  CALL = 'call',
  EVENT = 'event',
  OTHER = 'other',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: CampaignType,
  })
  type: CampaignType;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column('jsonb')
  target: {
    sectors: string[];
    regions: string[];
    minRevenue: number;
    maxRevenue: number;
    companySize: string;
  };

  @Column('jsonb', { default: () => "'{ \"reached\": 0, \"responded\": 0, \"converted\": 0, \"roi\": 0 }'" })
  metrics: {
    reached: number;
    responded: number;
    converted: number;
    roi: number;
  };

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
