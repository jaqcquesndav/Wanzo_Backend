import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DataSharingStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
}

export enum ProviderStatus {
  CONNECTED = 'connected',
  PENDING = 'pending',
  DISCONNECTED = 'disconnected',
}

export enum ProviderType {
  BANK = 'bank',
  SUPPLIER = 'supplier',
  CUSTOMER = 'customer',
  GOVERNMENT = 'government',
  OTHER = 'other',
}

@Entity('data_sharing_settings')
export class DataSharingSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column({
    type: 'enum',
    enum: DataSharingStatus,
    default: DataSharingStatus.ENABLED
  })
  status!: DataSharingStatus;

  @Column('jsonb', { nullable: true })
  providers?: Array<{
    name: string;
    type: ProviderType;
    status: ProviderStatus;
    lastSync?: string;
  }>;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
