import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Company } from './company.entity';

@Entity('contact_history')
export class ContactHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column('text')
  notes: string;

  @Column({ nullable: true })
  outcome: string;

  @Column({ nullable: true })
  nextSteps: string;

  @Column()
  createdBy: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;
}
