import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Expense } from './expense.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('expense_categories')
export class ExpenseCategory {
  @ApiProperty({
    description: 'Identifiant unique de la catégorie de dépense',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nom de la catégorie',
    example: 'Fournitures de bureau'
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Description de la catégorie',
    example: 'Dépenses liées aux fournitures et matériel de bureau',
    nullable: true
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Identifiant de l\'entreprise',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    format: 'uuid'
  })
  @Column()
  companyId: string;
  @ApiProperty({
    description: 'Relation avec l\'entreprise',
    type: () => Company
  })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' }) // Each category belongs to a company
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ApiProperty({
    description: 'Dépenses associées à cette catégorie',
    type: [Expense]
  })
  @OneToMany(() => Expense, expense => expense.category)
  expenses: Expense[];

  @ApiProperty({
    description: 'Date de création',
    example: '2025-06-04T12:00:00Z',
    type: 'string',
    format: 'date-time'
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2025-06-04T14:30:00Z',
    type: 'string',
    format: 'date-time'
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
