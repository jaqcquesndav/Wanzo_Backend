import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Prospect } from './prospect.entity';

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

  @ManyToOne(() => Prospect, (prospect: any) => prospect.contactHistory)
  @JoinColumn({ name: 'prospectId' })
  prospect: Prospect;

  @Column()
  prospectId: string;

  @CreateDateColumn()
  createdAt: Date;
}
