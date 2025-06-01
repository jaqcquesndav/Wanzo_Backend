import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('company')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  registrationNumber: string;

  @Column({ nullable: true })
  taxId: string;

  @Column('simple-json', { nullable: true })
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ type: 'date', nullable: true })
  foundedDate: Date;

  @Column('text', { nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
