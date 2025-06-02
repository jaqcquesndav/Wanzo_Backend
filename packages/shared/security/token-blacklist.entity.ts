import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('token_blacklist')
export class TokenBlacklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  jti: string; // JWT ID

  @Column({ type: 'timestamp with time zone' })
  @Index()
  expiresAt: Date;

  @Column({ nullable: true })
  reason?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
