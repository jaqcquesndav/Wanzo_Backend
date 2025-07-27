import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  CreditRisk, 
  PaymentIncident, 
  CreditScoreHistory, 
  Collateral, 
  CompanyLoan,
  FinancialTransaction
} from '../entities';

@Injectable()
export class CentraleRisqueService {
  constructor(
    @InjectRepository(CreditRisk)
    private creditRiskRepository: Repository<CreditRisk>,
    
    @InjectRepository(PaymentIncident)
    private paymentIncidentRepository: Repository<PaymentIncident>,
    
    @InjectRepository(CreditScoreHistory)
    private creditScoreHistoryRepository: Repository<CreditScoreHistory>,
    
    @InjectRepository(Collateral)
    private collateralRepository: Repository<Collateral>,
    
    @InjectRepository(CompanyLoan)
    private companyLoanRepository: Repository<CompanyLoan>,
    
    @InjectRepository(FinancialTransaction)
    private financialTransactionRepository: Repository<FinancialTransaction>,
  ) {}

  async findAllCreditRisks(companyId?: string, institutionId?: string) {
    const query = this.creditRiskRepository.createQueryBuilder('creditRisk');
    
    if (companyId) {
      query.andWhere('creditRisk.companyId = :companyId', { companyId });
    }
    
    if (institutionId) {
      query.andWhere('creditRisk.institutionId = :institutionId', { institutionId });
    }
    
    return query.getMany();
  }

  async findCreditRiskById(id: string) {
    const creditRisk = await this.creditRiskRepository.findOne({ where: { id } });
    
    if (!creditRisk) {
      throw new NotFoundException(`Credit risk with ID ${id} not found`);
    }
    
    return creditRisk;
  }

  async findAllPaymentIncidents(companyId?: string, institutionId?: string) {
    const query = this.paymentIncidentRepository.createQueryBuilder('paymentIncident');
    
    if (companyId) {
      query.andWhere('paymentIncident.companyId = :companyId', { companyId });
    }
    
    if (institutionId) {
      query.andWhere('paymentIncident.institutionId = :institutionId', { institutionId });
    }
    
    return query.getMany();
  }

  async findCreditScoreHistory(companyId?: string, institutionId?: string) {
    const query = this.creditScoreHistoryRepository.createQueryBuilder('creditScoreHistory')
      .orderBy('creditScoreHistory.scoreDate', 'DESC');
    
    if (companyId) {
      query.andWhere('creditScoreHistory.companyId = :companyId', { companyId });
    }
    
    if (institutionId) {
      query.andWhere('creditScoreHistory.institutionId = :institutionId', { institutionId });
    }
    
    return query.getMany();
  }

  async findAllCollaterals(companyId?: string, institutionId?: string) {
    const query = this.collateralRepository.createQueryBuilder('collateral');
    
    if (companyId) {
      query.andWhere('collateral.companyId = :companyId', { companyId });
    }
    
    if (institutionId) {
      query.andWhere('collateral.institutionId = :institutionId', { institutionId });
    }
    
    return query.getMany();
  }

  async findAllCompanyLoans(companyId?: string, institutionId?: string) {
    const query = this.companyLoanRepository.createQueryBuilder('companyLoan');
    
    if (companyId) {
      query.andWhere('companyLoan.companyId = :companyId', { companyId });
    }
    
    if (institutionId) {
      query.andWhere('companyLoan.institutionId = :institutionId', { institutionId });
    }
    
    return query.getMany();
  }

  async findAllFinancialTransactions(companyId?: string, institutionId?: string) {
    const query = this.financialTransactionRepository.createQueryBuilder('financialTransaction')
      .orderBy('financialTransaction.transactionDate', 'DESC');
    
    if (companyId) {
      query.andWhere('financialTransaction.companyId = :companyId', { companyId });
    }
    
    if (institutionId) {
      query.andWhere('financialTransaction.institutionId = :institutionId', { institutionId });
    }
    
    return query.getMany();
  }

  async getRiskSummary(companyId: string) {
    // Get credit risk data
    const creditRisk = await this.creditRiskRepository.findOne({ 
      where: { companyId } 
    });
    
    // Get payment incidents count
    const paymentIncidentsCount = await this.paymentIncidentRepository.count({
      where: { companyId }
    });
    
    // Get latest credit score
    const latestCreditScore = await this.creditScoreHistoryRepository.findOne({
      where: { companyId },
      order: { scoreDate: 'DESC' }
    });
    
    // Get total collateral value
    const collaterals = await this.collateralRepository.find({
      where: { companyId }
    });
    const totalCollateralValue = collaterals.reduce((sum, item) => sum + Number(item.value), 0);
    
    // Get total loan amount and outstanding amount
    const loans = await this.companyLoanRepository.find({
      where: { companyId }
    });
    const totalLoanAmount = loans.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalOutstandingAmount = loans.reduce((sum, item) => sum + Number(item.outstandingAmount), 0);
    
    // Get payment incidents
    const paymentIncidents = await this.paymentIncidentRepository.find({
      where: { companyId },
      order: { incidentDate: 'DESC' },
      take: 5
    });
    
    return {
      creditRisk,
      paymentIncidentsCount,
      latestCreditScore,
      totalCollateralValue,
      totalLoanAmount,
      totalOutstandingAmount,
      paymentIncidents,
      collateralCoverage: totalOutstandingAmount > 0 ? (totalCollateralValue / totalOutstandingAmount) * 100 : 0
    };
  }
}
