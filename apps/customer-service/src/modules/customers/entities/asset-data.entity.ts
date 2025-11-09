import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from './customer.entity';

/**
 * Entité AssetData - Gestion des actifs patrimoniaux des entreprises
 * Conforme à la documentation v2.1
 */
@Entity('company_assets')
export class AssetData {
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
    enum: ['immobilier', 'vehicule', 'equipement', 'autre']
  })
  type!: 'immobilier' | 'vehicule' | 'equipement' | 'autre';

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  prixAchat?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  valeurActuelle?: number;

  @Column({
    type: 'enum',
    enum: ['USD', 'CDF', 'EUR'],
    nullable: true
  })
  devise?: 'USD' | 'CDF' | 'EUR';

  @Column({ type: 'date', nullable: true })
  dateAcquisition?: Date;

  @Column({
    type: 'enum',
    enum: ['neuf', 'excellent', 'bon', 'moyen', 'mauvais', 'deteriore'],
    nullable: true
  })
  etatActuel?: 'neuf' | 'excellent' | 'bon' | 'moyen' | 'mauvais' | 'deteriore';

  @Column({ nullable: true })
  localisation?: string;

  @Column({ nullable: true })
  marque?: string;

  @Column({ nullable: true })
  modele?: string;

  @Column({ type: 'int', nullable: true })
  quantite?: number;

  @Column({ nullable: true })
  unite?: string;

  @Column({
    type: 'enum',
    enum: ['propre', 'location', 'leasing', 'emprunt'],
    nullable: true
  })
  proprietaire?: 'propre' | 'location' | 'leasing' | 'emprunt';

  @Column({ type: 'text', nullable: true })
  observations?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}