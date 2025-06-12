import { ApiProperty } from '@nestjs/swagger';
import { FinancingRecord, FinancingRecordStatus, FinancingRecordType } from '../entities/financing-record.entity';

// Enums that match frontend expectations
export enum FinancingType {
  CASH_CREDIT = 'cashCredit',
  INVESTMENT_CREDIT = 'investmentCredit',
  LEASING = 'leasing',
  PRODUCTION_INPUTS = 'productionInputs',
  MERCHANDISE = 'merchandise',
}

export enum FinancialInstitution {
  BONNE_MOISSON = 'bonneMoisson',
  TID = 'tid',
  SMICO = 'smico',
  TMB = 'tmb',
  EQUITY_BCDC = 'equitybcdc',
  WANZO_PASS = 'wanzoPass',
}

export enum FinancialProduct {
  CASH_FLOW = 'cashFlow',
  INVESTMENT = 'investment',
  EQUIPMENT = 'equipment',
  AGRICULTURAL = 'agricultural',
  COMMERCIAL_GOODS = 'commercialGoods',
}

export enum FinancingRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DISBURSED = 'disbursed',
  REPAYING = 'repaying',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

// Map backend types to frontend types
const typeMapping: Record<FinancingRecordType, FinancingType> = {
  [FinancingRecordType.LOAN]: FinancingType.CASH_CREDIT,
  [FinancingRecordType.INVESTMENT]: FinancingType.INVESTMENT_CREDIT,
  [FinancingRecordType.GRANT]: FinancingType.PRODUCTION_INPUTS,
  [FinancingRecordType.EQUITY]: FinancingType.MERCHANDISE,
};

// Map backend statuses to frontend statuses
const statusMapping: Record<FinancingRecordStatus, FinancingRequestStatus> = {
  [FinancingRecordStatus.PENDING]: FinancingRequestStatus.PENDING,
  [FinancingRecordStatus.ACTIVE]: FinancingRequestStatus.DISBURSED,
  [FinancingRecordStatus.REPAID]: FinancingRequestStatus.COMPLETED,
  [FinancingRecordStatus.CLOSED]: FinancingRequestStatus.COMPLETED,
  [FinancingRecordStatus.DEFAULTED]: FinancingRequestStatus.REJECTED,
};

// DTO that matches frontend expectations
export class FinancingRequestResponseDto {
  @ApiProperty({ description: 'Identifier', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ description: 'Amount', example: 50000 })
  amount: number;

  @ApiProperty({ description: 'Currency', example: 'CDF' })
  currency: string = 'CDF'; // Default to CDF

  @ApiProperty({ description: 'Reason for financing', example: 'Working capital for expansion' })
  reason: string;

  @ApiProperty({ 
    description: 'Type of financing', 
    enum: FinancingType,
    example: FinancingType.CASH_CREDIT
  })
  type: FinancingType;

  @ApiProperty({ 
    description: 'Financial institution', 
    enum: FinancialInstitution,
    example: FinancialInstitution.TMB
  })
  institution: FinancialInstitution = FinancialInstitution.TMB; // Default value

  @ApiProperty({ description: 'Request date', example: '2025-07-15T10:00:00.000Z' })
  requestDate: string;

  @ApiProperty({ 
    description: 'Status of the financing request',
    enum: FinancingRequestStatus,
    example: FinancingRequestStatus.PENDING
  })
  status: FinancingRequestStatus;

  @ApiProperty({ description: 'Approval date', example: '2025-07-20T10:00:00.000Z', required: false })
  approvalDate?: string;

  @ApiProperty({ description: 'Disbursement date', example: '2025-07-25T10:00:00.000Z', required: false })
  disbursementDate?: string;

  @ApiProperty({ 
    description: 'Scheduled payments',
    type: [String],
    example: ['2025-08-25T10:00:00.000Z', '2025-09-25T10:00:00.000Z'],
    required: false
  })
  scheduledPayments?: string[];

  @ApiProperty({ 
    description: 'Completed payments',
    type: [String],
    example: ['2025-08-25T10:00:00.000Z'],
    required: false
  })
  completedPayments?: string[];

  @ApiProperty({ description: 'Notes', example: 'Application approved with special terms', required: false })
  notes?: string;

  @ApiProperty({ description: 'Interest rate', example: 5.5, required: false })
  interestRate?: number;

  @ApiProperty({ description: 'Term in months', example: 36, required: false })
  termMonths?: number;

  @ApiProperty({ description: 'Monthly payment amount', example: 1500, required: false })
  monthlyPayment?: number;

  @ApiProperty({ 
    description: 'Attachment paths',
    type: [String],
    example: ['https://example.com/attachments/contract.pdf'],
    required: false
  })
  attachmentPaths?: string[];

  @ApiProperty({ 
    description: 'Financial product',
    enum: FinancialProduct,
    example: FinancialProduct.CASH_FLOW,
    required: false
  })
  financialProduct?: FinancialProduct;

  @ApiProperty({ description: 'Leasing code', example: 'LEASE-2025-001', required: false })
  leasingCode?: string;

  // Static method to convert from entity to DTO
  static fromEntity(entity: FinancingRecord): FinancingRequestResponseDto {
    const dto = new FinancingRequestResponseDto();
    
    dto.id = entity.id;
    dto.amount = entity.amount;
    dto.reason = entity.sourceOrPurpose;
    dto.type = typeMapping[entity.type] || FinancingType.CASH_CREDIT;
    dto.requestDate = entity.date.toISOString();
    dto.status = statusMapping[entity.status] || FinancingRequestStatus.PENDING;
    
    // Handle related documents
    if (entity.relatedDocuments && entity.relatedDocuments.length > 0) {
      dto.attachmentPaths = entity.relatedDocuments.map(doc => doc.url);
    }
    
    // Handle terms as notes
    if (entity.terms) {
      dto.notes = entity.terms;
      
      // Try to extract interest rate from terms if it exists
      const interestRateMatch = entity.terms.match(/(\d+(\.\d+)?)%\s+interest/i);
      if (interestRateMatch) {
        dto.interestRate = parseFloat(interestRateMatch[1]);
      }
      
      // Try to extract term months from terms if it exists
      const termMonthsMatch = entity.terms.match(/(\d+)\s+months/i);
      if (termMonthsMatch) {
        dto.termMonths = parseInt(termMonthsMatch[1], 10);
      }
    }
    
    return dto;
  }
}
