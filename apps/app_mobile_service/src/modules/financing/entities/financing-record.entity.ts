import { User } from '../../auth/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: FinancingRecordType,
  })
  type: FinancingRecordType;

  @Column()
  sourceOrPurpose: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('timestamp with time zone')
  date: Date;

  @Column('text', { nullable: true })
  terms: string;

  @Column({
    type: 'enum',
    enum: FinancingRecordStatus,
    default: FinancingRecordStatus.PENDING,
  })
  status: FinancingRecordStatus;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Array of related documents, e.g., { name: string, url: string }[]',
  })
  relatedDocuments: RelatedDocument[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
