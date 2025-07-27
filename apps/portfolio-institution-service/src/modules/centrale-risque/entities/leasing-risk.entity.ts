import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('leasing_risks')
export class LeasingRisk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 36 })
  @Index()
  companyId: string;

  @Column({ length: 255 })
  companyName: string;

  @Column({ length: 100 })
  sector: string;

  @Column({ length: 255 })
  institution: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  leasingAmount: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  outstandingAmount: number;

  @Column({ length: 50 })
  status: string;

  @Column({ type: 'int' })
  incidents: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  leasingRate: number;

  @Column({ length: 36, nullable: true })
  institutionId: string;

  @Column({ length: 255, nullable: true })
  assetDescription: string;

  @Column({ length: 36, nullable: true })
  createdBy: string;

  @Column({ length: 36, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdated: Date;
}
