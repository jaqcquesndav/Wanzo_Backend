import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Disbursement, DisbursementStatus, DisbursementType } from '../entities/disbursement.entity';
import { Contract, ContractStatus } from '../entities/contract.entity';
import { EventsService } from '../../events/events.service';

export interface CreateDisbursementDto {
  contractId: string;
  amount: number;
  currency?: string;
  requestedDate: Date;
  disbursementType: DisbursementType;
  installmentNumber?: number;
  paymentMethod: string;
  recipientInfo: {
    account_number?: string;
    bank_name?: string;
    bank_code?: string;
    mobile_wallet?: string;
    name?: string;
  };
  notes?: string;
  documents?: any[];
}

export interface ApproveDisbursementDto {
  approvalNotes?: string;
  prerequisitesVerified?: boolean;
}

export interface ExecuteDisbursementDto {
  transactionId: string;
  transactionDate: Date;
  executionNotes?: string;
  documents?: any[];
}

export interface DisbursementFilterDto {
  portfolioId?: string;
  contractId?: string;
  clientId?: string;
  status?: DisbursementStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class DisbursementService {
  constructor(
    @InjectRepository(Disbursement)
    private disbursementRepository: Repository<Disbursement>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    private dataSource: DataSource,
    private eventsService: EventsService
  ) {}

  async create(createDisbursementDto: CreateDisbursementDto, userId: string): Promise<Disbursement> {
    // Récupérer le contrat
    const contract = await this.contractRepository.findOne({
      where: { id: createDisbursementDto.contractId }
    });
    
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${createDisbursementDto.contractId} not found`);
    }
    
    if (contract.status !== ContractStatus.ACTIVE && contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException(`Cannot create disbursement for contract with status ${contract.status}`);
    }
    
    // Vérifier le montant du déboursement
    if (createDisbursementDto.disbursementType === DisbursementType.FULL && 
        createDisbursementDto.amount !== contract.principal_amount) {
      throw new BadRequestException(
        `For full disbursement, amount must be equal to the principal amount: ${contract.principal_amount}`
      );
    }
    
    // Générer une référence unique
    const reference = `DSB-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Créer l'objet de déboursement
    const disbursement = this.disbursementRepository.create({
      reference,
      portfolio_id: contract.portfolio_id,
      contract_id: contract.id,
      client_id: contract.client_id,
      amount: createDisbursementDto.amount,
      currency: createDisbursementDto.currency || 'XOF',
      status: DisbursementStatus.DRAFT,
      disbursement_type: createDisbursementDto.disbursementType,
      installment_number: createDisbursementDto.installmentNumber,
      payment_method: createDisbursementDto.paymentMethod,
      recipient_info: createDisbursementDto.recipientInfo,
      requested_date: createDisbursementDto.requestedDate,
      notes: createDisbursementDto.notes,
      documents: createDisbursementDto.documents
    });
    
    const savedDisbursement = await this.disbursementRepository.save(disbursement);
    
    // Si le contrat est en état DRAFT, le passer en ACTIVE
    if (contract.status === ContractStatus.DRAFT) {
      await this.contractRepository.update(
        { id: contract.id },
        { status: ContractStatus.ACTIVE }
      );
    }
    
    return savedDisbursement;
  }

  async findAll(filters: DisbursementFilterDto): Promise<Disbursement[]> {
    const queryBuilder = this.disbursementRepository.createQueryBuilder('d');
    
    if (filters.portfolioId) {
      queryBuilder.andWhere('d.portfolio_id = :portfolioId', { portfolioId: filters.portfolioId });
    }
    
    if (filters.contractId) {
      queryBuilder.andWhere('d.contract_id = :contractId', { contractId: filters.contractId });
    }
    
    if (filters.clientId) {
      queryBuilder.andWhere('d.client_id = :clientId', { clientId: filters.clientId });
    }
    
    if (filters.status) {
      queryBuilder.andWhere('d.status = :status', { status: filters.status });
    }
    
    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere('d.requested_date BETWEEN :dateFrom AND :dateTo', { 
        dateFrom: new Date(filters.dateFrom), 
        dateTo: new Date(filters.dateTo) 
      });
    }
    
    if (filters.search) {
      queryBuilder.andWhere(
        '(d.reference LIKE :search OR d.client_id LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }
    
    if (filters.sortBy) {
      const order = filters.sortOrder || 'asc';
      queryBuilder.orderBy(`d.${filters.sortBy}`, order.toUpperCase() as 'ASC' | 'DESC');
    } else {
      queryBuilder.orderBy('d.requested_date', 'DESC');
    }
    
    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Disbursement> {
    const disbursement = await this.disbursementRepository.findOne({ where: { id } });
    
    if (!disbursement) {
      throw new NotFoundException(`Disbursement with ID ${id} not found`);
    }
    
    return disbursement;
  }

  async submit(id: string, userId: string): Promise<Disbursement> {
    const disbursement = await this.findOne(id);
    
    if (disbursement.status !== DisbursementStatus.DRAFT) {
      throw new BadRequestException(`Cannot submit disbursement with status ${disbursement.status}`);
    }
    
    disbursement.status = DisbursementStatus.PENDING;
    
    return await this.disbursementRepository.save(disbursement);
  }

  async approve(id: string, approveDto: ApproveDisbursementDto, userId: string): Promise<Disbursement> {
    const disbursement = await this.findOne(id);
    
    if (disbursement.status !== DisbursementStatus.PENDING) {
      throw new BadRequestException(`Cannot approve disbursement with status ${disbursement.status}`);
    }
    
    disbursement.status = DisbursementStatus.APPROVED;
    disbursement.approved_by = userId;
    disbursement.approval_date = new Date();
    disbursement.prerequisites_verified = approveDto.prerequisitesVerified;
    
    if (approveDto.approvalNotes) {
      disbursement.notes = (disbursement.notes || '') + 
        `\n[${new Date().toISOString()}] Approval notes: ${approveDto.approvalNotes}`;
    }
    
    return await this.disbursementRepository.save(disbursement);
  }

  async reject(id: string, rejectionReason: string, userId: string): Promise<Disbursement> {
    const disbursement = await this.findOne(id);
    
    if (disbursement.status !== DisbursementStatus.PENDING) {
      throw new BadRequestException(`Cannot reject disbursement with status ${disbursement.status}`);
    }
    
    disbursement.status = DisbursementStatus.REJECTED;
    disbursement.rejected_by = userId;
    disbursement.rejection_date = new Date();
    disbursement.rejection_reason = rejectionReason;
    
    return await this.disbursementRepository.save(disbursement);
  }

  async execute(id: string, executeDto: ExecuteDisbursementDto, userId: string): Promise<Disbursement> {
    const disbursement = await this.findOne(id);
    
    if (disbursement.status !== DisbursementStatus.APPROVED) {
      throw new BadRequestException(`Cannot execute disbursement with status ${disbursement.status}`);
    }
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Mettre à jour le déboursement
      disbursement.status = DisbursementStatus.COMPLETED;
      disbursement.executed_by = userId;
      disbursement.execution_date = new Date();
      disbursement.transaction_id = executeDto.transactionId;
      disbursement.transaction_date = executeDto.transactionDate;
      
      if (executeDto.executionNotes) {
        disbursement.notes = (disbursement.notes || '') + 
          `\n[${new Date().toISOString()}] Execution notes: ${executeDto.executionNotes}`;
      }
      
      if (executeDto.documents && executeDto.documents.length > 0) {
        disbursement.documents = [
          ...(disbursement.documents || []),
          ...executeDto.documents
        ];
      }
      
      const savedDisbursement = await queryRunner.manager.save(disbursement);
      
      // Publier un événement de déboursement
      // TODO: Implémenter l'événement de déboursement dans le package partagé
      /*
      await this.eventsService.publishDisbursementCompleted({
        disbursementId: savedDisbursement.id,
        contractId: savedDisbursement.contract_id,
        clientId: savedDisbursement.client_id,
        amount: savedDisbursement.amount,
        currency: savedDisbursement.currency,
        executionDate: executeDto.transactionDate,
        disbursementType: savedDisbursement.disbursement_type
      });
      */
      
      await queryRunner.commitTransaction();
      
      return savedDisbursement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancel(id: string, cancellationReason: string, userId: string): Promise<Disbursement> {
    const disbursement = await this.findOne(id);
    
    // On ne peut annuler que les déboursements en état DRAFT, PENDING ou APPROVED
    if (![DisbursementStatus.DRAFT, DisbursementStatus.PENDING, DisbursementStatus.APPROVED]
        .includes(disbursement.status)) {
      throw new BadRequestException(`Cannot cancel disbursement with status ${disbursement.status}`);
    }
    
    disbursement.status = DisbursementStatus.CANCELED;
    disbursement.notes = (disbursement.notes || '') + 
      `\n[${new Date().toISOString()}] Cancellation reason: ${cancellationReason}`;
    
    return await this.disbursementRepository.save(disbursement);
  }

  async createInstallmentPlan(
    contractId: string, 
    installments: { amount: number, date: Date }[], 
    userId: string
  ): Promise<Disbursement[]> {
    // Récupérer le contrat
    const contract = await this.contractRepository.findOne({
      where: { id: contractId }
    });
    
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }
    
    // Vérifier que la somme des montants égale le principal
    const totalAmount = installments.reduce((sum, item) => sum + item.amount, 0);
    
    if (totalAmount !== contract.principal_amount) {
      throw new BadRequestException(
        `Total installment amount (${totalAmount}) must be equal to the principal amount (${contract.principal_amount})`
      );
    }
    
    // Créer les déboursements
    const disbursements: Disbursement[] = [];
    
    for (let i = 0; i < installments.length; i++) {
      const installment = installments[i];
      
      // Générer une référence unique
      const reference = `DSB-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${i + 1}`;
      
      const disbursement = this.disbursementRepository.create({
        reference,
        portfolio_id: contract.portfolio_id,
        contract_id: contract.id,
        client_id: contract.client_id,
        amount: installment.amount,
        currency: 'XOF',
        status: DisbursementStatus.DRAFT,
        disbursement_type: DisbursementType.INSTALLMENT,
        installment_number: i + 1,
        requested_date: installment.date,
        notes: `Installment ${i + 1} of ${installments.length}`
      });
      
      disbursements.push(await this.disbursementRepository.save(disbursement));
    }
    
    return disbursements;
  }
}
