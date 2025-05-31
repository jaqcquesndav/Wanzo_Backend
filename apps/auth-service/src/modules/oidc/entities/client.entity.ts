import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('oidc_clients')
export class OIDCClient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  clientId!: string;

  @Column()
  clientSecret!: string;

  @Column('simple-array')
  redirectUris!: string[];

  @Column('simple-array')
  allowedScopes!: string[];

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}