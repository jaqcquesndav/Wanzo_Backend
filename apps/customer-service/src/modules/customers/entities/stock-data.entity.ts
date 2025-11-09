import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from './customer.entity';

/**
 * Entité StockData - Gestion des stocks et inventaires des entreprises
 * Conforme à la documentation v2.1
 */
@Entity('company_stocks')
export class StockData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column()
  customerId!: string;

  @Column()
  designation!: string;

  @Column({
    type: 'enum',
    enum: ['matiere_premiere', 'produit_semi_fini', 'produit_fini', 'fourniture', 'emballage', 'autre']
  })
  categorie!: 'matiere_premiere' | 'produit_semi_fini' | 'produit_fini' | 'fourniture' | 'emballage' | 'autre';

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantiteStock!: number;

  @Column()
  unite!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  seuilMinimum?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  seuilMaximum?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  coutUnitaire!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  valeurTotaleStock!: number;

  @Column({
    type: 'enum',
    enum: ['USD', 'CDF', 'EUR']
  })
  devise!: 'USD' | 'CDF' | 'EUR';

  @Column({ type: 'date', nullable: true })
  dateDernierInventaire?: Date;

  @Column({ type: 'int', nullable: true })
  dureeRotationMoyenne?: number;

  @Column({ type: 'date', nullable: true })
  datePeremption?: Date;

  @Column({ nullable: true })
  emplacement?: string;

  @Column({ nullable: true })
  conditionsStockage?: string;

  @Column({ nullable: true })
  fournisseurPrincipal?: string;

  @Column({ nullable: true })
  numeroLot?: string;

  @Column({ nullable: true })
  codeArticle?: string;

  @Column({
    type: 'enum',
    enum: ['excellent', 'bon', 'moyen', 'deteriore', 'perime']
  })
  etatStock!: 'excellent' | 'bon' | 'moyen' | 'deteriore' | 'perime';

  @Column({ type: 'text', nullable: true })
  observations?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}