import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';
import { Contract, ContractStatus } from '../../portfolios/entities/contract.entity';
import { Repayment, RepaymentStatus } from '../../portfolios/entities/repayment.entity';
import { RiskLevel, RiskRating, BalanceAGE } from '../interfaces/dashboard.interface';

export interface NPLCalculationResult {
  nplRatio: number;
  details: {
    npl_amount: number;
    total_loans: number;
    npl_contracts_count: number;
    calculation_method: string;
    data_quality_score: number;
  };
}

export interface ProvisionCalculationResult {
  provisionRate: number;
  details: {
    total_provisions: number;
    total_loans: number;
    provision_categories: {
      category: string;
      amount: number;
      rate: number;
    }[];
    calculation_method: string;
  };
}

export interface CollectionEfficiencyResult {
  efficiency: number;
  details: {
    collected_amount: number;
    due_amount: number;
    collection_period_days: number;
    on_time_collections: number;
    late_collections: number;
  };
}

@Injectable()
export class OHADACalculatorService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Repayment)
    private repaymentRepository: Repository<Repayment>,
  ) {}

  /**
   * Calcul du ratio NPL selon les normes BCEAO
   * NPL = (Créances en souffrance > 90 jours) / Total des crédits
   */
  async calculateNPLRatio(
    portfolioId: string, 
    calculationDate: Date = new Date()
  ): Promise<NPLCalculationResult> {
    
    // Récupérer tous les contrats actifs du portefeuille
    const contracts = await this.contractRepository.find({
      where: { 
        portfolio_id: portfolioId,
        status: ContractStatus.ACTIVE
      },
      relations: ['portfolio']
    });

    let totalLoans = 0;
    let nplAmount = 0;
    let nplContractsCount = 0;

    for (const contract of contracts) {
      const loanAmount = Number(contract.principal_amount);
      totalLoans += loanAmount;

      // Vérifier si le contrat est en retard > 90 jours
      const lastPayment = await this.getLastRepaymentDate(contract.id);
      const daysPastDue = this.calculateDaysPastDue(lastPayment, calculationDate);

      if (daysPastDue > 90) {
        const outstandingAmount = await this.calculateOutstandingAmount(contract.id, calculationDate);
        nplAmount += outstandingAmount;
        nplContractsCount++;
      }
    }

    const nplRatio = totalLoans > 0 ? (nplAmount / totalLoans) * 100 : 0;

    return {
      nplRatio: Number(nplRatio.toFixed(2)),
      details: {
        npl_amount: nplAmount,
        total_loans: totalLoans,
        npl_contracts_count: nplContractsCount,
        calculation_method: 'BCEAO_STANDARD_90_DAYS',
        data_quality_score: this.assessDataQuality(contracts.length, nplContractsCount)
      }
    };
  }

  /**
   * Calcul du taux de provisionnement selon OHADA
   */
  async calculateProvisionRate(
    portfolioId: string,
    calculationDate: Date = new Date()
  ): Promise<ProvisionCalculationResult> {
    
    const contracts = await this.contractRepository.find({
      where: { 
        portfolio_id: portfolioId,
        status: ContractStatus.ACTIVE
      }
    });

    let totalLoans = 0;
    let totalProvisions = 0;
    const provisionCategories = [
      { category: 'SAIN', rate: 0.005, amount: 0 }, // 0.5%
      { category: 'SURVEILLANCE', rate: 0.02, amount: 0 }, // 2%
      { category: 'DOUTEUSE', rate: 0.15, amount: 0 }, // 15%
      { category: 'COMPROMISE', rate: 0.50, amount: 0 }, // 50%
      { category: 'IRRECUPERABLE', rate: 1.0, amount: 0 } // 100%
    ];

    for (const contract of contracts) {
      const loanAmount = Number(contract.principal_amount);
      totalLoans += loanAmount;

      // Classifier le crédit selon OHADA
      const classification = await this.classifyLoanOHADA(contract.id, calculationDate);
      const categoryIndex = this.getProvisionCategoryIndex(classification);
      
      const provisionAmount = loanAmount * provisionCategories[categoryIndex].rate;
      provisionCategories[categoryIndex].amount += provisionAmount;
      totalProvisions += provisionAmount;
    }

    const provisionRate = totalLoans > 0 ? (totalProvisions / totalLoans) * 100 : 0;

    return {
      provisionRate: Number(provisionRate.toFixed(2)),
      details: {
        total_provisions: totalProvisions,
        total_loans: totalLoans,
        provision_categories: provisionCategories.filter(cat => cat.amount > 0),
        calculation_method: 'OHADA_STANDARD_CLASSIFICATION'
      }
    };
  }

  /**
   * Calcul de l'efficacité de recouvrement
   */
  async calculateCollectionEfficiency(
    portfolioId: string,
    periodStart: Date,
    periodEnd: Date = new Date()
  ): Promise<CollectionEfficiencyResult> {
    
    // Récupérer tous les remboursements de la période
    const repayments = await this.repaymentRepository.find({
      where: {
        portfolio_id: portfolioId,
        due_date: Between(periodStart, periodEnd)
      }
    });

    let dueAmount = 0;
    let collectedAmount = 0;
    let onTimeCollections = 0;
    let lateCollections = 0;

    for (const repayment of repayments) {
      const due = Number(repayment.amount);
      const paid = Number(repayment.amount || 0); // Si le statut est COMPLETED, amount = paid
      
      dueAmount += due;
      if (repayment.status === RepaymentStatus.COMPLETED) {
        collectedAmount += paid;
      }

      // Vérifier si le paiement est à temps
      if (repayment.transaction_date && repayment.due_date) {
        if (repayment.transaction_date <= repayment.due_date) {
          onTimeCollections++;
        } else {
          lateCollections++;
        }
      }
    }

    const efficiency = dueAmount > 0 ? (collectedAmount / dueAmount) * 100 : 0;
    const periodDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));

    return {
      efficiency: Number(efficiency.toFixed(2)),
      details: {
        collected_amount: collectedAmount,
        due_amount: dueAmount,
        collection_period_days: periodDays,
        on_time_collections: onTimeCollections,
        late_collections: lateCollections
      }
    };
  }

  /**
   * Calcul de la balance âgée selon OHADA
   */
  async calculateBalanceAge(
    portfolioId: string,
    calculationDate: Date = new Date()
  ): Promise<BalanceAGE> {
    
    const contracts = await this.contractRepository.find({
      where: { 
        portfolio_id: portfolioId,
        status: ContractStatus.ACTIVE
      }
    });

    let totalAmount = 0;
    let current = 0;
    let days30 = 0;
    let days60 = 0;
    let days90Plus = 0;

    for (const contract of contracts) {
      const outstandingAmount = await this.calculateOutstandingAmount(contract.id, calculationDate);
      const lastPayment = await this.getLastRepaymentDate(contract.id);
      const daysPastDue = this.calculateDaysPastDue(lastPayment, calculationDate);

      totalAmount += outstandingAmount;

      if (daysPastDue <= 30) {
        current += outstandingAmount;
      } else if (daysPastDue <= 60) {
        days30 += outstandingAmount;
      } else if (daysPastDue <= 90) {
        days60 += outstandingAmount;
      } else {
        days90Plus += outstandingAmount;
      }
    }

    return {
      current: totalAmount > 0 ? Number(((current / totalAmount) * 100).toFixed(1)) : 0,
      days30: totalAmount > 0 ? Number(((days30 / totalAmount) * 100).toFixed(1)) : 0,
      days60: totalAmount > 0 ? Number(((days60 / totalAmount) * 100).toFixed(1)) : 0,
      days90Plus: totalAmount > 0 ? Number(((days90Plus / totalAmount) * 100).toFixed(1)) : 0,
    };
  }

  /**
   * Calcul du ROA (Return on Assets)
   */
  async calculateROA(
    portfolioId: string,
    periodStart: Date,
    periodEnd: Date = new Date()
  ): Promise<number> {
    
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId }
    });

    if (!portfolio) return 0;

    // Récupérer les revenus de la période
    const revenues = await this.calculatePortfolioRevenues(portfolioId, periodStart, periodEnd);
    const totalAssets = Number(portfolio.total_amount);

    // ROA = (Revenus nets / Total des actifs) * 100
    const roa = totalAssets > 0 ? (revenues / totalAssets) * 100 : 0;
    return Number(roa.toFixed(2));
  }

  // ============ MÉTHODES UTILITAIRES ============

  private async getLastRepaymentDate(contractId: string): Promise<Date | null> {
    const lastRepayment = await this.repaymentRepository.findOne({
      where: { contract_id: contractId },
      order: { transaction_date: 'DESC' }
    });

    return lastRepayment?.transaction_date || null;
  }

  private calculateDaysPastDue(lastPaymentDate: Date | null, calculationDate: Date): number {
    if (!lastPaymentDate) return 0;
    
    const diffTime = calculationDate.getTime() - lastPaymentDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async calculateOutstandingAmount(contractId: string, asOfDate: Date): Promise<number> {
    // Implémentation simplifiée - à remplacer par la logique métier réelle
    const contract = await this.contractRepository.findOne({
      where: { id: contractId }
    });

    if (!contract) return 0;

    // Calculer le solde restant dû
    const totalPaid = await this.repaymentRepository
      .createQueryBuilder('repayment')
      .select('SUM(repayment.amount)', 'total')
      .where('repayment.contract_id = :contractId', { contractId })
      .andWhere('repayment.transaction_date <= :asOfDate', { asOfDate })
      .andWhere('repayment.status = :status', { status: RepaymentStatus.COMPLETED })
      .getRawOne();

    const paid = Number(totalPaid?.total || 0);
    const loanAmount = Number(contract.principal_amount);
    
    return Math.max(0, loanAmount - paid);
  }

  private async classifyLoanOHADA(contractId: string, calculationDate: Date): Promise<string> {
    const daysPastDue = await this.calculateDaysPastDue(
      await this.getLastRepaymentDate(contractId), 
      calculationDate
    );

    if (daysPastDue <= 30) return 'SAIN';
    if (daysPastDue <= 90) return 'SURVEILLANCE';
    if (daysPastDue <= 180) return 'DOUTEUSE';
    if (daysPastDue <= 360) return 'COMPROMISE';
    return 'IRRECUPERABLE';
  }

  private getProvisionCategoryIndex(classification: string): number {
    const mapping: Record<string, number> = {
      'SAIN': 0,
      'SURVEILLANCE': 1,
      'DOUTEUSE': 2,
      'COMPROMISE': 3,
      'IRRECUPERABLE': 4
    };
    return mapping[classification] || 0;
  }

  private assessDataQuality(totalContracts: number, nplContracts: number): number {
    // Score de qualité des données de 0 à 100
    const completenessScore = totalContracts > 0 ? 100 : 0;
    const consistencyScore = (nplContracts / Math.max(totalContracts, 1)) <= 0.2 ? 100 : 80;
    
    return Math.min(100, (completenessScore + consistencyScore) / 2);
  }

  private async calculatePortfolioRevenues(
    portfolioId: string, 
    periodStart: Date, 
    periodEnd: Date
  ): Promise<number> {
    // Calculer les revenus d'intérêts et frais de la période
    const repayments = await this.repaymentRepository.find({
      where: {
        portfolio_id: portfolioId,
        transaction_date: Between(periodStart, periodEnd),
        status: RepaymentStatus.COMPLETED
      }
    });

    return repayments.reduce((sum, repayment) => {
      const interestAmount = Number(repayment.interest_amount || 0);
      const penaltyAmount = Number(repayment.penalty_amount || 0);
      return sum + interestAmount + penaltyAmount;
    }, 0);
  }
}
