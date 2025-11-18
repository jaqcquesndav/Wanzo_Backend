/**
 * Événements standardisés pour les demandes de financement
 * Communication gestion_commerciale ↔ portfolio-institution
 */

export interface FundingRequestCreatedEvent {
  eventType: 'funding.request.created';
  data: {
    financingRecordId: string;  // ID dans gestion_commerciale
    userId: string;
    companyId: string;
    amount: number;
    currency: string;
    type: string;  // 'businessLoan', 'equipmentLoan', etc.
    term: number;  // En mois
    purpose: string;
    institutionId?: string;
    businessInformation: {
      name: string;
      registrationNumber: string;
      address: string;
      yearsInBusiness: number;
      numberOfEmployees: number;
      annualRevenue: number;
    };
    financialInformation: {
      monthlyRevenue: number;
      monthlyExpenses: number;
      existingLoans: Array<{
        lender: string;
        originalAmount: number;
        outstandingBalance: number;
        monthlyPayment: number;
      }>;
    };
    paymentInfo: {
      bankAccounts: Array<{
        id: string;
        accountNumber: string;
        accountName: string;
        bankName: string;
        bankCode?: string;
        branchCode?: string;
        swiftCode?: string;
        rib?: string;
        isDefault: boolean;
        status: 'active' | 'inactive' | 'suspended';
      }>;
      mobileMoneyAccounts: Array<{
        id: string;
        phoneNumber: string;
        accountName: string;
        operator: 'AM' | 'OM' | 'WAVE' | 'MP' | 'AF';
        operatorName: string;
        isDefault: boolean;
        status: 'active' | 'inactive' | 'suspended';
        verificationStatus: 'pending' | 'verified' | 'failed';
      }>;
      preferredMethod: 'bank' | 'mobile_money';
      defaultBankAccountId?: string;
      defaultMobileMoneyAccountId?: string;
    };
    documents: Array<{
      id: string;
      type: string;
      name: string;
      url: string;
      uploadDate: Date;
    }>;
  };
  metadata: {
    source: 'gestion_commerciale';
    correlationId: string;
    timestamp: string;
    version: string;
  };
}

export interface FundingRequestAcknowledgedEvent {
  eventType: 'funding.request.acknowledged';
  data: {
    financingRecordId: string;  // ID original dans gestion_commerciale
    fundingRequestId: string;   // Nouvel ID dans portfolio-institution
    portfolioId: string;
    requestNumber: string;
    status: string;
    acknowledgedAt: string;
  };
  metadata: {
    source: 'portfolio_institution';
    correlationId: string;
    timestamp: string;
    version: string;
  };
}

export interface FundingRequestErrorEvent {
  eventType: 'funding.request.error';
  data: {
    financingRecordId: string;
    errorCode: string;
    errorMessage: string;
    errorDetails?: any;
    failedAt: string;
  };
  metadata: {
    source: 'portfolio_institution';
    correlationId: string;
    timestamp: string;
    version: string;
  };
}

export enum FundingRequestEventTopics {
  FUNDING_REQUEST_CREATED = 'funding.request.created',
  FUNDING_REQUEST_ACKNOWLEDGED = 'funding.request.acknowledged',
  FUNDING_REQUEST_ERROR = 'funding.request.error',
}
