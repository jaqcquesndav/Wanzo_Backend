import { User } from '../../auth/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum FinancingRecordType {
  LOAN = 'loan',
  INVESTMENT = 'investment',
  GRANT = 'grant',
  EQUITY = 'equity',
}

export enum FinancingRecordStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REPAID = 'repaid',
  CLOSED = 'closed',
  DEFAULTED = 'defaulted',
}

interface RelatedDocument {
  name: string;
  url: string;
}

@Entity('financing_records')
export class FinancingRecord {
  @ApiProperty({ description: 'Unique identifier (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID of the user who owns this financing record' })
  @Column()
  userId: string;

  @ApiProperty({ description: 'User who owns this financing record', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ 
    description: 'Type of financing', 
    enum: FinancingRecordType,
    example: FinancingRecordType.LOAN
  })
  @Column({
    type: 'enum',
    enum: FinancingRecordType,
  })
  type: FinancingRecordType;

  @ApiProperty({ description: 'Source or purpose of the financing', example: 'Bank X Loan' })
  @Column()
  sourceOrPurpose: string;

  @ApiProperty({ description: 'Amount of financing', example: 50000 })
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'Date of the financing record', example: '2025-07-15T10:00:00.000Z' })  @ApiProperty({ description: 'Date of the financing record', example: '2025-07-15T10:00:00.000Z' })
  @Column('timestamp with time zone')
  date: Date;

  @ApiProperty({ description: 'Terms of the financing (e.g., interest rate, repayment schedule)', example: '5% interest, 36 months repayment', required: false })
  @Column('text', { nullable: true })
  terms: string;

  @ApiProperty({ 
    description: 'Status of the financing record',
    enum: FinancingRecordStatus,
    example: FinancingRecordStatus.ACTIVE,
    default: FinancingRecordStatus.PENDING
  })
  @Column({
    type: 'enum',
    enum: FinancingRecordStatus,
    default: FinancingRecordStatus.PENDING,
  })
  status: FinancingRecordStatus;

  @ApiProperty({ 
    description: 'Related documents (e.g., contracts, agreements)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Loan Agreement' },
        url: { type: 'string', example: 'https://example.com/loan_agreement.pdf' }
      }
    },
    required: false
  })
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Array of related documents, e.g., { name: string, url: string }[]',
  })
  relatedDocuments: RelatedDocument[];

  @ApiProperty({ description: 'Date when the record was created', example: '2025-06-01T10:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date when the record was last updated', example: '2025-06-01T10:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
