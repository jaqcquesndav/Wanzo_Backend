import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('credit_score_history')
export class CreditScoreHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 36 })
  @Index()
  companyId: string;

  @Column({ length: 255 })
  companyName: string;

  @Column({ type: 'int' })
  scoreValue: number;

  @Column({ type: 'timestamp' })
  scoreDate: Date;

  @Column({ length: 36, nullable: true })
  institutionId: string;

  @Column({ length: 255, nullable: true })
  institution: string;

  @Column({ length: 500, nullable: true })
  scoreDetails: string;

  @Column({ length: 5, nullable: true })
  coteCredit: string;

  @Column({ length: 36, nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
