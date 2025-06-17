import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Customer } from '@/modules/customers/entities/customer.entity';

export enum PmeSize {
  MICRO = 'micro',
  SMALL = 'small',
  MEDIUM = 'medium',
}

@Entity('customer_pme_specific_data')
export class PmeSpecificData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @OneToOne(() => Customer, customer => customer.pmeData)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  industry: string;

  @Column({
    type: 'enum',
    enum: PmeSize,
  })
  size: PmeSize;

  @Column()
  employeesCount: number;

  @Column({ nullable: true })
  yearFounded: number;

  @Column({ nullable: true })
  registrationNumber: string;

  @Column({ nullable: true })
  taxId: string;

  @Column({ nullable: true })
  businessLicense: string;
}
