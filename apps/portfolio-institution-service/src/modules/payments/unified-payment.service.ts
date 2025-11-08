import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { firstValueFrom } from 'rxjs';

import { Contract } from '../portfolios/entities/contract.entity';
import { PaymentSchedule, PaymentScheduleStatus } from '../portfolios/entities/payment-schedule.entity';
import { Repayment, RepaymentStatus, RepaymentMethod, RepaymentType } from '../portfolios/entities/repayment.entity';
import { Disbursement, DisbursementStatus, PaymentMethod } from '../virements/entities/disbursement.entity';
import { PaymentOrder, PaymentOrderStatus } from '../payment-orders/entities/payment-order.entity';
import { Portfolio } from '../portfolios/entities/portfolio.entity';
import { FinancingPaymentEventService } from './financing-payment-events.service';

// DTOs pour les paiements unifiés
export interface UnifiedPaymentRequest {
  type: 'disbursement' | 'repayment';
  contractId: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'mobile_money';
  scheduleIds?: string[]; // Pour les remboursements
  paymentType?: RepaymentType; // Pour les remboursements
  reference?: string;
  description?: string;
  
  // Informations bancaires (si bank_transfer)
  bankInfo?: {
    debitAccount?: {
      accountNumber: string;
      accountName: string;
      bankName: string;
      bankCode?: string;
    };
    beneficiaryAccount: {
      accountNumber: string;
      accountName: string;
      bankName: string;
      bankCode?: string;
      swiftCode?: string;
    };
  };
  
  // Informations mobile money (si mobile_money)
  mobileMoneyInfo?: {
    phoneNumber: string;
    operator: 'AM' | 'OM' | 'WAVE' | 'MP' | 'AF';
    operatorName: string;
    accountName?: string;
  };
}

export interface SerdiPayRequest {
  amount: number;
  phone: string;
  operator: 'AM' | 'OM' | 'WAVE' | 'MP' | 'AF';
  reference: string;
  description?: string;
  contractId?: string;
  scheduleId?: string;
  callbackUrl?: string;
}

export interface SerdiPayResponse {
  success: boolean;
  transactionId: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  fees?: number;
  message?: string;
}

@Injectable()
export class UnifiedPaymentService {
  private readonly logger = new Logger(UnifiedPaymentService.name);
  private readonly paymentServiceUrl: string;
  private readonly gestionCommercialeUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
    private readonly financingEventService: FinancingPaymentEventService,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(PaymentSchedule)
    private readonly paymentScheduleRepository: Repository<PaymentSchedule>,
    @InjectRepository(Repayment)
    private readonly repaymentRepository: Repository<Repayment>,
    @InjectRepository(Disbursement)
    private readonly disbursementRepository: Repository<Disbursement>,
    @InjectRepository(PaymentOrder)
    private readonly paymentOrderRepository: Repository<PaymentOrder>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
  ) {
    this.paymentServiceUrl = this.configService.get<string>(
      'PAYMENT_SERVICE_URL',
      'http://localhost:3003'
    );
    this.gestionCommercialeUrl = this.configService.get<string>(
      'GESTION_COMMERCIALE_URL',
      'http://localhost:3001'
    );
  }

  /**
   * Traite un paiement unifié (déboursement ou remboursement)
   */
  async processUnifiedPayment(
    request: UnifiedPaymentRequest,
    userId: string
  ): Promise<any> {
    this.logger.log(`Processing unified payment: ${request.type} for contract ${request.contractId}`);

    // Valider le contrat
    const contract = await this.validateContract(request.contractId);
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let result: any;

      if (request.type === 'disbursement') {
        result = await this.processDisbursement(request, contract, userId, queryRunner);
      } else {
        result = await this.processRepayment(request, contract, userId, queryRunner);
      }

      await queryRunner.commitTransaction();
      
      // Publier événements Kafka
      await this.publishFinancingPaymentEvents(request.type, result, contract);
      
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error processing unified payment:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Traite un déboursement
   */
  private async processDisbursement(
    request: UnifiedPaymentRequest,
    contract: Contract,
    userId: string,
    queryRunner: any
  ): Promise<any> {
    this.logger.log(`Processing disbursement for contract ${contract.id}`);

    // Créer l'ordre de paiement
    const paymentOrder = await this.createPaymentOrder(contract, request.amount, userId, queryRunner);
    
    let disbursement: Disbursement;

    if (request.paymentMethod === 'mobile_money') {
      // Traitement via SerdiPay
      disbursement = await this.processSerdiPayDisbursement(
        request,
        contract,
        paymentOrder,
        userId,
        queryRunner
      );
    } else {
      // Traitement via virement bancaire
      disbursement = await this.processBankTransferDisbursement(
        request,
        contract,
        paymentOrder,
        userId,
        queryRunner
      );
    }

    // Mettre à jour l'état du contrat
    contract.status = 'active' as any;
    await queryRunner.manager.save(contract);

    return {
      type: 'disbursement',
      disbursement,
      paymentOrder,
      contract: {
        id: contract.id,
        contractNumber: contract.contract_number,
        status: contract.status
      }
    };
  }

  /**
   * Traite un remboursement
   */
  private async processRepayment(
    request: UnifiedPaymentRequest,
    contract: Contract,
    userId: string,
    queryRunner: any
  ): Promise<any> {
    this.logger.log(`Processing repayment for contract ${contract.id}`);

    let repayment: Repayment;

    if (request.paymentMethod === 'mobile_money') {
      // Traitement via SerdiPay
      repayment = await this.processSerdiPayRepayment(
        request,
        contract,
        userId,
        queryRunner
      );
    } else {
      // Traitement via virement bancaire
      repayment = await this.processBankTransferRepayment(
        request,
        contract,
        userId,
        queryRunner
      );
    }

    // Mettre à jour les échéances
    await this.updatePaymentSchedules(repayment, request, queryRunner);

    // Vérifier si le contrat est complètement payé
    await this.checkContractCompletion(contract.id, queryRunner);

    return {
      type: 'repayment',
      repayment,
      contract: {
        id: contract.id,
        contractNumber: contract.contract_number,
        status: contract.status
      }
    };
  }

  /**
   * Traite un déboursement via SerdiPay
   */
  private async processSerdiPayDisbursement(
    request: UnifiedPaymentRequest,
    contract: Contract,
    paymentOrder: PaymentOrder,
    userId: string,
    queryRunner: any
  ): Promise<Disbursement> {
    if (!request.mobileMoneyInfo) {
      throw new BadRequestException('Mobile money information required for mobile money disbursement');
    }

    // Obtenir les informations de l'entreprise bénéficiaire
    const companyInfo = await this.getCompanyInfo(contract.client_id);

    const serdiPayRequest: SerdiPayRequest = {
      amount: request.amount,
      phone: request.mobileMoneyInfo.phoneNumber,
      operator: request.mobileMoneyInfo.operator,
      reference: `DISB-${contract.contract_number}-${Date.now()}`,
      description: `Déboursement contrat ${contract.contract_number}`,
      contractId: contract.id,
      callbackUrl: `${this.configService.get('BASE_URL')}/payments/serdipay/callback/disbursement`
    };

    // Appeler SerdiPay
    const serdiPayResponse = await this.callSerdiPay(serdiPayRequest);

    // Créer le disbursement
    const disbursement = queryRunner.manager.create(Disbursement, {
      company: companyInfo.name,
      product: 'Financement Entreprise',
      amount: request.amount,
      status: serdiPayResponse.status === 'completed' ? DisbursementStatus.COMPLETED : DisbursementStatus.PENDING,
      date: new Date(),
      portfolioId: contract.portfolio_id,
      contractReference: contract.contract_number,
      transactionReference: serdiPayResponse.transactionId,
      executionDate: serdiPayResponse.status === 'completed' ? new Date() : undefined,
      debitAccount: {
        accountNumber: 'SERDIPAY_ACCOUNT',
        accountName: 'SerdiPay Disbursement Account',
        bankName: 'SerdiPay',
        bankCode: 'SERDIPAY'
      },
      beneficiary: {
        accountNumber: request.mobileMoneyInfo.phoneNumber,
        accountName: request.mobileMoneyInfo.accountName || companyInfo.name,
        bankName: request.mobileMoneyInfo.operatorName,
        companyName: companyInfo.name,
        address: companyInfo.address
      },
      paymentMethod: PaymentMethod.ELECTRONIC_TRANSFER,
      paymentReference: serdiPayResponse.reference,
      description: serdiPayRequest.description,
      createdBy: userId,
      paymentOrderId: paymentOrder.id
    });

    return await queryRunner.manager.save(disbursement);
  }

  /**
   * Traite un remboursement via SerdiPay
   */
  private async processSerdiPayRepayment(
    request: UnifiedPaymentRequest,
    contract: Contract,
    userId: string,
    queryRunner: any
  ): Promise<Repayment> {
    if (!request.mobileMoneyInfo) {
      throw new BadRequestException('Mobile money information required for mobile money repayment');
    }

    const serdiPayRequest: SerdiPayRequest = {
      amount: request.amount,
      phone: request.mobileMoneyInfo.phoneNumber,
      operator: request.mobileMoneyInfo.operator,
      reference: `REPAY-${contract.contract_number}-${Date.now()}`,
      description: `Remboursement contrat ${contract.contract_number}`,
      contractId: contract.id,
      scheduleId: request.scheduleIds?.[0],
      callbackUrl: `${this.configService.get('BASE_URL')}/payments/serdipay/callback/repayment`
    };

    // Appeler SerdiPay
    const serdiPayResponse = await this.callSerdiPay(serdiPayRequest);

    // Créer le remboursement
    const repayment = queryRunner.manager.create(Repayment, {
      reference: serdiPayRequest.reference,
      portfolio_id: contract.portfolio_id,
      contract_id: contract.id,
      client_id: contract.client_id,
      amount: request.amount,
      status: serdiPayResponse.status === 'completed' ? RepaymentStatus.COMPLETED : RepaymentStatus.PENDING,
      payment_method: RepaymentMethod.MOBILE_MONEY,
      payment_type: request.paymentType || RepaymentType.STANDARD,
      transaction_id: serdiPayResponse.transactionId,
      transaction_date: new Date(),
      processed_by: userId
    });

    return await queryRunner.manager.save(repayment);
  }

  /**
   * Traite un déboursement via virement bancaire
   */
  private async processBankTransferDisbursement(
    request: UnifiedPaymentRequest,
    contract: Contract,
    paymentOrder: PaymentOrder,
    userId: string,
    queryRunner: any
  ): Promise<Disbursement> {
    if (!request.bankInfo) {
      throw new BadRequestException('Bank information required for bank transfer disbursement');
    }

    // Obtenir les informations de l'entreprise
    const companyInfo = await this.getCompanyInfo(contract.client_id);

    const disbursement = queryRunner.manager.create(Disbursement, {
      company: companyInfo.name,
      product: 'Financement Entreprise',
      amount: request.amount,
      status: DisbursementStatus.PENDING,
      date: new Date(),
      portfolioId: contract.portfolio_id,
      contractReference: contract.contract_number,
      debitAccount: request.bankInfo.debitAccount || {
        accountNumber: 'DEFAULT_ACCOUNT',
        accountName: 'Portfolio Default Account',
        bankName: 'Default Bank',
        bankCode: 'DEFAULT'
      },
      beneficiary: {
        accountNumber: request.bankInfo.beneficiaryAccount.accountNumber,
        accountName: request.bankInfo.beneficiaryAccount.accountName,
        bankName: request.bankInfo.beneficiaryAccount.bankName,
        bankCode: request.bankInfo.beneficiaryAccount.bankCode,
        swiftCode: request.bankInfo.beneficiaryAccount.swiftCode,
        companyName: companyInfo.name,
        address: companyInfo.address
      },
      paymentMethod: PaymentMethod.TRANSFER,
      description: request.description || `Déboursement contrat ${contract.contract_number}`,
      createdBy: userId,
      paymentOrderId: paymentOrder.id
    });

    return await queryRunner.manager.save(disbursement);
  }

  /**
   * Traite un remboursement via virement bancaire
   */
  private async processBankTransferRepayment(
    request: UnifiedPaymentRequest,
    contract: Contract,
    userId: string,
    queryRunner: any
  ): Promise<Repayment> {
    const repayment = queryRunner.manager.create(Repayment, {
      reference: request.reference || `REPAY-${contract.contract_number}-${Date.now()}`,
      portfolio_id: contract.portfolio_id,
      contract_id: contract.id,
      client_id: contract.client_id,
      amount: request.amount,
      status: RepaymentStatus.PENDING,
      payment_method: RepaymentMethod.BANK_TRANSFER,
      payment_type: request.paymentType || RepaymentType.STANDARD,
      transaction_date: new Date(),
      processed_by: userId
    });

    return await queryRunner.manager.save(repayment);
  }

  /**
   * Appelle l'API SerdiPay via le payment-service
   */
  private async callSerdiPay(request: SerdiPayRequest): Promise<SerdiPayResponse> {
    try {
      this.logger.debug(`Calling SerdiPay API with request:`, request);

      const response = await firstValueFrom(
        this.httpService.post(`${this.paymentServiceUrl}/serdipay/process-financing-payment`, request, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'X-Service': 'portfolio-institution'
          }
        })
      );

      if (!response.data.success) {
        throw new BadRequestException(`SerdiPay error: ${response.data.message}`);
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`SerdiPay API call failed:`, error);
      throw new BadRequestException('Payment processing failed');
    }
  }

  /**
   * Obtient les informations d'une entreprise
   */
  private async getCompanyInfo(clientId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.gestionCommercialeUrl}/company/${clientId}`, {
          headers: {
            'X-Service': 'portfolio-institution'
          }
        })
      );

      return response.data.data || response.data;
    } catch (error) {
      this.logger.warn(`Could not fetch company info for ${clientId}, using defaults`);
      return {
        id: clientId,
        name: 'Unknown Company',
        address: 'Unknown Address'
      };
    }
  }

  /**
   * Valide un contrat
   */
  private async validateContract(contractId: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId }
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    return contract;
  }

  /**
   * Crée un ordre de paiement pour un déboursement
   */
  private async createPaymentOrder(
    contract: Contract,
    amount: number,
    userId: string,
    queryRunner: any
  ): Promise<PaymentOrder> {
    const reference = `PO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const paymentOrder = queryRunner.manager.create(PaymentOrder, {
      portfolioType: 'traditional' as any,
      fundingType: 'octroi_crédit' as any,
      amount,
      date: new Date(),
      company: `Client ${contract.client_id}`,
      status: PaymentOrderStatus.PENDING,
      reference,
      contractReference: contract.contract_number,
      product: 'Financement Entreprise',
      portfolioId: contract.portfolio_id,
      institutionId: 'default',
      createdBy: userId
    });

    return await queryRunner.manager.save(paymentOrder);
  }

  /**
   * Met à jour les échéances de paiement après un remboursement
   */
  private async updatePaymentSchedules(
    repayment: Repayment,
    request: UnifiedPaymentRequest,
    queryRunner: any
  ): Promise<void> {
    if (request.scheduleIds && request.scheduleIds.length > 0) {
      // Mise à jour d'échéances spécifiques
      const schedules = await queryRunner.manager.find(PaymentSchedule, {
        where: { id: { $in: request.scheduleIds } }
      });

      for (const schedule of schedules) {
        const amountToPay = Math.min(repayment.amount, schedule.remaining_amount || schedule.total_amount);
        
        schedule.paid_amount = (schedule.paid_amount || 0) + amountToPay;
        schedule.remaining_amount = schedule.total_amount - schedule.paid_amount;
        
        if (schedule.remaining_amount <= 0) {
          schedule.status = PaymentScheduleStatus.PAID;
          schedule.payment_date = new Date();
        } else {
          schedule.status = PaymentScheduleStatus.PARTIAL;
        }

        await queryRunner.manager.save(schedule);
      }
    } else {
      // Appliquer aux prochaines échéances impayées
      const pendingSchedules = await queryRunner.manager.find(PaymentSchedule, {
        where: {
          contract_id: repayment.contract_id,
          status: PaymentScheduleStatus.PENDING
        },
        order: { due_date: 'ASC' }
      });

      let remainingAmount = repayment.amount;

      for (const schedule of pendingSchedules) {
        if (remainingAmount <= 0) break;

        const amountToPay = Math.min(remainingAmount, schedule.total_amount);
        
        schedule.paid_amount = amountToPay;
        schedule.remaining_amount = schedule.total_amount - amountToPay;
        
        if (schedule.remaining_amount <= 0) {
          schedule.status = PaymentScheduleStatus.PAID;
          schedule.payment_date = new Date();
        } else {
          schedule.status = PaymentScheduleStatus.PARTIAL;
        }

        await queryRunner.manager.save(schedule);
        remainingAmount -= amountToPay;
      }
    }
  }

  /**
   * Vérifie si le contrat est complètement payé
   */
  private async checkContractCompletion(contractId: string, queryRunner: any): Promise<void> {
    const pendingCount = await queryRunner.manager.count(PaymentSchedule, {
      where: {
        contract_id: contractId,
        status: { $in: [PaymentScheduleStatus.PENDING, PaymentScheduleStatus.PARTIAL] }
      }
    });

    if (pendingCount === 0) {
      await queryRunner.manager.update(Contract, { id: contractId }, { status: 'completed' as any });
    }
  }

  /**
   * Publie les événements Kafka pour les paiements de financement
   */
  private async publishFinancingPaymentEvents(type: string, result: any, contract: Contract): Promise<void> {
    try {
      if (type === 'disbursement') {
        const disbursement = result.disbursement;
        const paymentOrder = result.paymentOrder;
        
        // Publier événement de déboursement initié
        const initiatedEvent = this.financingEventService.createDisbursementEvent(
          disbursement,
          contract,
          paymentOrder,
          'initiated'
        );
        await this.financingEventService.publishDisbursementInitiated(initiatedEvent);

        // Si déjà complété, publier l'événement de completion
        if (disbursement.status === 'effectué') {
          const completedEvent = this.financingEventService.createDisbursementEvent(
            disbursement,
            contract,
            paymentOrder,
            'completed'
          );
          await this.financingEventService.publishDisbursementCompleted(completedEvent);
        }
      } else {
        const repayment = result.repayment;
        
        // Publier événement de remboursement initié
        const initiatedEvent = this.financingEventService.createRepaymentEvent(
          repayment,
          contract,
          'initiated'
        );
        await this.financingEventService.publishRepaymentInitiated(initiatedEvent as any);

        // Si déjà complété, publier l'événement de completion
        if (repayment.status === 'completed') {
          const completedEvent = this.financingEventService.createRepaymentEvent(
            repayment,
            contract,
            'completed',
            { allocation: repayment.allocation }
          );
          await this.financingEventService.publishRepaymentCompleted(completedEvent as any);
        }
      }

      this.logger.log(`Published financing payment events for ${type}: ${contract.contract_number}`);
    } catch (error) {
      this.logger.error(`Failed to publish financing payment events:`, error);
    }
  }
}