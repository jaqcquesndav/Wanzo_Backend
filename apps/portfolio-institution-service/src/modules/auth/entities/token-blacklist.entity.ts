import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('token_blacklist')
export class TokenBlacklist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  tokenId!: string;

  @Column()
  userId!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ nullable: true })
  reason?: string;

  @CreateDateColumn()
  blacklistedAt!: Date;
}