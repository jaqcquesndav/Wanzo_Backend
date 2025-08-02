import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DataSourceType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  API = 'api',
  DATABASE = 'database',
  FILE = 'file'
}

export enum DataSourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

@Entity('data_sources')
export class DataSource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column()
  sourceId!: string; // wanzo-mobile, web-scraping, external-db

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: DataSourceType,
  })
  type!: DataSourceType;

  @Column({
    type: 'enum',
    enum: DataSourceStatus,
    default: DataSourceStatus.ACTIVE
  })
  status!: DataSourceStatus;

  @Column('jsonb', { nullable: true })
  metadata?: any; // For storing config, icon, etc.

  @Column({ nullable: true })
  lastSyncDate?: Date;

  @Column({ nullable: true })
  lastUpdated?: Date;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
