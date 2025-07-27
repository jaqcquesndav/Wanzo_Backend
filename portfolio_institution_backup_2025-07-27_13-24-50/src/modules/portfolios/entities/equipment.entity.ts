import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Portfolio } from './portfolio.entity';

@Entity('equipment_catalog')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column('uuid')
  portfolioId!: string;

  @ManyToOne(() => Portfolio)
  @JoinColumn({ name: 'portfolioId' })
  portfolio!: Portfolio;

  @Column()
  name!: string;

  @Column()
  category!: string;

  @Column('decimal', { precision: 15, scale: 2 })
  price!: number;

  @Column('jsonb')
  specifications!: {
    dimensions?: string;
    power?: string;
    weight?: string;
    fuel?: string;
    [key: string]: any;
  };

  @Column()
  condition!: string;

  @Column({ default: false })
  maintenanceIncluded!: boolean;

  @Column({ default: false })
  insuranceRequired!: boolean;

  @Column()
  imageUrl!: string;

  @Column({ default: true })
  availability!: boolean;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}