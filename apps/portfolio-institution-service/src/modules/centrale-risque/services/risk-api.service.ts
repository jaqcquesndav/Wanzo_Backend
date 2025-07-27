import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  CreditRisk, 
  LeasingRisk, 
  InvestmentRisk, 
  RiskEntry, 
  RiskAlert 
} from '../entities';

@Injectable()
export class RiskApiService {
  constructor(
    @InjectRepository(CreditRisk)
    private creditRiskRepository: Repository<CreditRisk>,
    
    @InjectRepository(LeasingRisk)
    private leasingRiskRepository: Repository<LeasingRisk>,
    
    @InjectRepository(InvestmentRisk)
    private investmentRiskRepository: Repository<InvestmentRisk>,
    
    @InjectRepository(RiskEntry)
    private riskEntryRepository: Repository<RiskEntry>,
    
    @InjectRepository(RiskAlert)
    private riskAlertRepository: Repository<RiskAlert>,
  ) {}

  async findAll(companyId?: string) {
    const creditRisksQuery = this.creditRiskRepository.createQueryBuilder('creditRisk');
    const leasingRisksQuery = this.leasingRiskRepository.createQueryBuilder('leasingRisk');
    const investmentRisksQuery = this.investmentRiskRepository.createQueryBuilder('investmentRisk');
    
    if (companyId) {
      creditRisksQuery.andWhere('creditRisk.companyId = :companyId', { companyId });
      leasingRisksQuery.andWhere('leasingRisk.companyId = :companyId', { companyId });
      investmentRisksQuery.andWhere('investmentRisk.companyId = :companyId', { companyId });
    }
    
    const [creditRisks, leasingRisks, investmentRisks] = await Promise.all([
      creditRisksQuery.getMany(),
      leasingRisksQuery.getMany(),
      investmentRisksQuery.getMany(),
    ]);
    
    return {
      creditRisks,
      leasingRisks,
      investmentRisks,
    };
  }

  async findById(id: string) {
    const riskEntry = await this.riskEntryRepository.findOne({ where: { id } });
    
    if (!riskEntry) {
      throw new NotFoundException(`Risk entry with ID ${id} not found`);
    }
    
    return riskEntry;
  }
}
