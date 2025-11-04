import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CreditRequest } from './credit-request.entity';

@Entity('credit_distributions')
export class CreditDistribution {
  @ApiProperty({ description: 'Unique identifier for the distribution' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Credit request ID' })
  @Column()
  creditRequestId: string;

  @ManyToOne(() => CreditRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creditRequestId' })
  creditRequest: CreditRequest;

  @ApiProperty({ description: 'Member ID for this distribution' })
  @Column()
  memberId: string;

  @ApiProperty({ description: 'Amount for this member' })
  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'Created date' })
  @CreateDateColumn()
  createdAt: Date;
}