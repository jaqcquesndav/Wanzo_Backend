import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('webhooks')
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  event!: string;

  @Column()
  url!: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ nullable: true, select: false })
  secret?: string;

  @Column({ type: 'jsonb', nullable: true })
  lastResponse?: {
    statusCode: number;
    response: string;
    latency: number;
    timestamp: Date;
  };

  @Column({ nullable: true })
  institutionId?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
