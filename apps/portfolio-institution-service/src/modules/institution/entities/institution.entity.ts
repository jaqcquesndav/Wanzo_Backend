import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { InstitutionDocument } from './institution-document.entity';
import { InstitutionUser } from './institution-user.entity';
import { SubscriptionPlanType, SubscriptionStatusType, InstitutionStatusType } from '../../../../../../packages/shared/events/kafka-config'; // Adjusted import path

export enum InstitutionType {
  BANK = 'bank',
  MICROFINANCE = 'microfinance',
  FINTECH = 'fintech',
  // ... other types
}

@Entity('institutions')
export class Institution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  kiotaId!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: InstitutionType,
  })
  type!: InstitutionType;

  @Column('jsonb')
  metadata!: Record<string, any>; // Store additional details like address, contact, etc.

  @Column({ default: true })
  active!: boolean;

  @Column({
    type: 'enum',
    enum: InstitutionStatusType,
    default: InstitutionStatusType.PENDING_VERIFICATION, // Set a default status
  })
  status!: InstitutionStatusType;

  @Column({ nullable: true })
  createdBy?: string; // User ID of the creator

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => InstitutionDocument, document => document.institution)
  documents!: InstitutionDocument[];

  @OneToMany(() => InstitutionUser, user => user.institution)
  users!: InstitutionUser[];

  // Subscription-related fields
  @Column({
    type: 'enum',
    enum: SubscriptionPlanType,
    nullable: true,
  })
  subscriptionPlan?: SubscriptionPlanType;

  @Column({
    type: 'enum',
    enum: SubscriptionStatusType,
    nullable: true,
  })
  subscriptionStatus?: SubscriptionStatusType;

  @Column({ type: 'timestamp with time zone', nullable: true })
  subscriptionEndDate?: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastSubscriptionChangeAt?: Date | null;
}