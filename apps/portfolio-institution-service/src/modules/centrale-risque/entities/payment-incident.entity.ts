import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('payment_incidents')
export class PaymentIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 36 })
  @Index()
  companyId: string;

  @Column({ length: 255 })
  companyName: string;

  @Column({ type: 'timestamp' })
  incidentDate: Date;

  @Column({ length: 255 })
  incidentType: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount: number;

  @Column({ length: 255 })
  institution: string;

  @Column({ length: 36, nullable: true })
  institutionId: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({ length: 50 })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  resolutionDate: Date;

  @Column({ length: 36, nullable: true })
  createdBy: string;

  @Column({ length: 36, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
