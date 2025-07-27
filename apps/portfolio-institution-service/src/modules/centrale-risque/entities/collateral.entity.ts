import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('collaterals')
export class Collateral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 36 })
  @Index()
  companyId: string;

  @Column({ length: 255 })
  companyName: string;

  @Column({ length: 255 })
  collateralType: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  value: number;

  @Column({ type: 'timestamp', nullable: true })
  valuationDate: Date;

  @Column({ length: 255, nullable: true })
  valuationMethod: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({ length: 36, nullable: true })
  institutionId: string;

  @Column({ length: 255 })
  institution: string;

  @Column({ length: 50 })
  status: string;

  @Column({ length: 36, nullable: true })
  createdBy: string;

  @Column({ length: 36, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
