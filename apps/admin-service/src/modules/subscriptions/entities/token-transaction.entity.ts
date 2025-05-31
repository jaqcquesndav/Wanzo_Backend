import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Subscription } from './subscription.entity';

@Entity('token_transactions')
export class TokenTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companyId!: string; // ID de l'entreprise associée à la transaction

  @ManyToOne(() => Subscription, (subscription) => subscription.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription!: Subscription; // Relation avec l'abonnement

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number; // Montant des jetons utilisés ou ajoutés

  @Column({ type: 'enum', enum: ['use', 'add'], default: 'use' })
  type!: 'use' | 'add'; // Type de transaction : utilisation ou ajout

  @Column({ nullable: true })
  description?: string; // Description de la transaction

  @CreateDateColumn()
  createdAt!: Date; // Date de création de la transaction
}