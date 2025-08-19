import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('token_blacklist')
export class TokenBlacklist {
  @PrimaryGeneratedColumn('uuid')
  id!: string; // Added definite assignment assertion

  @Column()
  @Index()
  userId!: string; // Added definite assignment assertion

  @Column()
  @Index()
  jti!: string; // JWT ID - Added definite assignment assertion

  @Column({ type: 'timestamp with time zone' })
  @Index()
  expiresAt!: Date; // Added definite assignment assertion

  @Column({ nullable: true })
  reason?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date; // Added definite assignment assertion
}
