import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Contract, ContractStatus, AmortizationType } from '../entities/contract.entity';
import { FundingRequest, FundingRequestStatus, DurationUnit } from '../entities/funding-request.entity';
import { PaymentSchedule, PaymentScheduleStatus } from '../entities/payment-schedule.entity';
import { PaymentScheduleService, ScheduleItem } from './payment-schedule.service';

export interface CreateContractFromRequestParams {
  fundingRequestId: string;
  startDate: Date;
  endDate?: Date;
  interestRate: number;
  interestType?: string;
  frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  specialTerms?: string;
  amortizationType: AmortizationType;
  gracePeriod?: number;
  balloonPayment?: number;
  guarantees?: any[];
}

export interface ContractFilterDto {
  portfolioId?: string;
  status?: ContractStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  productType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(FundingRequest)
    private fundingRequestRepository: Repository<FundingRequest>,
    @InjectRepository(PaymentSchedule)
    private paymentScheduleRepository: Repository<PaymentSchedule>,
    private paymentScheduleService: PaymentScheduleService,
  ) {}

  async createFromFundingRequest(params: CreateContractFromRequestParams, userId: string): Promise<Contract> {
    // Récupérer la demande de financement
    const fundingRequest = await this.fundingRequestRepository.findOne({ 
      where: { id: params.fundingRequestId } 
    });
    
    if (!fundingRequest) {
      throw new NotFoundException(`Funding request with ID ${params.fundingRequestId} not found`);
    }
    
    if (fundingRequest.status !== FundingRequestStatus.APPROVED) {
      throw new BadRequestException('Cannot create contract from a non-approved funding request');
    }
    
    // Générer un numéro de contrat unique
    const contractNumber = `CNT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Créer l'objet du contrat avec les bonnes propriétés
    const contractData = {
      contract_number: contractNumber,
      portfolio_id: fundingRequest.portfolio_id,
      funding_request_id: fundingRequest.id,
      client_id: fundingRequest.client_id,
      principal_amount: fundingRequest.amount,
      interest_rate: params.interestRate,
      interest_type: params.interestType,
      term: fundingRequest.duration,
      term_unit: fundingRequest.duration_unit,
      start_date: params.startDate,
      end_date: params.endDate || this.calculateEndDate(params.startDate, fundingRequest.duration, fundingRequest.duration_unit),
      status: ContractStatus.DRAFT,
      payment_frequency: params.frequency,
      amortization_type: params.amortizationType,
      guarantees: params.guarantees || fundingRequest.proposed_guarantees || [],
      created_by: userId
    };
    
    // Créer et sauvegarder le contrat
    const contract = this.contractRepository.create(contractData);
    const savedContract = await this.contractRepository.save(contract);
    
    // Convertir la durée en nombre de périodes selon la fréquence
    let term = fundingRequest.duration;
    if (fundingRequest.duration_unit === DurationUnit.YEARS) {
      switch(params.frequency) {
        case 'monthly': term = fundingRequest.duration * 12; break;
        case 'quarterly': term = fundingRequest.duration * 4; break;
        case 'biannual': term = fundingRequest.duration * 2; break;
      }
    } else if (fundingRequest.duration_unit === DurationUnit.MONTHS) {
      switch(params.frequency) {
        case 'quarterly': term = Math.ceil(fundingRequest.duration / 3); break;
        case 'biannual': term = Math.ceil(fundingRequest.duration / 6); break;
        case 'annual': term = Math.ceil(fundingRequest.duration / 12); break;
      }
    }
    
    // Générer l'échéancier
    const scheduleParams = {
      principal: savedContract.principal_amount,
      interestRate: params.interestRate,
      term: term,
      startDate: savedContract.start_date,
      frequency: params.frequency,
      amortizationType: params.amortizationType as AmortizationType,
      gracePeriod: params.gracePeriod,
      balloonPayment: params.balloonPayment
    };
    
    const schedule = this.paymentScheduleService.generateSchedule(scheduleParams);
    
    // Sauvegarder l'échéancier
    await this.savePaymentSchedule(savedContract.id, schedule);
    
    // Mettre à jour le statut de la demande de financement
    await this.fundingRequestRepository.update(
      { id: fundingRequest.id },
      { 
        status: FundingRequestStatus.DISBURSED, 
        status_date: new Date(),
        contract_id: savedContract.id
      }
    );
    
    return savedContract;
  }

  async findAll(filters: ContractFilterDto): Promise<Contract[]> {
    const queryBuilder = this.contractRepository.createQueryBuilder('c');
    
    if (filters.portfolioId) {
      queryBuilder.andWhere('c.portfolio_id = :portfolioId', { portfolioId: filters.portfolioId });
    }
    
    if (filters.status) {
      queryBuilder.andWhere('c.status = :status', { status: filters.status });
    }
    
    if (filters.clientId) {
      queryBuilder.andWhere('c.client_id = :clientId', { clientId: filters.clientId });
    }
    
    if (filters.productType) {
      queryBuilder.andWhere('c.product_type = :productType', { productType: filters.productType });
    }
    
    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere('c.created_at BETWEEN :dateFrom AND :dateTo', { 
        dateFrom: new Date(filters.dateFrom), 
        dateTo: new Date(filters.dateTo) 
      });
    }
    
    if (filters.search) {
      queryBuilder.andWhere(
        '(c.contract_number LIKE :search OR c.client_id LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }
    
    if (filters.sortBy) {
      const order = filters.sortOrder || 'asc';
      queryBuilder.orderBy(`c.${filters.sortBy}`, order.toUpperCase() as 'ASC' | 'DESC');
    } else {
      queryBuilder.orderBy('c.created_at', 'DESC');
    }
    
    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }
    
    return contract;
  }

  async update(id: string, updateData: Partial<Contract>): Promise<Contract> {
    const contract = await this.findOne(id);
    
    // Empêcher la modification de certains champs critiques
    delete updateData.contract_number;
    delete updateData.portfolio_id;
    delete updateData.funding_request_id;
    delete updateData.client_id;
    delete updateData.principal_amount;
    
    // Appliquer les modifications
    const updatedContract = { ...contract, ...updateData };
    
    return await this.contractRepository.save(updatedContract);
  }

  async changeStatus(id: string, newStatus: ContractStatus, additionalData: any = {}): Promise<Contract> {
    const contract = await this.findOne(id);
    
    // Valider la transition d'état
    this.validateStatusTransition(contract.status, newStatus);
    
    // Mettre à jour les champs spécifiques selon le nouvel état
    const updateData: any = { status: newStatus };
    
    switch (newStatus) {
      case ContractStatus.ACTIVE:
        // Rien de spécial à faire
        break;
      case ContractStatus.SUSPENDED:
        updateData.suspension_reason = additionalData.reason;
        updateData.suspension_date = new Date();
        break;
      case ContractStatus.RESTRUCTURED:
        updateData.restructured_date = new Date();
        // TODO: Gérer la restructuration de l'échéancier
        break;
      case ContractStatus.LITIGATION:
        updateData.litigation_reason = additionalData.reason;
        updateData.litigation_date = new Date();
        break;
      case ContractStatus.DEFAULTED:
        // Marquer toutes les échéances impayées comme en défaut
        await this.updateScheduleItemsStatus(id, PaymentScheduleStatus.DEFAULTED);
        break;
      case ContractStatus.COMPLETED:
        // Vérifier que toutes les échéances sont payées
        const allPaid = await this.areAllScheduleItemsPaid(id);
        if (!allPaid) {
          throw new BadRequestException('Cannot mark contract as completed while there are unpaid schedule items');
        }
        break;
      case ContractStatus.CANCELED:
        // Vérifier qu'aucun déboursement n'a été effectué
        // TODO: Implémenter la vérification des déboursements
        break;
    }
    
    return await this.update(id, updateData);
  }

  async getSchedule(contractId: string): Promise<PaymentSchedule[]> {
    const schedule = await this.paymentScheduleRepository.find({
      where: { contract_id: contractId },
      order: { installment_number: 'ASC' }
    });
    
    return schedule;
  }

  private calculateEndDate(startDate: Date, term: number, termUnit: DurationUnit): Date {
    const endDate = new Date(startDate);
    
    switch (termUnit) {
      case DurationUnit.DAYS:
        endDate.setDate(endDate.getDate() + term);
        break;
      case DurationUnit.WEEKS:
        endDate.setDate(endDate.getDate() + (term * 7));
        break;
      case DurationUnit.MONTHS:
        endDate.setMonth(endDate.getMonth() + term);
        break;
      case DurationUnit.YEARS:
        endDate.setFullYear(endDate.getFullYear() + term);
        break;
    }
    
    return endDate;
  }

  private validateStatusTransition(currentStatus: ContractStatus, newStatus: ContractStatus): void {
    // Définir les transitions d'état valides
    const validTransitions: Record<ContractStatus, ContractStatus[]> = {
      [ContractStatus.DRAFT]: [
        ContractStatus.ACTIVE,
        ContractStatus.CANCELED
      ],
      [ContractStatus.ACTIVE]: [
        ContractStatus.SUSPENDED,
        ContractStatus.DEFAULTED,
        ContractStatus.RESTRUCTURED,
        ContractStatus.LITIGATION,
        ContractStatus.COMPLETED
      ],
      [ContractStatus.SUSPENDED]: [
        ContractStatus.ACTIVE,
        ContractStatus.DEFAULTED,
        ContractStatus.RESTRUCTURED,
        ContractStatus.LITIGATION
      ],
      [ContractStatus.RESTRUCTURED]: [
        ContractStatus.ACTIVE,
        ContractStatus.DEFAULTED,
        ContractStatus.LITIGATION,
        ContractStatus.COMPLETED
      ],
      [ContractStatus.LITIGATION]: [
        ContractStatus.ACTIVE,
        ContractStatus.DEFAULTED,
        ContractStatus.COMPLETED
      ],
      [ContractStatus.DEFAULTED]: [
        ContractStatus.ACTIVE,
        ContractStatus.RESTRUCTURED,
        ContractStatus.LITIGATION,
        ContractStatus.COMPLETED
      ],
      [ContractStatus.COMPLETED]: [],
      [ContractStatus.CANCELED]: []
    };
    
    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  private async savePaymentSchedule(contractId: string, schedule: ScheduleItem[]): Promise<void> {
    const paymentScheduleEntities = schedule.map(item => {
      return this.paymentScheduleRepository.create({
        contract_id: contractId,
        due_date: item.dueDate,
        principal_amount: item.principal,
        interest_amount: item.interest,
        total_amount: item.totalPayment,
        remaining_amount: item.totalPayment,
        status: PaymentScheduleStatus.PENDING,
        installment_number: item.installmentNumber
      });
    });
    
    await this.paymentScheduleRepository.save(paymentScheduleEntities);
  }

  private async updateScheduleItemsStatus(contractId: string, status: PaymentScheduleStatus): Promise<void> {
    await this.paymentScheduleRepository.update(
      { contract_id: contractId, status: PaymentScheduleStatus.PENDING },
      { status }
    );
  }

  private async areAllScheduleItemsPaid(contractId: string): Promise<boolean> {
    const unpaidCount = await this.paymentScheduleRepository.count({
      where: {
        contract_id: contractId,
        status: PaymentScheduleStatus.PENDING
      }
    });
    
    return unpaidCount === 0;
  }
}
