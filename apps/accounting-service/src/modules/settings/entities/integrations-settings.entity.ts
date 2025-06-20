import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class IntegrationsSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  companyId!: string;

  @Column('jsonb', { default: { enabled: false, linkedAccount: null } })
  googleDrive!: object;

  @Column('jsonb', { default: { enabled: false, apiKey: null } })
  ksPay!: object;

  @Column('jsonb', { default: { enabled: false, webhookUrl: null } })
  slack!: object;
}
