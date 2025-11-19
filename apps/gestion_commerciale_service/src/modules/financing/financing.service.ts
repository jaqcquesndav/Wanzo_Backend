import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, MoreThanOrEqual, LessThanOrEqual, ILike } from 'typeorm';
import { FinancingRecord, FinancingRequestStatus, FinancingType } from './entities/financing-record.entity';
import { CreateFinancingRecordDto } from './dto/create-financing-record.dto';
import { UpdateFinancingRecordDto } from './dto/update-financing-record.dto';
import { ListFinancingRecordsDto } from './dto/list-financing-records.dto';
import { User } from '../auth/entities/user.entity';
import { EventsService } from '../events/events.service';
import { CompanyPaymentInfoService } from '../company/services/company-payment-info.service';
import { FundingRequestCreatedEvent } from '@wanzobe/shared';

@Injectable()
export class FinancingService {
  private readonly logger = new Logger(FinancingService.name);

  constructor(
    @InjectRepository(FinancingRecord)
    private readonly financingRecordRepository: Repository<FinancingRecord>,
    private readonly eventsService: EventsService,
    private readonly companyPaymentInfoService: CompanyPaymentInfoService,
  ) {}

  async create(createFinancingRecordDto: CreateFinancingRecordDto, user: User): Promise<FinancingRecord> {
    const newRecord = this.financingRecordRepository.create({
      ...createFinancingRecordDto,
      userId: user.id,
    });
    const savedRecord = await this.financingRecordRepository.save(newRecord);

    // Publier événement après création
    setImmediate(async () => {
      try {
        await this.publishFundingRequestCreatedEvent(savedRecord, user);
      } catch (error) {
        this.logger.error(
          `Failed to publish funding request created event for ${savedRecord.id}: ${error.message}`,
          error.stack
        );
      }
    });

    return savedRecord;
  }

  private async publishFundingRequestCreatedEvent(
    record: FinancingRecord,
    user: User
  ): Promise<void> {
    // Récupérer les informations de paiement de l'entreprise
    let paymentInfo: any = {
      bankAccounts: [],
      mobileMoneyAccounts: [],
      preferredMethod: 'bank' as const,
    };

    if (record.businessId) {
      try {
        const companyPaymentInfo = await this.companyPaymentInfoService.getCompanyPaymentInfo(
          record.businessId
        );
        paymentInfo = {
          bankAccounts: companyPaymentInfo.bankAccounts || [],
          mobileMoneyAccounts: companyPaymentInfo.mobileMoneyAccounts || [],
          preferredMethod: companyPaymentInfo.paymentPreferences?.preferredMethod || 'bank',
          defaultBankAccountId: companyPaymentInfo.paymentPreferences?.defaultBankAccountId,
          defaultMobileMoneyAccountId: companyPaymentInfo.paymentPreferences?.defaultMobileMoneyAccountId,
        };
      } catch (error) {
        this.logger.warn(
          `Could not retrieve payment info for company ${record.businessId}: ${error.message}`
        );
      }
    }

    const event: FundingRequestCreatedEvent = {
      eventType: 'funding.request.created',
      data: {
        financingRecordId: record.id,
        userId: user.id,
        companyId: record.businessId || user.id,
        amount: Number(record.amount),
        currency: record.currency,
        type: record.type,
        term: record.term,
        purpose: record.purpose,
        institutionId: record.institutionId,
        businessInformation: record.businessInformation,
        financialInformation: record.financialInformation,
        paymentInfo,
        documents: record.documents || [],
      },
      metadata: {
        source: 'gestion_commerciale',
        correlationId: `gc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    await this.eventsService.publishFundingRequestCreated(event);
    this.logger.log(`Published funding.request.created event for FinancingRecord ${record.id}`);
  }

  async findAll(
    listFinancingRecordsDto: ListFinancingRecordsDto,
    user: User,
  ): Promise<{ data: FinancingRecord[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', type, status, dateFrom, dateTo, search } = listFinancingRecordsDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.financingRecordRepository.createQueryBuilder('financing_record');
    queryBuilder.where('financing_record.userId = :userId', { userId: user.id });

    if (type) {
      queryBuilder.andWhere('financing_record.type = :type', { type: type as FinancingType });
    }
    if (status) {
      queryBuilder.andWhere('financing_record.status = :status', { status: status as FinancingRequestStatus });
    }
    if (dateFrom) {
      queryBuilder.andWhere('financing_record.applicationDate >= :dateFrom', { dateFrom: new Date(dateFrom) });
    }
    if (dateTo) {
      queryBuilder.andWhere('financing_record.applicationDate <= :dateTo', { dateTo: new Date(dateTo) });
    }

    if (search) {
      queryBuilder.andWhere('(financing_record.purpose ILIKE :search OR financing_record.notes ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    queryBuilder
      .orderBy(`financing_record.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string, user: User): Promise<FinancingRecord> {
    const record = await this.financingRecordRepository.findOne({ where: { id, userId: user.id } });
    if (!record) {
      throw new NotFoundException(`Financing record with ID "${id}" not found or access denied.`);
    }
    return record;
  }

  async update(id: string, updateFinancingRecordDto: UpdateFinancingRecordDto, user: User): Promise<FinancingRecord> {
    await this.findOne(id, user); // Ensures user owns the record and it exists

    const updateData: Partial<FinancingRecord> = {};
    
    // Handle simple fields
    if (updateFinancingRecordDto.type !== undefined) {
      updateData.type = updateFinancingRecordDto.type;
    }
    if (updateFinancingRecordDto.amount !== undefined) {
      updateData.amount = updateFinancingRecordDto.amount;
    }
    if (updateFinancingRecordDto.currency !== undefined) {
      updateData.currency = updateFinancingRecordDto.currency;
    }
    if (updateFinancingRecordDto.term !== undefined) {
      updateData.term = updateFinancingRecordDto.term;
    }
    if (updateFinancingRecordDto.purpose !== undefined) {
      updateData.purpose = updateFinancingRecordDto.purpose;
    }
    if (updateFinancingRecordDto.institutionId !== undefined) {
      updateData.institutionId = updateFinancingRecordDto.institutionId;
    }
    if (updateFinancingRecordDto.productId !== undefined) {
      updateData.productId = updateFinancingRecordDto.productId;
    }
    if (updateFinancingRecordDto.notes !== undefined) {
      updateData.notes = updateFinancingRecordDto.notes;
    }
    if (updateFinancingRecordDto.status !== undefined) {
      updateData.status = updateFinancingRecordDto.status;
    }
    
    // Handle date fields
    if (updateFinancingRecordDto.applicationDate !== undefined) {
      updateData.applicationDate = updateFinancingRecordDto.applicationDate;
    }
    if (updateFinancingRecordDto.lastStatusUpdateDate !== undefined) {
      updateData.lastStatusUpdateDate = updateFinancingRecordDto.lastStatusUpdateDate;
    }
    if (updateFinancingRecordDto.approvalDate !== undefined) {
      updateData.approvalDate = updateFinancingRecordDto.approvalDate;
    }
    if (updateFinancingRecordDto.disbursementDate !== undefined) {
      updateData.disbursementDate = updateFinancingRecordDto.disbursementDate;
    }

    // Handle complex nested objects
    if (updateFinancingRecordDto.businessInformation !== undefined) {
      updateData.businessInformation = updateFinancingRecordDto.businessInformation as any;
    }
    if (updateFinancingRecordDto.financialInformation !== undefined) {
      updateData.financialInformation = updateFinancingRecordDto.financialInformation as any;
    }
    if (updateFinancingRecordDto.documents !== undefined) {
      updateData.documents = updateFinancingRecordDto.documents as any;
    }

    await this.financingRecordRepository.update(id, updateData);
    return this.findOne(id, user); // Return the updated entity from the database
  }

  async remove(id: string, user: User): Promise<void> {
    await this.findOne(id, user); // Ensures user owns the record and it exists
    const result = await this.financingRecordRepository.delete({ id, userId: user.id }); // ensure delete is also scoped by userId
    if (result.affected === 0) {
      // This case should ideally be caught by findOne, but as a safeguard:
      throw new NotFoundException(`Financing record with ID "${id}" not found or operation did not affect any rows.`);
    }
  }

  /**
   * Get available financing products
   * Returns a list of financing products with their details
   */
  async getAvailableProducts(): Promise<any[]> {
    // TODO: Replace with actual database table when products are managed in DB
    // For now, return static list matching documentation
    return [
      {
        id: 'prod-business-loan-001',
        name: 'Prêt Entreprise Standard',
        description: 'Prêt destiné aux PME pour financer leurs activités courantes',
        provider: 'Wanzo Finance',
        type: FinancingType.BUSINESS_LOAN,
        minAmount: 1000.00,
        maxAmount: 50000.00,
        term: {
          min: 3,
          max: 36
        },
        interestRate: 15.5,
        currency: 'CDF',
        requirementsSummary: 'Entreprise enregistrée avec minimum 6 mois d\'activité',
        requiredDocuments: ['businessPlan', 'financialStatements', 'registrationCertificate']
      },
      {
        id: 'prod-equipment-loan-001',
        name: 'Prêt Équipement',
        description: 'Financement pour l\'achat d\'équipements professionnels',
        provider: 'Wanzo Finance',
        type: FinancingType.EQUIPMENT_LOAN,
        minAmount: 2000.00,
        maxAmount: 100000.00,
        term: {
          min: 6,
          max: 48
        },
        interestRate: 14.0,
        currency: 'CDF',
        requirementsSummary: 'Facture proforma de l\'équipement requise',
        requiredDocuments: ['proformaInvoice', 'businessPlan', 'financialStatements']
      },
      {
        id: 'prod-working-capital-001',
        name: 'Fonds de Roulement',
        description: 'Crédit de trésorerie pour financer le cycle d\'exploitation',
        provider: 'Wanzo Finance',
        type: FinancingType.WORKING_CAPITAL,
        minAmount: 500.00,
        maxAmount: 30000.00,
        term: {
          min: 1,
          max: 12
        },
        interestRate: 16.5,
        currency: 'CDF',
        requirementsSummary: 'Flux de trésorerie des 6 derniers mois requis',
        requiredDocuments: ['cashFlowStatement', 'financialStatements']
      },
      {
        id: 'prod-expansion-loan-001',
        name: 'Prêt Expansion',
        description: 'Financement pour l\'expansion ou diversification des activités',
        provider: 'Wanzo Finance',
        type: FinancingType.EXPANSION_LOAN,
        minAmount: 5000.00,
        maxAmount: 200000.00,
        term: {
          min: 12,
          max: 60
        },
        interestRate: 13.5,
        currency: 'CDF',
        requirementsSummary: 'Plan d\'expansion détaillé et bilan des 2 dernières années',
        requiredDocuments: ['expansionPlan', 'businessPlan', 'financialStatements', 'balanceSheet']
      },
      {
        id: 'prod-line-of-credit-001',
        name: 'Ligne de Crédit',
        description: 'Crédit renouvelable pour besoins ponctuels',
        provider: 'Wanzo Finance',
        type: FinancingType.LINE_OF_CREDIT,
        minAmount: 1000.00,
        maxAmount: 50000.00,
        term: {
          min: 3,
          max: 24
        },
        interestRate: 17.0,
        currency: 'CDF',
        requirementsSummary: 'Score crédit minimum de 60/100 requis',
        requiredDocuments: ['financialStatements', 'creditReport']
      }
    ];
  }
}
