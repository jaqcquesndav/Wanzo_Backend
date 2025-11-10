/**
 * Standards financiers internationaux ISO
 * Implémentation complète des normes ISO 20022, ISO 4217, ISO 13616, etc.
 */

// ISO 4217 - Codes de devises officiels
export enum ISO4217CurrencyCode {
  // Devises principales - Afrique
  XOF = 'XOF', // Franc CFA BCEAO (Sénégal, Mali, Burkina Faso, etc.)
  XAF = 'XAF', // Franc CFA BEAC (Cameroun, Tchad, etc.)
  CDF = 'CDF', // Franc Congolais - République Démocratique du Congo
  
  // Devises internationales majeures
  USD = 'USD', // Dollar des États-Unis
  EUR = 'EUR', // Euro
  GBP = 'GBP', // Livre Sterling
  CHF = 'CHF', // Franc Suisse
  JPY = 'JPY', // Yen Japonais
  
  // Devises africaines principales
  ZAR = 'ZAR', // Rand Sud-Africain
  NGN = 'NGN', // Naira Nigérian
  EGP = 'EGP', // Livre Égyptienne
  KES = 'KES', // Shilling Kényan
  GHS = 'GHS', // Cedi Ghanéen
  MAD = 'MAD', // Dirham Marocain
  TND = 'TND', // Dinar Tunisien
  ETB = 'ETB', // Birr Éthiopien
  UGX = 'UGX', // Shilling Ougandais
  RWF = 'RWF', // Franc Rwandais
}

// ISO 4217 - Propriétés des devises
export interface CurrencyProperties {
  code: ISO4217CurrencyCode;
  numericCode: string;
  minorUnit: number; // Nombre de décimales
  name: string;
  countries: string[];
}

export const ISO4217_CURRENCY_DATA: Record<ISO4217CurrencyCode, CurrencyProperties> = {
  [ISO4217CurrencyCode.XOF]: {
    code: ISO4217CurrencyCode.XOF,
    numericCode: '952',
    minorUnit: 0, // Pas de centimes
    name: 'Franc CFA BCEAO',
    countries: ['SN', 'ML', 'BF', 'NE', 'CI', 'GW', 'TG', 'BJ']
  },
  [ISO4217CurrencyCode.XAF]: {
    code: ISO4217CurrencyCode.XAF,
    numericCode: '950',
    minorUnit: 0,
    name: 'Franc CFA BEAC',
    countries: ['CM', 'CF', 'CG', 'GA', 'GQ', 'TD']
  },
  [ISO4217CurrencyCode.CDF]: {
    code: ISO4217CurrencyCode.CDF,
    numericCode: '976',
    minorUnit: 2,
    name: 'Franc Congolais',
    countries: ['CD']
  },
  [ISO4217CurrencyCode.USD]: {
    code: ISO4217CurrencyCode.USD,
    numericCode: '840',
    minorUnit: 2,
    name: 'US Dollar',
    countries: ['US']
  },
  [ISO4217CurrencyCode.EUR]: {
    code: ISO4217CurrencyCode.EUR,
    numericCode: '978',
    minorUnit: 2,
    name: 'Euro',
    countries: ['DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'LU', 'AT', 'FI', 'IE', 'GR', 'MT', 'CY', 'SK', 'SI', 'EE', 'LV', 'LT']
  },
  [ISO4217CurrencyCode.GBP]: {
    code: ISO4217CurrencyCode.GBP,
    numericCode: '826',
    minorUnit: 2,
    name: 'Pound Sterling',
    countries: ['GB']
  },
  [ISO4217CurrencyCode.CHF]: {
    code: ISO4217CurrencyCode.CHF,
    numericCode: '756',
    minorUnit: 2,
    name: 'Swiss Franc',
    countries: ['CH', 'LI']
  },
  [ISO4217CurrencyCode.JPY]: {
    code: ISO4217CurrencyCode.JPY,
    numericCode: '392',
    minorUnit: 0,
    name: 'Yen',
    countries: ['JP']
  },
  [ISO4217CurrencyCode.ZAR]: {
    code: ISO4217CurrencyCode.ZAR,
    numericCode: '710',
    minorUnit: 2,
    name: 'Rand',
    countries: ['ZA']
  },
  [ISO4217CurrencyCode.NGN]: {
    code: ISO4217CurrencyCode.NGN,
    numericCode: '566',
    minorUnit: 2,
    name: 'Naira',
    countries: ['NG']
  },
  [ISO4217CurrencyCode.EGP]: {
    code: ISO4217CurrencyCode.EGP,
    numericCode: '818',
    minorUnit: 2,
    name: 'Egyptian Pound',
    countries: ['EG']
  },
  [ISO4217CurrencyCode.KES]: {
    code: ISO4217CurrencyCode.KES,
    numericCode: '404',
    minorUnit: 2,
    name: 'Kenyan Shilling',
    countries: ['KE']
  },
  [ISO4217CurrencyCode.GHS]: {
    code: ISO4217CurrencyCode.GHS,
    numericCode: '936',
    minorUnit: 2,
    name: 'Ghana Cedi',
    countries: ['GH']
  },
  [ISO4217CurrencyCode.MAD]: {
    code: ISO4217CurrencyCode.MAD,
    numericCode: '504',
    minorUnit: 2,
    name: 'Moroccan Dirham',
    countries: ['MA']
  },
  [ISO4217CurrencyCode.TND]: {
    code: ISO4217CurrencyCode.TND,
    numericCode: '788',
    minorUnit: 3,
    name: 'Tunisian Dinar',
    countries: ['TN']
  },
  [ISO4217CurrencyCode.ETB]: {
    code: ISO4217CurrencyCode.ETB,
    numericCode: '230',
    minorUnit: 2,
    name: 'Ethiopian Birr',
    countries: ['ET']
  },
  [ISO4217CurrencyCode.UGX]: {
    code: ISO4217CurrencyCode.UGX,
    numericCode: '800',
    minorUnit: 0,
    name: 'Uganda Shilling',
    countries: ['UG']
  },
  [ISO4217CurrencyCode.RWF]: {
    code: ISO4217CurrencyCode.RWF,
    numericCode: '646',
    minorUnit: 0,
    name: 'Rwanda Franc',
    countries: ['RW']
  }
};

// ISO 20022 - Structure des messages financiers
export interface ISO20022MessageHeader {
  messageId: string; // Identifiant unique du message
  creationDateTime: string; // Date/heure ISO 8601
  numberOfTransactions: string; // Nombre de transactions
  controlSum?: string; // Somme de contrôle
  initiatingParty?: PartyIdentification;
}

export interface PartyIdentification {
  name: string;
  postalAddress?: PostalAddress;
  identification?: OrganisationIdentification;
}

export interface PostalAddress {
  addressType?: string;
  department?: string;
  subDepartment?: string;
  streetName?: string;
  buildingNumber?: string;
  postCode?: string;
  townName?: string;
  countrySubDivision?: string;
  country: string; // ISO 3166-1 alpha-2
}

export interface OrganisationIdentification {
  bicOrBei?: string; // BIC ou BEI (Business Entity Identifier)
  lei?: string; // Legal Entity Identifier
  other?: Array<{
    identification: string;
    schemeName?: string;
    issuer?: string;
  }>;
}

// ISO 20022 - Transaction Credit Transfer
export interface CreditTransferTransaction {
  paymentId: PaymentIdentification;
  amount: ActiveOrHistoricCurrencyAndAmount;
  ultimateDebtor?: PartyIdentification;
  intermediaryAgent1?: BranchAndFinancialInstitutionIdentification;
  intermediaryAgent1Account?: CashAccount;
  creditorAgent?: BranchAndFinancialInstitutionIdentification;
  creditorAgentAccount?: CashAccount;
  creditor?: PartyIdentification;
  creditorAccount?: CashAccount;
  ultimateCreditor?: PartyIdentification;
  instructionForCreditorAgent?: string;
  instructionForNextAgent?: string;
  purpose?: Purpose;
  remittanceInformation?: RemittanceInformation;
  supplementaryData?: SupplementaryData[];
}

export interface PaymentIdentification {
  instructionId?: string;
  endToEndId: string; // Obligatoire
  transactionId?: string;
  clearingSystemReference?: string;
}

export interface ActiveOrHistoricCurrencyAndAmount {
  value: string; // Montant en décimal
  currency: ISO4217CurrencyCode;
}

export interface BranchAndFinancialInstitutionIdentification {
  financialInstitutionId: FinancialInstitutionIdentification;
  branchId?: BranchIdentification;
}

export interface FinancialInstitutionIdentification {
  bic?: string; // Code BIC/SWIFT
  clearingSystemMemberId?: ClearingSystemMemberIdentification;
  name?: string;
  postalAddress?: PostalAddress;
  other?: GenericFinancialIdentification;
}

export interface ClearingSystemMemberIdentification {
  clearingSystemId?: string;
  memberId: string;
}

export interface GenericFinancialIdentification {
  identification: string;
  schemeName?: string;
  issuer?: string;
}

export interface BranchIdentification {
  id?: string;
  lei?: string;
  name?: string;
  postalAddress?: PostalAddress;
}

export interface CashAccount {
  id: AccountIdentification;
  type?: CashAccountType;
  currency?: ISO4217CurrencyCode;
  name?: string;
}

export interface AccountIdentification {
  iban?: string;
  other?: GenericAccountIdentification;
}

export interface GenericAccountIdentification {
  identification: string;
  schemeName?: string;
  issuer?: string;
}

export interface CashAccountType {
  code?: string;
  proprietary?: string;
}

export interface Purpose {
  code?: string;
  proprietary?: string;
}

export interface RemittanceInformation {
  unstructured?: string[];
  structured?: StructuredRemittanceInformation[];
}

export interface StructuredRemittanceInformation {
  referredDocumentInformation?: ReferredDocumentInformation[];
  referredDocumentAmount?: RemittanceAmount;
  creditorReferenceInformation?: CreditorReferenceInformation;
  invoicer?: PartyIdentification;
  invoicee?: PartyIdentification;
  additionalRemittanceInformation?: string[];
}

export interface ReferredDocumentInformation {
  type?: ReferredDocumentType;
  number?: string;
  relatedDate?: string;
}

export interface ReferredDocumentType {
  codeOrProprietary: CodeOrProprietary;
  issuer?: string;
}

export interface CodeOrProprietary {
  code?: string;
  proprietary?: string;
}

export interface RemittanceAmount {
  duePayableAmount?: ActiveOrHistoricCurrencyAndAmount;
  discountAppliedAmount?: ActiveOrHistoricCurrencyAndAmount[];
  creditNoteAmount?: ActiveOrHistoricCurrencyAndAmount;
  taxAmount?: TaxInformation[];
  adjustmentAmountAndReason?: DocumentAdjustment[];
  remittedAmount?: ActiveOrHistoricCurrencyAndAmount;
}

export interface TaxInformation {
  creditor?: TaxParty;
  debtor?: TaxParty;
  administrationZone?: string;
  referenceNumber?: string;
  method?: string;
  totalTaxableBaseAmount?: ActiveOrHistoricCurrencyAndAmount;
  totalTaxAmount?: ActiveOrHistoricCurrencyAndAmount;
  date?: string;
  sequenceNumber?: number;
  record?: TaxRecord[];
}

export interface TaxParty {
  taxId?: string;
  registrationId?: string;
  taxType?: string;
}

export interface TaxRecord {
  type?: string;
  category?: string;
  categoryDetails?: string;
  debtorStatus?: string;
  certificateId?: string;
  formsCode?: string;
  period?: TaxPeriod;
  taxAmount?: TaxAmount;
  additionalInformation?: string;
}

export interface TaxPeriod {
  year?: string;
  type?: string;
  fromToDate?: DatePeriod;
}

export interface DatePeriod {
  fromDate: string;
  toDate: string;
}

export interface TaxAmount {
  rate?: number;
  taxableBaseAmount?: ActiveOrHistoricCurrencyAndAmount;
  totalAmount?: ActiveOrHistoricCurrencyAndAmount;
  details?: TaxRecordDetails[];
}

export interface TaxRecordDetails {
  period?: TaxPeriod;
  amount: ActiveOrHistoricCurrencyAndAmount;
}

export interface DocumentAdjustment {
  amount: ActiveOrHistoricCurrencyAndAmount;
  creditDebitIndicator: 'CRDT' | 'DBIT';
  reason?: string;
  additionalInformation?: string;
}

export interface CreditorReferenceInformation {
  type?: CreditorReferenceType;
  reference?: string;
}

export interface CreditorReferenceType {
  codeOrProprietary: CodeOrProprietary;
  issuer?: string;
}

export interface SupplementaryData {
  placeAndName?: string;
  envelope: any; // XML content
}

// ISO 13616 - IBAN (International Bank Account Number)
export interface IBANValidation {
  isValid: boolean;
  country: string;
  checkDigits: string;
  bban: string; // Basic Bank Account Number
  formatted: string;
}

export class IBANValidator {
  private static readonly IBAN_LENGTH: Record<string, number> = {
    AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22,
    BH: 22, BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22,
    DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27,
    GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21, HU: 28,
    IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
    LC: 32, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22,
    MK: 19, MR: 27, MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28,
    PS: 29, PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SE: 24, SI: 19,
    SK: 24, SM: 27, TN: 24, TR: 26, UA: 29, VG: 24, XK: 20
  };

  static validate(iban: string): IBANValidation {
    // Nettoyer l'IBAN
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    
    // Vérifier la longueur
    const country = cleanIban.substring(0, 2);
    const expectedLength = this.IBAN_LENGTH[country];
    
    if (!expectedLength || cleanIban.length !== expectedLength) {
      return {
        isValid: false,
        country,
        checkDigits: cleanIban.substring(2, 4),
        bban: cleanIban.substring(4),
        formatted: this.formatIBAN(cleanIban)
      };
    }

    // Validation mod-97
    const rearranged = cleanIban.substring(4) + cleanIban.substring(0, 4);
    const numericString = rearranged.replace(/[A-Z]/g, (char) => 
      (char.charCodeAt(0) - 55).toString()
    );
    
    const remainder = this.mod97(numericString);
    const isValid = remainder === 1;

    return {
      isValid,
      country,
      checkDigits: cleanIban.substring(2, 4),
      bban: cleanIban.substring(4),
      formatted: this.formatIBAN(cleanIban)
    };
  }

  private static mod97(numericString: string): number {
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
    }
    return remainder;
  }

  private static formatIBAN(iban: string): string {
    return iban.replace(/(.{4})/g, '$1 ').trim();
  }
}

// BIC (Bank Identifier Code) - ISO 9362
export interface BICValidation {
  isValid: boolean;
  bankCode: string;
  countryCode: string;
  locationCode: string;
  branchCode?: string;
  formatted: string;
}

export class BICValidator {
  static validate(bic: string): BICValidation {
    const cleanBic = bic.replace(/\s/g, '').toUpperCase();
    
    // BIC peut avoir 8 ou 11 caractères
    if (cleanBic.length !== 8 && cleanBic.length !== 11) {
      return {
        isValid: false,
        bankCode: cleanBic.substring(0, 4),
        countryCode: cleanBic.substring(4, 6),
        locationCode: cleanBic.substring(6, 8),
        branchCode: cleanBic.length === 11 ? cleanBic.substring(8, 11) : undefined,
        formatted: cleanBic
      };
    }

    // Validation du format
    const bankCodeRegex = /^[A-Z]{4}$/;
    const countryCodeRegex = /^[A-Z]{2}$/;
    const locationCodeRegex = /^[A-Z0-9]{2}$/;
    const branchCodeRegex = /^[A-Z0-9]{3}$/;

    const bankCode = cleanBic.substring(0, 4);
    const countryCode = cleanBic.substring(4, 6);
    const locationCode = cleanBic.substring(6, 8);
    const branchCode = cleanBic.length === 11 ? cleanBic.substring(8, 11) : undefined;

    const isValid = 
      bankCodeRegex.test(bankCode) &&
      countryCodeRegex.test(countryCode) &&
      locationCodeRegex.test(locationCode) &&
      (branchCode === undefined || branchCodeRegex.test(branchCode));

    return {
      isValid,
      bankCode,
      countryCode,
      locationCode,
      branchCode,
      formatted: cleanBic
    };
  }
}

// LEI (Legal Entity Identifier) - ISO 17442
export interface LEIValidation {
  isValid: boolean;
  prefix: string;
  entityCode: string;
  checkDigits: string;
  formatted: string;
}

export class LEIValidator {
  static validate(lei: string): LEIValidation {
    const cleanLei = lei.replace(/\s/g, '').toUpperCase();
    
    if (cleanLei.length !== 20) {
      return {
        isValid: false,
        prefix: cleanLei.substring(0, 4),
        entityCode: cleanLei.substring(4, 18),
        checkDigits: cleanLei.substring(18, 20),
        formatted: cleanLei
      };
    }

    // Validation mod-97 similaire à IBAN
    const rearranged = cleanLei.substring(0, 18) + '00';
    const numericString = rearranged.replace(/[A-Z]/g, (char) => 
      (char.charCodeAt(0) - 55).toString()
    );
    
    const remainder = this.mod97(numericString);
    const expectedCheckDigits = (98 - remainder).toString().padStart(2, '0');
    const actualCheckDigits = cleanLei.substring(18, 20);
    
    const isValid = expectedCheckDigits === actualCheckDigits;

    return {
      isValid,
      prefix: cleanLei.substring(0, 4),
      entityCode: cleanLei.substring(4, 18),
      checkDigits: cleanLei.substring(18, 20),
      formatted: cleanLei
    };
  }

  private static mod97(numericString: string): number {
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
    }
    return remainder;
  }
}