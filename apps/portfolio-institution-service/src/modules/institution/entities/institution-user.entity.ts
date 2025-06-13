import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Institution } from './institution.entity';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  VIEWER = 'viewer'
}

@Entity('institution_users')
export class InstitutionUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true }) // Added: Link to the central auth user ID
  authUserId!: string;

  @Column()
  kiotaId!: string;

  @Column('uuid')
  institutionId!: string;

  @ManyToOne(() => Institution, institution => institution.users)
  @JoinColumn({ name: 'institutionId' })
  institution!: Institution;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  phone!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role!: UserRole;

  @Column('jsonb')
  permissions!: {
    application: string;
    access: string;
  }[];

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ default: false })
  twoFactorEnabled!: boolean;

  @Column({ nullable: true })
  twoFactorSecret?: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ nullable: true }) // Added: To store descriptive status from events
  status?: string;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any>;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}