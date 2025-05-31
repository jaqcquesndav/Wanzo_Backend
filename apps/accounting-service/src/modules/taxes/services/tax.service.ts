import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { TaxDeclaration, TaxType, DeclarationStatus } from '../entities/tax-declaration.entity';
import { CreateTaxDeclarationDto, UpdateTaxDeclarationStatusDto, TaxDeclarationFilterDto } from '../dtos/tax.dto';
import { JournalService } from '../../journals/services/journal.service';
import { JournalType } from '../../journals/entities/journal.entity';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(TaxDeclaration)
    private taxDeclarationRepository: Repository<TaxDeclaration>,
    private journalService: JournalService,
  ) {}

  async create(createTaxDeclarationDto: CreateTaxDeclarationDto, userId: string): Promise<TaxDeclaration> {
    const kiotaId = `KIOTA-TAX-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    // Calculate tax amount
    const amount = (createTaxDeclarationDto.taxableBase * createTaxDeclarationDto.taxRate) / 100;

    const declaration = this.taxDeclarationRepository.create({
      ...createTaxDeclarationDto,
      kiotaId,
      amount,
      createdBy: userId,
      status: DeclarationStatus.DRAFT,
    });

    return await this.taxDeclarationRepository.save(declaration);
  }

  async findAll(
    filters: TaxDeclarationFilterDto,
    page = 1,
    perPage = 20,
  ): Promise<{
    declarations: TaxDeclaration[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const where: any = {};

    if (filters.fiscalYear) {
      where.fiscalYear = filters.fiscalYear;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.period) {
      where.period = filters.period;
    }

    if (filters.periodicity) {
      where.periodicity = filters.periodicity;
    }

    if (filters.startDate && filters.endDate) {
      where.dueDate = Between(filters.startDate, filters.endDate);
    }

    if (filters.search) {
      where.documentNumber = Like(`%${filters.search}%`);
    }

    const [declarations, total] = await this.taxDeclarationRepository.findAndCount({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });

    return {
      declarations,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<TaxDeclaration> {
    const declaration = await this.taxDeclarationRepository.findOne({
      where: { id },
    });

    if (!declaration) {
      throw new NotFoundException(`Tax declaration with ID ${id} not found`);
    }

    return declaration;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateTaxDeclarationStatusDto,
    userId: string,
  ): Promise<TaxDeclaration> {
    const declaration = await this.findById(id);

    // Validate status transition
    if (!this.isValidStatusTransition(declaration.status, updateStatusDto.status)) {
      throw new BadRequestException(`Invalid status transition from ${declaration.status} to ${updateStatusDto.status}`);
    }

    // If submitting the declaration
    if (updateStatusDto.status === DeclarationStatus.SUBMITTED) {
      declaration.submittedBy = userId;
      declaration.submittedAt = new Date();

      // Create corresponding journal entry
      const journalEntry = await this.journalService.create({
        fiscalYear: declaration.fiscalYear,
        type: JournalType.GENERAL,
        reference: declaration.documentNumber,
        date: new Date(),
        description: `Tax declaration ${declaration.type} for period ${declaration.period}`,
        lines: [
          {
            accountId: this.getTaxAccountId(declaration.type),
            description: `Tax ${declaration.type}`,
            debit: declaration.amount,
            credit: 0,
          },
          {
            accountId: '445000', // État - Taxes à payer
            description: `Tax ${declaration.type} payable`,
            debit: 0,
            credit: declaration.amount,
          },
        ],
      }, userId);

      declaration.journalEntryId = journalEntry.id;
    }

    // If marking the declaration as paid
    if (updateStatusDto.status === DeclarationStatus.PAID) {
      if (!updateStatusDto.paymentReference) {
        throw new BadRequestException('Payment reference is required');
      }

      declaration.paidBy = userId;
      declaration.paidAt = new Date();
      declaration.paymentReference = updateStatusDto.paymentReference;

      // Create journal entry for payment
      const journalEntry = await this.journalService.create({
        fiscalYear: declaration.fiscalYear,
        type: JournalType.BANK,
        reference: updateStatusDto.paymentReference,
        date: new Date(),
        description: `Payment of tax declaration ${declaration.type} for period ${declaration.period}`,
        lines: [
          {
            accountId: '445000', // État - Taxes à payer
            description: `Payment of tax ${declaration.type}`,
            debit: declaration.amount,
            credit: 0,
          },
          {
            accountId: '512000', // Banque
            description: `Payment of tax ${declaration.type}`,
            debit: 0,
            credit: declaration.amount,
          },
        ],
      }, userId);

      declaration.journalEntryId = journalEntry.id;
    }

    // If rejecting the declaration
    if (updateStatusDto.status === DeclarationStatus.REJECTED) {
      if (!updateStatusDto.rejectionReason) {
        throw new BadRequestException('Rejection reason is required');
      }
      declaration.rejectionReason = updateStatusDto.rejectionReason;
    }

    declaration.status = updateStatusDto.status;
    return await this.taxDeclarationRepository.save(declaration);
  }

  private isValidStatusTransition(from: DeclarationStatus, to: DeclarationStatus): boolean {
    const validTransitions: Record<DeclarationStatus, DeclarationStatus[]> = {
      [DeclarationStatus.DRAFT]: [DeclarationStatus.PENDING, DeclarationStatus.CANCELLED],
      [DeclarationStatus.PENDING]: [DeclarationStatus.SUBMITTED, DeclarationStatus.REJECTED],
      [DeclarationStatus.SUBMITTED]: [DeclarationStatus.PAID, DeclarationStatus.REJECTED],
      [DeclarationStatus.PAID]: [],
      [DeclarationStatus.REJECTED]: [DeclarationStatus.DRAFT],
      [DeclarationStatus.CANCELLED]: [],
    };

    return validTransitions[from].includes(to);
  }

  private getTaxAccountId(taxType: TaxType): string {
    const accountMapping: Record<TaxType, string> = {
      [TaxType.TVA]: '445700',
      [TaxType.IS]: '444000',
      [TaxType.IPR]: '447100',
      [TaxType.CNSS]: '447200',
      [TaxType.INPP]: '447300',
      [TaxType.ONEM]: '447400',
      [TaxType.OTHER]: '448000',
    };

    return accountMapping[taxType];
  }

  async getTaxSummary(fiscalYear: string): Promise<{
    totalDue: number;
    totalPaid: number;
    upcomingPayments: TaxDeclaration[];
    overduePayments: TaxDeclaration[];
  }> {
    const declarations = await this.taxDeclarationRepository.find({
      where: { fiscalYear },
    });

    const totalDue = declarations
      .filter(d => d.status === DeclarationStatus.SUBMITTED)
      .reduce((sum, d) => sum + d.amount, 0);

    const totalPaid = declarations
      .filter(d => d.status === DeclarationStatus.PAID)
      .reduce((sum, d) => sum + d.amount, 0);

    const now = new Date();
    const upcomingPayments = declarations
      .filter(d => 
        d.status === DeclarationStatus.SUBMITTED && 
        d.dueDate > now
      )
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    const overduePayments = declarations
      .filter(d => 
        d.status === DeclarationStatus.SUBMITTED && 
        d.dueDate <= now
      )
      .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());

    return {
      totalDue,
      totalPaid,
      upcomingPayments,
      overduePayments,
    };
  }
}