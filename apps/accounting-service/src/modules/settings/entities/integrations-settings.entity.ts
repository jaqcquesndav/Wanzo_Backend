import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { EncryptedJsonTransformer } from '../../../security/encrypted-transformers';

// Interface types for better type safety
export interface DataSharingSettings {
  banks: boolean;
  microfinance: boolean;
  coopec: boolean;
  analysts: boolean;
  partners: boolean;
  consentGiven: boolean;
  consentDate: string | null;
  lastModified: string | null;
  modifiedBy: string | null;
}

export interface BankIntegrationSettings {
  enabled: boolean;
  provider: string | null;
  syncFrequency: string;
  accountMappings: any[];
  lastSyncDate: string | null;
}

export interface EInvoicingSettings {
  dgi_congo: {
    enabled: boolean;
    apiKey: string | null;
    environment: string;
  };
}

export interface TaxIntegrationSettings {
  enabled: boolean;
  autoSync: boolean;
  taxRates: Record<string, number>;
}

export interface PortfolioIntegrationSettings {
  enabled: boolean;
  syncFrequency: string;
  lastSyncDate: string | null;
}

@Entity()
export class IntegrationsSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  companyId!: string;

  @Column('jsonb', { 
    default: { enabled: false, linkedAccount: null },
    transformer: new EncryptedJsonTransformer()
  })
  googleDrive!: object;

  @Column('jsonb', { 
    default: { enabled: false, apiKey: null },
    transformer: new EncryptedJsonTransformer()
  })
  ksPay!: object;

  @Column('jsonb', { 
    default: { enabled: false, webhookUrl: null },
    transformer: new EncryptedJsonTransformer()
  })
  slack!: object;

  // New integrations from documentation
  @Column('jsonb', { 
    default: { 
      banks: false, 
      microfinance: false, 
      coopec: false, 
      analysts: false, 
      partners: false, 
      consentGiven: false, 
      consentDate: null, 
      lastModified: null, 
      modifiedBy: null 
    } 
  })
  dataSharing!: DataSharingSettings;

  @Column('jsonb', { 
    default: { 
      enabled: false, 
      provider: null, 
      syncFrequency: 'daily', 
      accountMappings: [], 
      lastSyncDate: null 
    } 
  })
  bankIntegrations!: BankIntegrationSettings;

  @Column('jsonb', { 
    default: { 
      dgi_congo: { 
        enabled: false, 
        apiKey: null, 
        environment: 'test' 
      } 
    } 
  })
  eInvoicing!: EInvoicingSettings;

  @Column('jsonb', { 
    default: { 
      enabled: false, 
      autoSync: false, 
      taxRates: {} 
    } 
  })
  taxIntegration!: TaxIntegrationSettings;

  @Column('jsonb', { 
    default: { 
      enabled: false, 
      syncFrequency: 'daily', 
      lastSyncDate: null 
    } 
  })
  portfolioIntegration!: PortfolioIntegrationSettings;
}
