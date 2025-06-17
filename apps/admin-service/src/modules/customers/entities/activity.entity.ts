import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '@/modules/customers/entities/customer.entity';

@Entity('customer_activities')
export class CustomerActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @ManyToOne(() => Customer, customer => customer.activities)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  type: string;

  @Column({ nullable: true })
  action: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  performedBy: string;

  @Column({ nullable: true })
  performedByName: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column('jsonb', { nullable: true })
  details: Record<string, unknown>;
}
