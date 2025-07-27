import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('risk_entries')
export class RiskEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 36 })
  @Index()
  companyId: string;

  @Column({ length: 255 })
  companyName: string;

  @Column({ length: 50 })
  riskType: string;

  @Column({ length: 255 })
  description: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  riskScore: number;

  @Column({ length: 50 })
  category: string;

  @Column({ length: 50 })
  status: string;

  @Column({ length: 36, nullable: true })
  institutionId: string;

  @Column({ length: 255, nullable: true })
  institution: string;

  @Column({ length: 36, nullable: true })
  createdBy: string;

  @Column({ length: 36, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  reportDate: Date;
}
