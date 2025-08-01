import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AccountingMode } from '../../organization/entities/organization.entity';

export enum JournalEntryValidation {
  AUTO = 'auto',
  MANUAL = 'manual',
}

export enum DepreciationMethod {
  LINEAR = 'linear',
  DEGRESSIVE = 'degressive',
}

@Entity('accounting_settings')
export class AccountingSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column({
    type: 'enum',
    enum: AccountingMode,
    default: AccountingMode.SYSCOHADA
  })
  accountingMode!: AccountingMode;

  @Column({ default: 'CDF' })
  defaultCurrency!: string;

  @Column({
    type: 'enum',
    enum: DepreciationMethod,
    default: DepreciationMethod.LINEAR
  })
  defaultDepreciationMethod!: DepreciationMethod;

  @Column({ default: '18' })
  defaultVatRate!: string;

  @Column({
    type: 'enum',
    enum: JournalEntryValidation,
    default: JournalEntryValidation.AUTO
  })
  journalEntryValidation!: JournalEntryValidation;

  @Column({ default: 'OD' })
  defaultJournal!: string;

  @Column({ default: true })
  autoNumbering!: boolean;

  @Column({ default: 'VCH-' })
  voucherPrefix!: string;

  @Column({ default: 'YYYY' })
  fiscalYearPattern!: string;

  @Column({ default: 'OHADA' })
  accountingFramework!: string;

  @Column('jsonb', {
    nullable: true,
    default: [
        { level: 1, name: 'Classe', digits: 1 },
        { level: 2, name: 'Compte Principal', digits: 2 },
        { level: 3, name: 'Compte Divisionnaire', digits: 3 },
        { level: 4, name: 'Sous-compte', digits: 5 }
    ]
  })
  accountingLevels!: object[];

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
