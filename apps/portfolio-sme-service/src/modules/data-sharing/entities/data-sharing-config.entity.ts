import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('data_sharing_configs')
export class DataSharingConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companyId!: string;

  @Column({ default: false })
  sharingEnabled!: boolean;

  @Column('simple-array', { nullable: true })
  allowedDataTypes?: string[];

  @Column({ type: 'uuid', nullable: true })
  institutionId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  consentGrantedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consentExpiresAt?: Date;

  @Column({ nullable: true })
  grantedBy?: string;

  @Column('jsonb', { nullable: true })
  sharingPreferences?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}