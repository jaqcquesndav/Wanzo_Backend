/**
 * Entité Financial Transaction mise à jour avec conformité complète aux standards internationaux
 * ISO 20022, ISO 4217, BIC/SWIFT, LEI, FATF/GAFI
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EncryptedJsonTransformer, EncryptedColumnTransformer } from '../security/encrypted-transformers';
import { ISO4217CurrencyCode } from '../standards/iso-standards';
import { FinancialStandardsService } from '../services/financial-standards.service';

// Re-export for convenience
export { ISO4217CurrencyCode } from '../standards/iso-standards';

// Types de transaction conforme ISO 20022
export enum ISO20022TransactionType {
  // Paiements
  PAYMENT = 'PMNT',           // Paiement générique
  CREDIT_TRANSFER = 'CDTR',   // Virement créditeur
  DIRECT_DEBIT = 'DDBT',      // Prélèvement
  
  // Commerce international
  TRADE_FINANCE = 'TRAD',     // Financement commercial
  LETTER_OF_CREDIT = 'CRLC',  // Lettre de crédit
  DOCUMENTARY_COLLECTION = 'DCOL', // Encaissement documentaire
  
  // Services financiers
  SECURITIES = 'SECR',        // Opérations sur titres
  FOREIGN_EXCHANGE = 'FORX',  // Change
  DERIVATIVES = 'DERV',       // Produits dérivés
  
  // Autres
  CASH_MANAGEMENT = 'CASH',   // Gestion de trésorerie
  LOAN = 'LOAN',             // Prêt
  GUARANTEE = 'GUAR',        // Garantie
  OTHER = 'OTHR'             // Autre
}

// Méthodes de paiement conformes aux standards
export enum ISO20022PaymentMethod {
  // Virements
  CREDIT_TRANSFER = 'TRF',         // Virement
  INSTANT_PAYMENT = 'INP',         // Paiement instantané
  
  // Instruments de paiement
  CHECK = 'CHK',                   // Chèque
  PROMISSORY_NOTE = 'PNT',         // Billet à ordre
  BILL_OF_EXCHANGE = 'BOE',        // Lettre de change
  
  // Paiements électroniques
  CARD_PAYMENT = 'CRD',            // Paiement par carte
  DIRECT_DEBIT = 'DD',             // Prélèvement automatique
  MOBILE_PAYMENT = 'MOB',          // Paiement mobile
  
  // Espèces et autres
  CASH = 'CSH',                    // Espèces
  CLEARING = 'CLR',                // Compensation
  OTHER = 'OTH'                    // Autre méthode
}

// Statut conforme au cycle de vie des paiements
export enum ISO20022TransactionStatus {
  // États initiaux
  RECEIVED = 'RCVD',              // Reçu
  PENDING = 'PDNG',               // En attente
  ACCEPTED = 'ACCP',              // Accepté
  
  // États de traitement  
  PROCESSING = 'PROC',            // En cours de traitement
  SETTLEMENT_IN_PROCESS = 'STLM', // En cours de règlement
  
  // États finaux - Succès
  SETTLED = 'STLD',               // Réglé avec succès
  COMPLETED = 'COMP',             // Complété
  
  // États finaux - Échec
  REJECTED = 'RJCT',              // Rejeté
  CANCELLED = 'CANC',             // Annulé
  FAILED = 'FAIL',                // Échoué
  
  // États de gestion des erreurs
  SUSPENDED = 'SUSP',             // Suspendu
  REVERSED = 'REVR',              // Contrepassé
  RETURNED = 'RTND'               // Retourné
}

// Codes de raison pour rejets/retours (ISO 20022)
export enum ISO20022ReasonCode {
  // Raisons techniques
  INVALID_ACCOUNT = 'AC01',        // Numéro de compte invalide
  INVALID_BANK_CODE = 'AC04',      // Code banque invalide
  INSUFFICIENT_FUNDS = 'CA01',     // Provision insuffisante
  
  // Raisons réglementaires  
  REGULATORY_REASON = 'RR01',      // Raison réglementaire
  SANCTIONS_CHECK = 'RR02',        // Contrôle sanctions
  AML_CHECK = 'RR03',              // Contrôle LCB-FT
  
  // Raisons opérationnelles
  DUPLICATE_PAYMENT = 'DUPL',      // Paiement en double
  TIMEOUT = 'TIMR',                // Timeout
  TECHNICAL_ERROR = 'BE01',        // Erreur technique
  
  // Autres
  OTHER = 'MISC'                   // Autre raison
}

@Entity('iso_compliant_financial_transactions')
@Index(['companyId'])
@Index(['transactionDate'])
@Index(['transactionType'])
@Index(['status'])
@Index(['endToEndReference']) // Index pour recherche ISO 20022
@Index(['instructionReference'])
@Index(['messageReference'])
export class ISO20022FinancialTransaction {
  
  @ApiProperty({
    description: 'Identifiant unique de la transaction (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // === IDENTIFIANTS ISO 20022 ===
  
  @ApiProperty({
    description: 'Référence de bout en bout (End-to-End Reference) - Obligatoire ISO 20022',
    example: '20241110-WNZO-PMNT-000123-A1B2'
  })
  @Column({ unique: true })
  endToEndReference!: string;

  @ApiProperty({
    description: 'Référence d\'instruction - Identifiant unique du donneur d\'ordre',
    example: 'INST-20241110-123456'
  })
  @Column({ unique: true })
  instructionReference!: string;

  @ApiProperty({
    description: 'Référence du message - Identifiant du message ISO 20022',
    example: 'MSG-20241110-789012'
  })
  @Column({ nullable: true })
  messageReference?: string;

  @ApiProperty({
    description: 'Identifiant de transaction UETR (Unique End-to-end Transaction Reference)',
    example: 'b4f4c8e1-7a2d-4b9f-8c3e-1234567890ab'
  })
  @Column({ nullable: true, unique: true })
  uetrReference?: string;

  // === INFORMATIONS DE BASE ===

  @ApiProperty({
    description: 'Type de transaction selon ISO 20022',
    enum: ISO20022TransactionType,
    example: ISO20022TransactionType.PAYMENT
  })
  @Column({
    type: 'enum',
    enum: ISO20022TransactionType
  })
  transactionType!: ISO20022TransactionType;

  @ApiProperty({
    description: 'Montant de la transaction avec précision décimale',
    example: 1500.75
  })
  @Column('decimal', { precision: 20, scale: 4 }) // Précision étendue pour devises mineures
  amount!: number;

  @ApiProperty({
    description: 'Code devise ISO 4217',
    enum: ISO4217CurrencyCode,
    example: ISO4217CurrencyCode.CDF
  })
  @Column({
    type: 'enum',
    enum: ISO4217CurrencyCode
  })
  currency!: ISO4217CurrencyCode;

  @ApiProperty({
    description: 'Date et heure de la transaction (ISO 8601)',
    example: '2024-11-10T15:30:00.000Z'
  })
  @Column('timestamp with time zone')
  transactionDate!: Date;

  @ApiProperty({
    description: 'Date de valeur demandée',
    example: '2024-11-11T00:00:00.000Z'
  })
  @Column('date', { nullable: true })
  requestedValueDate?: Date;

  @ApiProperty({
    description: 'Date de valeur effective',
    example: '2024-11-11T00:00:00.000Z'
  })
  @Column('date', { nullable: true })
  actualValueDate?: Date;

  // === PARTIES IMPLIQUÉES ===

  @ApiProperty({
    description: 'Identifiant de l\'entreprise donneuse d\'ordre',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @Column()
  companyId!: string;

  @ApiProperty({
    description: 'Informations du débiteur (donneur d\'ordre)',
    example: {
      name: 'Entreprise ABC SARL',
      identification: { lei: '254900ABCDEFGHIJKL12', other: [] },
      account: { iban: 'CD1234567890123456789012', other: { identification: 'ACC123456' } },
      agent: { bic: 'BCCDCDKI', name: 'Banque Commerciale du Congo' }
    }
  })
  @Column('jsonb', { 
    transformer: new EncryptedJsonTransformer()
  })
  debtor!: {
    name: string;
    identification?: {
      lei?: string; // Legal Entity Identifier
      other?: Array<{
        identification: string;
        schemeName?: string;
      }>;
    };
    account: {
      iban?: string;
      other?: {
        identification: string;
        schemeName?: string;
      };
    };
    agent?: {
      bic?: string; // Code BIC/SWIFT
      name?: string;
      clearingSystemMemberId?: string;
    };
  };

  @ApiProperty({
    description: 'Informations du créditeur (bénéficiaire)',
    example: {
      name: 'Fournisseur XYZ SPRL',
      identification: { lei: '254900XYZABCDEFGHIJ34' },
      account: { iban: 'CD9876543210987654321098' },
      agent: { bic: 'RAWBCDKI', name: 'Rawbank' }
    }
  })
  @Column('jsonb', { 
    transformer: new EncryptedJsonTransformer()
  })
  creditor!: {
    name: string;
    identification?: {
      lei?: string;
      other?: Array<{
        identification: string;
        schemeName?: string;
      }>;
    };
    account: {
      iban?: string;
      other?: {
        identification: string;
        schemeName?: string;
      };
    };
    agent?: {
      bic?: string;
      name?: string;
      clearingSystemMemberId?: string;
    };
  };

  // === DÉTAILS DE PAIEMENT ===

  @ApiProperty({
    description: 'Méthode de paiement selon ISO 20022',
    enum: ISO20022PaymentMethod,
    example: ISO20022PaymentMethod.CREDIT_TRANSFER
  })
  @Column({
    type: 'enum',
    enum: ISO20022PaymentMethod,
    nullable: true
  })
  paymentMethod?: ISO20022PaymentMethod;

  @ApiProperty({
    description: 'Code de catégorie d\'opération (ISO 20022 Purpose Code)',
    example: 'SUPP' // Supplier payment
  })
  @Column({ nullable: true })
  categoryPurposeCode?: string;

  @ApiProperty({
    description: 'Informations de remise (référence facture, etc.)',
    example: {
      unstructured: ['Paiement facture FACT-2024-001'],
      structured: {
        referredDocumentInformation: {
          type: 'CINV', // Commercial Invoice
          number: 'FACT-2024-001',
          relatedDate: '2024-11-01'
        }
      }
    }
  })
  @Column('jsonb', { nullable: true })
  remittanceInformation?: {
    unstructured?: string[];
    structured?: {
      referredDocumentInformation?: {
        type: string;
        number: string;
        relatedDate?: string;
      };
      creditorReferenceInformation?: {
        reference: string;
        type?: string;
      };
    };
  };

  // === STATUT ET SUIVI ===

  @ApiProperty({
    description: 'Statut de la transaction selon ISO 20022',
    enum: ISO20022TransactionStatus,
    example: ISO20022TransactionStatus.COMPLETED
  })
  @Column({
    type: 'enum',
    enum: ISO20022TransactionStatus,
    default: ISO20022TransactionStatus.RECEIVED
  })
  status!: ISO20022TransactionStatus;

  @ApiProperty({
    description: 'Code de raison en cas de rejet/retour',
    enum: ISO20022ReasonCode,
    example: ISO20022ReasonCode.INSUFFICIENT_FUNDS
  })
  @Column({
    type: 'enum',
    enum: ISO20022ReasonCode,
    nullable: true
  })
  reasonCode?: ISO20022ReasonCode;

  @ApiProperty({
    description: 'Informations détaillées sur le statut',
    example: {
      statusChangeDate: '2024-11-10T16:45:00.000Z',
      statusReason: 'Transaction processed successfully',
      additionalInformation: 'Processed through SWIFT network'
    }
  })
  @Column('jsonb', { nullable: true })
  statusInformation?: {
    statusChangeDate?: string;
    statusReason?: string;
    additionalInformation?: string;
  };

  // === CONFORMITÉ ET CONTRÔLES ===

  @ApiProperty({
    description: 'Résultats des contrôles AML/CFT',
    example: {
      amlCheckPassed: true,
      sanctionsCheckPassed: true,
      riskLevel: 'LOW',
      checkDate: '2024-11-10T15:30:00.000Z'
    }
  })
  @Column('jsonb', { 
    transformer: new EncryptedJsonTransformer()
  })
  complianceChecks!: {
    amlCheckPassed: boolean;
    sanctionsCheckPassed: boolean;
    pepCheckPassed?: boolean;
    riskLevel: string;
    checkDate: string;
    checkReference?: string;
    reviewRequired?: boolean;
  };

  @ApiProperty({
    description: 'Déclarations réglementaires requises',
    example: {
      ctrRequired: false,
      strRequired: false,
      filingReferences: []
    }
  })
  @Column('jsonb', { nullable: true })
  regulatoryReporting?: {
    ctrRequired: boolean;    // Currency Transaction Report
    strRequired: boolean;    // Suspicious Transaction Report
    filingReferences: string[];
    reportingJurisdiction?: string;
    reportingThreshold?: number;
  };

  // === MÉTADONNÉES TECHNIQUES ===

  @ApiProperty({
    description: 'Informations sur le traitement technique',
    example: {
      processingNetwork: 'SWIFT',
      networkReference: 'FIN.103.20241110.123456',
      routingPath: ['BCCDCDKI', 'RAWBCDKI'],
      processingTime: 1250
    }
  })
  @Column('jsonb', { nullable: true })
  processingInformation?: {
    processingNetwork?: string;
    networkReference?: string;
    routingPath?: string[];
    processingTime?: number; // en millisecondes
    confirmationReceived?: boolean;
    confirmationReference?: string;
  };

  @ApiProperty({
    description: 'Données supplémentaires (ISO 20022 Supplementary Data)',
    example: {
      riskAnalysis: { score: 25, factors: ['geographic', 'customer'] },
      businessContext: { contractReference: 'CONT-2024-001' }
    }
  })
  @Column('jsonb', { 
    transformer: new EncryptedJsonTransformer(),
    nullable: true 
  })
  supplementaryData?: Record<string, any>;

  // === GESTION DES CHANGES ===

  @ApiProperty({
    description: 'Taux de change appliqué si conversion',
    example: 2450.75
  })
  @Column('decimal', { precision: 15, scale: 6, nullable: true })
  exchangeRate?: number;

  @ApiProperty({
    description: 'Montant original avant conversion',
    example: 1000.00
  })
  @Column('decimal', { precision: 20, scale: 4, nullable: true })
  originalAmount?: number;

  @ApiProperty({
    description: 'Devise originale avant conversion',
    enum: ISO4217CurrencyCode
  })
  @Column({
    type: 'enum',
    enum: ISO4217CurrencyCode,
    nullable: true
  })
  originalCurrency?: ISO4217CurrencyCode;

  // === AUDIT ET TRAÇABILITÉ ===

  @ApiProperty({
    description: 'Date de création de l\'enregistrement'
  })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({
    description: 'Date de dernière modification'
  })
  @UpdateDateColumn()
  updatedAt!: Date;

  @ApiProperty({
    description: 'Utilisateur ayant créé la transaction',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @Column()
  createdById!: string;

  @ApiProperty({
    description: 'Utilisateur ayant modifié la transaction',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @Column({ nullable: true })
  modifiedById?: string;

  @ApiProperty({
    description: 'Version de l\'enregistrement pour optimistic locking',
    example: 1
  })
  @Column({ type: 'int', default: 1 })
  version!: number;

  // === HOOKS DE CYCLE DE VIE ===

  @BeforeInsert()
  generateReferences() {
    // Générer les références ISO 20022 si pas déjà définies
    const financialStandardsService = new FinancialStandardsService();
    
    if (!this.endToEndReference) {
      const standardId = financialStandardsService.generateStandardTransactionId({
        entityCode: 'WNZO',
        transactionType: this.getTransactionTypeCode(),
        includeChecksum: true
      });
      this.endToEndReference = standardId.id;
    }

    if (!this.instructionReference) {
      this.instructionReference = `INST-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    if (!this.messageReference) {
      this.messageReference = `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    // Générer UETR si transaction internationale
    if (this.isInternationalTransaction() && !this.uetrReference) {
      this.uetrReference = this.generateUETR();
    }
  }

  @BeforeUpdate()
  incrementVersion() {
    this.version += 1;
  }

  // === MÉTHODES UTILITAIRES ===

  private getTransactionTypeCode(): string {
    switch (this.transactionType) {
      case ISO20022TransactionType.PAYMENT:
      case ISO20022TransactionType.CREDIT_TRANSFER:
        return 'PAY';
      case ISO20022TransactionType.LOAN:
        return 'FUND';
      case ISO20022TransactionType.TRADE_FINANCE:
        return 'TRAN';
      default:
        return 'PAY';
    }
  }

  private isInternationalTransaction(): boolean {
    // Vérifier si les codes pays du débiteur et créditeur diffèrent
    const debtorCountry = this.debtor.agent?.bic?.substring(4, 6);
    const creditorCountry = this.creditor.agent?.bic?.substring(4, 6);
    
    return debtorCountry !== creditorCountry;
  }

  private generateUETR(): string {
    // Format UETR: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (UUID v4)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // === MÉTHODES DE VALIDATION ===

  isCompliantWithISO20022(): boolean {
    // Vérifications minimales ISO 20022
    return !!(
      this.endToEndReference &&
      this.instructionReference &&
      this.amount > 0 &&
      this.currency &&
      this.debtor?.name &&
      this.creditor?.name &&
      this.transactionDate
    );
  }

  hasValidBICCodes(): boolean {
    const debtorBIC = this.debtor.agent?.bic;
    const creditorBIC = this.creditor.agent?.bic;
    
    if (!debtorBIC && !creditorBIC) return true; // Pas de BIC requis pour transactions domestiques
    
    const financialStandardsService = new FinancialStandardsService();
    
    if (debtorBIC && !financialStandardsService.validateBIC(debtorBIC).isValid) {
      return false;
    }
    
    if (creditorBIC && !financialStandardsService.validateBIC(creditorBIC).isValid) {
      return false;
    }
    
    return true;
  }

  requiresComplianceReview(): boolean {
    return this.complianceChecks.riskLevel === 'HIGH' || 
           this.complianceChecks.riskLevel === 'VERY_HIGH' ||
           !this.complianceChecks.sanctionsCheckPassed ||
           this.complianceChecks.reviewRequired === true;
  }
}