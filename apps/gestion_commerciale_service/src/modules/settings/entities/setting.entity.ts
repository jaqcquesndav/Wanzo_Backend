import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum SettingCategory {
  GENERAL = 'general',           // Paramètres généraux de l'application
  SECURITY = 'security',         // Paramètres de sécurité
  NOTIFICATIONS = 'notifications', // Préférences de notifications
  INVOICE = 'invoice',           // Paramètres de facturation
  INVENTORY = 'inventory',       // Paramètres de gestion des stocks
  CUSTOMER = 'customer',         // Paramètres liés aux clients
  SALES = 'sales',               // Paramètres de vente
  TAXES = 'taxes',               // Paramètres de taxes
  SYSTEM = 'system',             // Paramètres système
  CUSTOM = 'custom'              // Paramètres personnalisés
}

@Entity('settings')
export class Setting {
  @ApiProperty({
    description: 'Identifiant unique du paramètre',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Clé du paramètre',
    example: 'invoice_prefix'
  })
  @Column()
  key: string;

  @ApiProperty({
    description: 'Catégorie du paramètre',
    enum: SettingCategory,
    example: SettingCategory.INVOICE
  })
  @Column({
    type: 'enum',
    enum: SettingCategory,
    default: SettingCategory.GENERAL
  })
  category: SettingCategory;

  @ApiProperty({
    description: 'Valeur du paramètre (stockée en JSON)',
    example: { prefix: 'FACT-', startNumber: 1000 }
  })
  @Column('jsonb')
  value: any;

  @ApiProperty({
    description: 'Description du paramètre',
    example: 'Préfixe et numéro de départ pour les factures',
    required: false
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Indique si le paramètre est visible publiquement',
    example: true,
    default: true
  })
  @Column({ default: true })
  isPublic: boolean;

  @ApiProperty({
    description: 'Indique si le paramètre est réservé au système',
    example: false,
    default: false
  })
  @Column({ default: false })
  isSystem: boolean;

  @ApiProperty({
    description: 'ID de l\'entreprise associée au paramètre',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  @Column({ nullable: true })
  companyId?: string;

  @ApiProperty({
    description: 'ID de l\'utilisateur qui a créé le paramètre',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  @Column({ nullable: true })
  createdBy?: string;

  @ApiProperty({
    description: 'Date de création du paramètre',
    example: '2023-01-01T12:00:00Z'
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour du paramètre',
    example: '2023-01-01T12:00:00Z'
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
