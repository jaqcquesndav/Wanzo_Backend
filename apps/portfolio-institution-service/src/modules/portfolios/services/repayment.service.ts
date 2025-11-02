import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Repayment, RepaymentStatus, RepaymentType } from '../entities/repayment.entity';
import { Contract, ContractStatus } from '../entities/contract.entity';
import { PaymentSchedule, PaymentScheduleStatus } from '../entities/payment-schedule.entity';
import { PaymentScheduleService } from './payment-schedule.service';

export interface CreateRepaymentDto {
  contractId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  paymentType: RepaymentType;
  transactionId?: string;
  transactionDate?: Date;
  scheduleIds?: string[];  // Pour lier à des échéances spécifiques
  notes?: string;
  attachments?: any[];
}

export interface RepaymentFilterDto {
  portfolioId?: string;
  contractId?: string;
  clientId?: string;
  status?: RepaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class RepaymentService {
  constructor(
    @InjectRepository(Repayment)
    private repaymentRepository: Repository<Repayment>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(PaymentSchedule)
    private paymentScheduleRepository: Repository<PaymentSchedule>,
    private paymentScheduleService: PaymentScheduleService,
    private dataSource: DataSource
  ) {}

  async create(createRepaymentDto: CreateRepaymentDto, userId: string): Promise<Repayment> {
    // Récupérer le contrat
    const contract = await this.contractRepository.findOne({
      where: { id: createRepaymentDto.contractId }
    });
    
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${createRepaymentDto.contractId} not found`);
    }
    
    if (contract.status !== ContractStatus.ACTIVE && contract.status !== ContractStatus.RESTRUCTURED) {
      throw new BadRequestException(`Cannot register payment for contract with status ${contract.status}`);
    }
    
    // Générer une référence unique
    const reference = `PMT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Créer l'objet de remboursement
    const repaymentData = {
      reference,
      portfolio_id: contract.portfolio_id,
      contract_id: contract.id,
      client_id: contract.client_id,
      amount: createRepaymentDto.amount,
      transaction_date: createRepaymentDto.paymentDate, // Utiliser transaction_date au lieu de payment_date
      status: RepaymentStatus.PENDING,
      payment_method: createRepaymentDto.paymentMethod,
      payment_type: createRepaymentDto.paymentType,
      transaction_id: createRepaymentDto.transactionId,
      notes: createRepaymentDto.notes,
      processed_by: userId
    };
    
    const repayment = this.repaymentRepository.create(repaymentData);
    
    // Utiliser une transaction pour s'assurer que toutes les opérations se déroulent correctement
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Sauvegarder le remboursement
      const savedRepayment = await queryRunner.manager.save(repayment);
      
      // Traiter le remboursement en fonction du type
      switch (createRepaymentDto.paymentType) {
        case RepaymentType.STANDARD:
          await this.processStandardPayment(savedRepayment, createRepaymentDto.scheduleIds, queryRunner);
          break;
        case RepaymentType.PARTIAL:
          await this.processPartialPayment(savedRepayment, createRepaymentDto.scheduleIds, queryRunner);
          break;
        case RepaymentType.ADVANCE:
          await this.processAdvancePayment(savedRepayment, queryRunner);
          break;
        case RepaymentType.EARLY_PAYOFF:
          await this.processEarlyPayoff(savedRepayment, queryRunner);
          break;
      }
      
      // Mettre à jour le statut du remboursement
      savedRepayment.status = RepaymentStatus.COMPLETED;
      await queryRunner.manager.save(savedRepayment);
      
      // Mettre à jour le contrat avec les dernières informations de paiement
      await this.updateContractPaymentInfo(contract.id, createRepaymentDto.paymentDate, queryRunner);
      
      // Si tous les paiements sont effectués, marquer le contrat comme complété
      await this.checkAndUpdateContractStatus(contract.id, queryRunner);
      
      // Commit de la transaction
      await queryRunner.commitTransaction();
      
      return savedRepayment;
    } catch (error) {
      // Rollback en cas d'erreur
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Libérer les ressources
      await queryRunner.release();
    }
  }

  async findAll(filters: RepaymentFilterDto): Promise<Repayment[]> {
    const queryBuilder = this.repaymentRepository.createQueryBuilder('r');
    
    if (filters.portfolioId) {
      queryBuilder.andWhere('r.portfolio_id = :portfolioId', { portfolioId: filters.portfolioId });
    }
    
    if (filters.contractId) {
      queryBuilder.andWhere('r.contract_id = :contractId', { contractId: filters.contractId });
    }
    
    if (filters.clientId) {
      queryBuilder.andWhere('r.client_id = :clientId', { clientId: filters.clientId });
    }
    
    if (filters.status) {
      queryBuilder.andWhere('r.status = :status', { status: filters.status });
    }
    
    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere('r.transaction_date BETWEEN :dateFrom AND :dateTo', { 
        dateFrom: new Date(filters.dateFrom), 
        dateTo: new Date(filters.dateTo) 
      });
    }
    
    if (filters.search) {
      queryBuilder.andWhere(
        '(r.reference LIKE :search OR r.client_id LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }
    
    if (filters.sortBy) {
      const order = filters.sortOrder || 'asc';
      queryBuilder.orderBy(`r.${filters.sortBy}`, order.toUpperCase() as 'ASC' | 'DESC');
    } else {
      queryBuilder.orderBy('r.transaction_date', 'DESC');
    }
    
    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Repayment> {
    const repayment = await this.repaymentRepository.findOne({ 
      where: { id },
      relations: ['payment_schedules']
    });
    
    if (!repayment) {
      throw new NotFoundException(`Repayment with ID ${id} not found`);
    }
    
    return repayment;
  }

  async update(id: string, updateData: Partial<Repayment>): Promise<Repayment> {
    const repayment = await this.findOne(id);
    
    // Appliquer les mises à jour
    Object.assign(repayment, updateData);
    
    // Sauvegarder les changements
    return await this.repaymentRepository.save(repayment);
  }

  private async processStandardPayment(
    repayment: Repayment, 
    scheduleIds: string[] | undefined, 
    queryRunner: any
  ): Promise<void> {
    let scheduleItems: PaymentSchedule[];
    
    if (scheduleIds && scheduleIds.length > 0) {
      // Paiement pour des échéances spécifiques
      scheduleItems = await queryRunner.manager.find(PaymentSchedule, {
        where: { id: { $in: scheduleIds } },
        order: { due_date: 'ASC' }
      });
    } else {
      // Paiement pour les prochaines échéances impayées
      scheduleItems = await queryRunner.manager.find(PaymentSchedule, {
        where: { 
          contract_id: repayment.contract_id,
          status: PaymentScheduleStatus.PENDING
        },
        order: { due_date: 'ASC' }
      });
    }
    
    if (!scheduleItems || scheduleItems.length === 0) {
      throw new BadRequestException('No pending schedule items found');
    }
    
    // Allouer le paiement aux échéances
    let remainingAmount = repayment.amount;
    const allocation: any[] = [];
    
    for (const item of scheduleItems) {
      if (remainingAmount <= 0) break;
      
      const amountToAllocate = Math.min(remainingAmount, item.total_amount);
      
      // Mise à jour de l'échéance
      const principalRatio = item.principal_amount / item.total_amount;
      const interestRatio = item.interest_amount / item.total_amount;
      
      const principalPaid = amountToAllocate * principalRatio;
      const interestPaid = amountToAllocate * interestRatio;
      
      // Ajouter à l'allocation
      allocation.push({
        schedule_id: item.id,
        principal_amount: principalPaid,
        interest_amount: interestPaid,
        penalties_amount: 0,
        fees_amount: 0
      });
      
      // Mettre à jour l'échéance
      item.paid_amount = (item.paid_amount || 0) + amountToAllocate;
      item.remaining_amount = item.total_amount - item.paid_amount;
      
      if (item.remaining_amount <= 0) {
        item.status = PaymentScheduleStatus.PAID;
        item.payment_date = repayment.transaction_date;
      } else {
        item.status = PaymentScheduleStatus.PARTIAL;
      }
      
      await queryRunner.manager.save(item);
      
      // Mettre à jour le montant restant
      remainingAmount -= amountToAllocate;
    }
    
    // Enregistrer l'allocation
    repayment.allocation = allocation;
    
    // Lier les échéances au remboursement
    repayment.payment_schedules = scheduleItems;
    
    await queryRunner.manager.save(repayment);
  }

  private async processPartialPayment(
    repayment: Repayment, 
    scheduleIds: string[] | undefined, 
    queryRunner: any
  ): Promise<void> {
    if (!scheduleIds || scheduleIds.length === 0) {
      throw new BadRequestException('Schedule IDs are required for partial payment');
    }
    
    const scheduleItem = await queryRunner.manager.findOne(PaymentSchedule, {
      where: { id: scheduleIds[0] }
    });
    
    if (!scheduleItem) {
      throw new NotFoundException(`Schedule item with ID ${scheduleIds[0]} not found`);
    }
    
    if (repayment.amount >= scheduleItem.total_amount) {
      throw new BadRequestException('For payments equal or greater than the total amount, use standard payment type');
    }
    
    // Mise à jour de l'échéance
    const principalRatio = scheduleItem.principal_amount / scheduleItem.total_amount;
    const interestRatio = scheduleItem.interest_amount / scheduleItem.total_amount;
    
    const principalPaid = repayment.amount * principalRatio;
    const interestPaid = repayment.amount * interestRatio;
    
    // Ajouter à l'allocation
    repayment.allocation = [{
      schedule_id: scheduleItem.id,
      principal_amount: principalPaid,
      interest_amount: interestPaid,
      penalties_amount: 0,
      fees_amount: 0
    }];
    
    // Mettre à jour l'échéance
    scheduleItem.paid_amount = (scheduleItem.paid_amount || 0) + repayment.amount;
    scheduleItem.remaining_amount = scheduleItem.total_amount - scheduleItem.paid_amount;
    scheduleItem.status = PaymentScheduleStatus.PARTIAL;
    
    await queryRunner.manager.save(scheduleItem);
    
    // Lier l'échéance au remboursement
    repayment.payment_schedules = [scheduleItem];
    
    await queryRunner.manager.save(repayment);
  }

  private async processAdvancePayment(repayment: Repayment, queryRunner: any): Promise<void> {
    // Récupérer toutes les échéances impayées
    const scheduleItems = await queryRunner.manager.find(PaymentSchedule, {
      where: { 
        contract_id: repayment.contract_id,
        status: PaymentScheduleStatus.PENDING
      },
      order: { due_date: 'ASC' }
    });
    
    if (!scheduleItems || scheduleItems.length === 0) {
      throw new BadRequestException('No pending schedule items found');
    }
    
    // Allouer le paiement aux échéances futures
    let remainingAmount = repayment.amount;
    const allocation: any[] = [];
    const paidSchedules: PaymentSchedule[] = [];
    
    for (const item of scheduleItems) {
      if (remainingAmount <= 0) break;
      
      const amountToAllocate = Math.min(remainingAmount, item.total_amount);
      
      // Mise à jour de l'échéance
      const principalRatio = item.principal_amount / item.total_amount;
      const interestRatio = item.interest_amount / item.total_amount;
      
      const principalPaid = amountToAllocate * principalRatio;
      const interestPaid = amountToAllocate * interestRatio;
      
      // Ajouter à l'allocation
      allocation.push({
        schedule_id: item.id,
        principal_amount: principalPaid,
        interest_amount: interestPaid,
        penalties_amount: 0,
        fees_amount: 0
      });
      
      // Mettre à jour l'échéance
      item.paid_amount = (item.paid_amount || 0) + amountToAllocate;
      item.remaining_amount = item.total_amount - item.paid_amount;
      
      if (item.remaining_amount <= 0) {
        item.status = PaymentScheduleStatus.PAID;
        item.payment_date = repayment.transaction_date;
        paidSchedules.push(item);
      } else {
        item.status = PaymentScheduleStatus.PARTIAL;
        paidSchedules.push(item);
        break;
      }
      
      await queryRunner.manager.save(item);
      
      // Mettre à jour le montant restant
      remainingAmount -= amountToAllocate;
    }
    
    // Enregistrer l'allocation
    repayment.allocation = allocation;
    
    // Lier les échéances au remboursement
    repayment.payment_schedules = paidSchedules;
    
    await queryRunner.manager.save(repayment);
  }

  private async processEarlyPayoff(repayment: Repayment, queryRunner: any): Promise<void> {
    // Récupérer le contrat pour le montant total
    const contract = await queryRunner.manager.findOne(Contract, {
      where: { id: repayment.contract_id }
    });
    
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${repayment.contract_id} not found`);
    }
    
    // Récupérer toutes les échéances impayées
    const scheduleItems = await queryRunner.manager.find(PaymentSchedule, {
      where: { 
        contract_id: repayment.contract_id,
        status: { $in: [PaymentScheduleStatus.PENDING, PaymentScheduleStatus.PARTIAL] }
      },
      order: { due_date: 'ASC' }
    });
    
    if (!scheduleItems || scheduleItems.length === 0) {
      throw new BadRequestException('No pending schedule items found');
    }
    
    // Calculer le montant total restant
    const totalRemaining = scheduleItems.reduce((sum, item) => 
      sum + (item.remaining_amount || item.total_amount), 0);
    
    // Vérifier que le montant est suffisant
    if (repayment.amount < totalRemaining) {
      throw new BadRequestException(`Insufficient amount for early payoff. Required: ${totalRemaining}, Provided: ${repayment.amount}`);
    }
    
    // Allouer le paiement à toutes les échéances
    const allocation: any[] = [];
    
    for (const item of scheduleItems) {
      const amountToAllocate = item.remaining_amount || item.total_amount;
      
      // Mise à jour de l'échéance
      const principalRatio = item.principal_amount / item.total_amount;
      const interestRatio = item.interest_amount / item.total_amount;
      
      const principalPaid = amountToAllocate * principalRatio;
      const interestPaid = amountToAllocate * interestRatio;
      
      // Ajouter à l'allocation
      allocation.push({
        schedule_id: item.id,
        principal_amount: principalPaid,
        interest_amount: interestPaid,
        penalties_amount: 0,
        fees_amount: 0
      });
      
      // Mettre à jour l'échéance
      item.paid_amount = item.total_amount;
      item.remaining_amount = 0;
      item.status = PaymentScheduleStatus.PAID;
      item.payment_date = repayment.transaction_date;
      
      await queryRunner.manager.save(item);
    }
    
    // Enregistrer l'allocation
    repayment.allocation = allocation;
    
    // Lier les échéances au remboursement
    repayment.payment_schedules = scheduleItems;
    
    // Mettre à jour le contrat
    contract.status = ContractStatus.COMPLETED;
    await queryRunner.manager.save(contract);
    
    await queryRunner.manager.save(repayment);
  }

  private async updateContractPaymentInfo(
    contractId: string, 
    paymentDate: Date, 
    queryRunner: any
  ): Promise<void> {
    // Calculer le montant total payé
    const totalPaid = await queryRunner.manager
      .createQueryBuilder(Repayment, 'r')
      .select('SUM(r.amount)', 'total')
      .where('r.contract_id = :contractId', { contractId })
      .andWhere('r.status = :status', { status: RepaymentStatus.COMPLETED })
      .getRawOne();
    
    // Mettre à jour le contrat
    await queryRunner.manager.update(Contract, 
      { id: contractId },
      { 
        last_payment_date: paymentDate,
        total_paid_amount: totalPaid?.total || 0
      }
    );
  }

  private async checkAndUpdateContractStatus(contractId: string, queryRunner: any): Promise<void> {
    // Vérifier s'il reste des échéances impayées
    const pendingCount = await queryRunner.manager.count(PaymentSchedule, {
      where: {
        contract_id: contractId,
        status: { $in: [PaymentScheduleStatus.PENDING, PaymentScheduleStatus.PARTIAL] }
      }
    });
    
    if (pendingCount === 0) {
      // Toutes les échéances sont payées, marquer le contrat comme complété
      await queryRunner.manager.update(Contract,
        { id: contractId },
        { status: ContractStatus.COMPLETED }
      );
    }
  }
}
