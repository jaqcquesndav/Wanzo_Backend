import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('authorization_codes')
export class AuthorizationCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  code!: string;

  @Column()
  clientId!: string;

  @Column()
  userId!: string;

  @Column('simple-array')
  scopes!: string[];

  @Column()
  redirectUri!: string;

  @Column()
  expiresAt!: Date;

  @Column({ nullable: true })
  codeChallenge?: string;

  @Column({ nullable: true })
  codeChallengeMethod?: string;

  @CreateDateColumn()
  createdAt!: Date;
}