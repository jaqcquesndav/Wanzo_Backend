import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('oidc_sessions')
export class OIDCSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  clientId!: string;

  @Column('simple-array')
  scopes!: string[];

  @Column()
  nonce!: string;

  @Column()
  authTime!: Date;

  @Column('jsonb')
  claims!: Record<string, any>;

  @Column({ nullable: true })
  acr?: string;

  @Column('simple-array', { nullable: true })
  amr?: string[];

  @Column()
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}