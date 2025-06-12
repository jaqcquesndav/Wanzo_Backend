import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Enum to define possible data sharing preferences keys
export enum DataSharingPreferenceKey {
  ALLOW_MOBILE_DATA_FOR_AI = 'allowMobileDataForAI',
  ALLOW_CHAT_DATA_FOR_AI = 'allowChatDataForAI',
  // Add other specific preferences as needed
}

// Interface for the structure of dataSharingPreferences
export interface CompanyDataSharingPreferences {
  [DataSharingPreferenceKey.ALLOW_MOBILE_DATA_FOR_AI]?: boolean;
  [DataSharingPreferenceKey.ALLOW_CHAT_DATA_FOR_AI]?: boolean;
  // Define types for other preferences
}

@Entity('companies') // Database table name will be 'companies'
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, nullable: false })
  name!: string;

  // Store preferences as JSONB for flexibility
  @Column('jsonb', { nullable: true, default: {} })
  dataSharingPreferences!: CompanyDataSharingPreferences;

  @Column({ nullable: true })
  currentFiscalYear!: string;

  // For accountingStandard, and other company-specific settings
  @Column('jsonb', { nullable: true, default: {} })
  metadata!: Record<string, any>; 

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
