import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('currencies')
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column()
  code!: string;

  @Column()
  name!: string;

  @Column()
  symbol!: string;

  @Column({ default: false })
  isDefault!: boolean;

  @Column('decimal', { precision: 15, scale: 6 })
  exchangeRate!: number;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
