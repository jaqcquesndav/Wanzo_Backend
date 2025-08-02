import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  userId!: string;

  @Column({ default: 'fr' })
  language!: string;

  @Column({ default: 'DD/MM/YYYY' })
  dateFormat!: string;

  @Column({ default: 'Africa/Kinshasa' })
  timezone!: string;

  @Column({ default: 'light' })
  theme!: string;

  @Column({ default: 'CDF' })
  baseCurrency!: string;

  @Column({ default: 'CDF' })
  displayCurrency!: string;

  @Column('jsonb', { default: {} })
  exchangeRates!: object;

  @Column({ default: false })
  twoFactorEnabled!: boolean;

  @Column('jsonb', { default: { minLength: 8, requireUppercase: true, requireNumbers: true, requireSymbols: false } })
  passwordPolicy!: object;

  @Column({ default: 30 })
  sessionTimeout!: number; // in minutes

  @Column('jsonb', { default: { journal_validation: { email: true, browser: true }, report_generation: { email: false, browser: true }, user_mention: { email: true, browser: true } } })
  notifications!: object;
}
