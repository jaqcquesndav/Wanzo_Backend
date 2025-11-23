import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Entité BusinessCustomer - Représente un client commercial géré par une entreprise (client de la plateforme)
 * À ne pas confondre avec l'entité Customer du customer-service qui représente un client de la plateforme
 */
@Entity('business_customers')
export class BusinessCustomer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'jsonb', nullable: true })
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  contactPerson: {
    name?: string;
    position?: string;
    email?: string;
    phone?: string;
  };

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  creditLimit: number;

  @Column({ nullable: true })
  taxId: string;

  @Column({ type: 'enum', enum: ['individual', 'company', 'government', 'non_profit'], default: 'individual' })
  customerType: string | 'government' | 'non_profit';

  @Column({ type: 'enum', enum: ['active', 'inactive', 'prospect', 'former'], default: 'active' })
  status: string | 'prospect' | 'former';

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  industry: string;

  // Ce champ identifie l'entreprise (unité commerciale) qui gère ce client
  // C'est l'équivalent du companyId dans d'autres contextes
  @Column()
  businessUnitId: string;

  // Ce champ identifie le client de la plateforme qui possède cette unité commerciale
  // Utile pour les statistiques et les permissions
  @Column()
  platformClientId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdById: string;

  @Column({ nullable: true })
  updatedById: string;

  // Relations: pourraient être ajoutées avec des OneToMany vers transactions, factures, etc.
}
