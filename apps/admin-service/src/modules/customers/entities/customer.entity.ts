import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

export enum CustomerType {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate'
}

export enum CustomerStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CustomerType,
    default: CustomerType.INDIVIDUAL
  })
  type: CustomerType;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  registrationNumber: string;

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.PENDING
  })
  status: CustomerStatus;

  @Column('simple-json', { nullable: true })
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  taxId: string;

  @Column({ default: false })
  isOnboarded: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  phoneVerified: boolean;

  @OneToMany(() => CustomerDocument, document => document.customer)
  documents: CustomerDocument[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum DocumentType {
  IDENTITY = 'identity',
  ADDRESS = 'address',
  BUSINESS_REGISTRATION = 'business_registration',
  COMPANY_PROFILE = 'company_profile',
  TAX_CERTIFICATE = 'tax_certificate',
  OTHER = 'other'
}

export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

@Entity('customer_documents')
export class CustomerDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @ManyToOne(() => Customer, customer => customer.documents)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({
    type: 'enum',
    enum: DocumentType
  })
  type: DocumentType;

  @Column()
  name: string;

  @Column()
  fileUrl: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING
  })
  status: DocumentStatus;

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  expiryDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
