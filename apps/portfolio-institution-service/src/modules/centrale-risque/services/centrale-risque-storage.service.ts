import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  CreditRisk, 
  PaymentIncident, 
  CreditScoreHistory, 
  Collateral, 
  CompanyLoan 
} from '../entities';

@Injectable()
export class CentraleRisqueStorageService {
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
  ) {}

  async saveCreditRisk(creditRiskData: Partial<CreditRisk>) {
    const creditRisk = this.creditRiskRepository.create(creditRiskData);
    return this.creditRiskRepository.save(creditRisk);
  }

  async savePaymentIncident(paymentIncidentData: Partial<PaymentIncident>) {
    const paymentIncident = this.paymentIncidentRepository.create(paymentIncidentData);
    return this.paymentIncidentRepository.save(paymentIncident);
  }

  async saveCreditScoreHistory(creditScoreData: Partial<CreditScoreHistory>) {
    const creditScore = this.creditScoreHistoryRepository.create(creditScoreData);
    return this.creditScoreHistoryRepository.save(creditScore);
  }

  async saveCollateral(collateralData: Partial<Collateral>) {
    const collateral = this.collateralRepository.create(collateralData);
    return this.collateralRepository.save(collateral);
  }

  async saveCompanyLoan(loanData: Partial<CompanyLoan>) {
    const loan = this.companyLoanRepository.create(loanData);
    return this.companyLoanRepository.save(loan);
  }

  async batchSaveCreditRisks(creditRisksData: Partial<CreditRisk>[]) {
    const creditRisks = this.creditRiskRepository.create(creditRisksData);
    return this.creditRiskRepository.save(creditRisks);
  }

  async batchSavePaymentIncidents(incidentsData: Partial<PaymentIncident>[]) {
    const incidents = this.paymentIncidentRepository.create(incidentsData);
    return this.paymentIncidentRepository.save(incidents);
  }

  async batchSaveCreditScores(scoresData: Partial<CreditScoreHistory>[]) {
    const scores = this.creditScoreHistoryRepository.create(scoresData);
    return this.creditScoreHistoryRepository.save(scores);
  }

  async batchSaveCollaterals(collateralsData: Partial<Collateral>[]) {
    const collaterals = this.collateralRepository.create(collateralsData);
    return this.collateralRepository.save(collaterals);
  }

  async batchSaveCompanyLoans(loansData: Partial<CompanyLoan>[]) {
    const loans = this.companyLoanRepository.create(loansData);
    return this.companyLoanRepository.save(loans);
  }
}
