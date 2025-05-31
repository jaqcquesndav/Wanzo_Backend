import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  legalForm?: string;

  @Column({ nullable: true })
  industry?: string;

  @Column({ nullable: true })
  rccm?: string;

  @Column({ nullable: true })
  idnat?: string;

  @Column({ nullable: true })
  nif?: string;

  @Column({ nullable: true })
  cnss?: string;

  @Column('jsonb', { default: '[]' })
  addresses!: {
    street: string;
    commune: string;
    city: string;
    province: string;
    geolocation?: {
      latitude: number;
      longitude: number;
    };
    type: string;
  }[];

  @Column('jsonb', { default: '{}' })
  contacts!: {
    email?: string;
    phone?: string;
    legalRepresentative?: string;
    position?: string;
  };

  @Column({ default: 'free' })
  subscriptionPlan!: string;

  @Column({ default: 'active' })
  subscriptionStatus!: string;

  @Column({ nullable: true })
  subscriptionExpiresAt?: Date;

  @Column({ nullable: true })
  createdBy?: string;

  @Column({ default: true })
  active!: boolean;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any>;

  @OneToMany(() => User, user => user.company)
  users!: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}