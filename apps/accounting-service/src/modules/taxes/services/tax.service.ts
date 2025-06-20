import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { TaxDeclaration, DeclarationType, DeclarationStatus, DeclarationPeriodicity } from '../entities/tax-declaration.entity';
import { CreateTaxDeclarationDto, UpdateTaxDeclarationDto, UpdateTaxDeclarationStatusDto, TaxFilterDto } from '../dtos/tax.dto';
import { JournalService } from '../../journals/services/journal.service';
import { JournalType } from '../../journals/entities/journal.entity';
import { CreateJournalDto } from '../../journals/dtos/journal.dto';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(TaxDeclaration)
    private taxDeclarationRepository: Repository<TaxDeclaration>,
    private journalService: JournalService,
  ) {}

  async create(createTaxDeclarationDto: CreateTaxDeclarationDto, userId: string): Promise<TaxDeclaration> {
    const kiotaId = `KIOTA-TAX-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;
    
    // Calculate amount from taxableBase and taxRate if provided
    const amount = createTaxDeclarationDto.taxableBase && createTaxDeclarationDto.taxRate 
      ? (createTaxDeclarationDto.taxableBase * createTaxDeclarationDto.taxRate) / 100
      : createTaxDeclarationDto.amount || 0;    // Set default dueDate based on type and period if not provided
    let dueDate = createTaxDeclarationDto.dueDate;
    if (!dueDate && createTaxDeclarationDto.period) {
      dueDate = this.calculateDueDate(
        createTaxDeclarationDto.type, 
        createTaxDeclarationDto.period, 
        createTaxDeclarationDto.periodicity || DeclarationPeriodicity.MONTHLY
      );
    }

    const declaration = this.taxDeclarationRepository.create({
      ...createTaxDeclarationDto,
      kiotaId,
      amount,
      dueDate,
      createdBy: userId,
      status: DeclarationStatus.DRAFT,
    });
    
    return await this.taxDeclarationRepository.save(declaration);
  }

  async findAll(
    filters: TaxFilterDto,
  ): Promise<{ declarations: TaxDeclaration[], total: number }> {
    const page = filters.page || 1;
    const perPage = filters.pageSize || 20;
    const skip = (page - 1) * perPage;

    const where: FindOptionsWhere<TaxDeclaration> = {};

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.fiscalYearId) {
      where.fiscalYearId = filters.fiscalYearId;
    }
    if (filters.period) {
      where.period = filters.period;
    }
    if (filters.search) {
      where.reference = Like(`%${filters.search}%`);
    }

    const [declarations, total] = await this.taxDeclarationRepository.findAndCount({ 
      where,
      skip,
      take: perPage,
      order: { createdAt: 'DESC' }
    });
    
    return { declarations, total };
  }

  async findById(id: string): Promise<TaxDeclaration> {
    const declaration = await this.taxDeclarationRepository.findOne({
      where: { id },
    });

    if (!declaration) {
      throw new NotFoundException(`Declaration not found`);
    }

    return declaration;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateTaxDeclarationStatusDto,
    userId: string,
  ): Promise<TaxDeclaration> {
    const declaration = await this.findById(id);

    // Verify valid status transitions
    this.validateStatusTransition(declaration.status, updateStatusDto.status);

    // Update the status
    declaration.status = updateStatusDto.status;

    if (updateStatusDto.status === DeclarationStatus.SUBMITTED) {
      declaration.submittedAt = new Date();
      declaration.submittedBy = userId;
      
      // Generate a reference if not already present
      if (!declaration.reference) {
        declaration.reference = this.generateReference(declaration);
      }
    } else if (updateStatusDto.status === DeclarationStatus.PAID) {
      declaration.paidAt = updateStatusDto.paidAt || new Date(); 
      declaration.paidBy = updateStatusDto.paidBy || userId;
      declaration.paymentReference = updateStatusDto.paymentReference;
      
      // Create a journal entry for payment
      if (declaration.amount > 0) { 
        await this.createTaxPaymentJournalEntry(declaration, userId);
      }
    } else if (updateStatusDto.status === DeclarationStatus.REJECTED) {
      declaration.rejectionReason = updateStatusDto.rejectionReason;
    }

    return await this.taxDeclarationRepository.save(declaration);
  }

  async update(id: string, updateTaxDeclarationDto: UpdateTaxDeclarationDto, userId: string): Promise<TaxDeclaration> {
    const declaration = await this.findById(id);

    // Check if the declaration is already submitted - cannot modify submitted declarations
    if (declaration.status === DeclarationStatus.SUBMITTED || declaration.status === DeclarationStatus.PAID) {
      throw new ConflictException('Cannot modify a submitted or paid declaration');
    }

    // Recalculate amount if taxableBase or taxRate changes
    if (
      (updateTaxDeclarationDto.taxableBase !== undefined || updateTaxDeclarationDto.taxRate !== undefined) &&
      updateTaxDeclarationDto.amount === undefined
    ) {
      const taxableBase = updateTaxDeclarationDto.taxableBase !== undefined ? 
        updateTaxDeclarationDto.taxableBase : declaration.taxableBase || 0;
      
      const taxRate = updateTaxDeclarationDto.taxRate !== undefined ? 
        updateTaxDeclarationDto.taxRate : declaration.taxRate || 0;
      
      updateTaxDeclarationDto.amount = (taxableBase * taxRate) / 100;
    }

    // Update dueDate if type, period or periodicity changes
    if (
      (updateTaxDeclarationDto.type !== undefined || 
       updateTaxDeclarationDto.period !== undefined || 
       updateTaxDeclarationDto.periodicity !== undefined) &&
      updateTaxDeclarationDto.dueDate === undefined
    ) {
      const type = updateTaxDeclarationDto.type || declaration.type;
      const period = updateTaxDeclarationDto.period || declaration.period;
      const periodicity = updateTaxDeclarationDto.periodicity || declaration.periodicity;
      
      updateTaxDeclarationDto.dueDate = this.calculateDueDate(type, period, periodicity);
    }

    Object.assign(declaration, updateTaxDeclarationDto);

    return await this.taxDeclarationRepository.save(declaration);
  }
  private validateStatusTransition(currentStatus: DeclarationStatus, newStatus: DeclarationStatus): void {
    // Define valid transitions
    const validTransitions: Record<string, DeclarationStatus[]> = {
      [DeclarationStatus.DRAFT]: [DeclarationStatus.PENDING, DeclarationStatus.SUBMITTED, DeclarationStatus.CANCELLED],
      [DeclarationStatus.PENDING]: [DeclarationStatus.SUBMITTED, DeclarationStatus.REJECTED, DeclarationStatus.CANCELLED],
      [DeclarationStatus.SUBMITTED]: [DeclarationStatus.PAID, DeclarationStatus.REJECTED],
      [DeclarationStatus.PAID]: [],
      [DeclarationStatus.REJECTED]: [DeclarationStatus.DRAFT],
      [DeclarationStatus.CANCELLED]: [DeclarationStatus.DRAFT],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new ConflictException(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private generateReference(declaration: TaxDeclaration): string {
    return `${declaration.type}-${declaration.period}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  private calculateDueDate(type: DeclarationType, period: string, periodicity: DeclarationPeriodicity): Date {
    const [year, month] = period.split('-').map(Number);
    let dueDate = new Date(year, month - 1); // JS months are 0-indexed
    
    // Set default due dates based on tax type
    switch (type) {
      case DeclarationType.TVA:
      case DeclarationType.IPR:
      case DeclarationType.TPI:
        // Due on the 15th of the following month
        dueDate.setMonth(dueDate.getMonth() + 1);
        dueDate.setDate(15);
        break;
      case DeclarationType.CNSS:
        // Due on the 10th of the following month
        dueDate.setMonth(dueDate.getMonth() + 1);
        dueDate.setDate(10);
        break;
      case DeclarationType.TE:
        if (periodicity === DeclarationPeriodicity.QUARTERLY) {
          // Due on the 15th of the first month of the following quarter
          dueDate.setMonth(Math.floor(month / 3) * 3 + 3);
          dueDate.setDate(15);
        }
        break;
      case DeclarationType.IB:
        if (periodicity === DeclarationPeriodicity.ANNUAL) {
          // Due on March 31st of the following year
          dueDate.setFullYear(year + 1);
          dueDate.setMonth(2); // March (0-indexed)
          dueDate.setDate(31);
        }
        break;
    }
    
    return dueDate;
  }

  private async createTaxPaymentJournalEntry(declaration: TaxDeclaration, userId: string): Promise<void> {
    // Create a journal entry for the tax payment
    const journalDto: CreateJournalDto = {
      companyId: declaration.companyId!,
      fiscalYear: declaration.fiscalYearId, 
      type: JournalType.GENERAL, 
      reference: `Tax Payment - ${declaration.type} ${declaration.period}`,
      date: new Date(),
      description: `Payment for ${declaration.type} declaration for period ${declaration.period}`,
      lines: [
        {
          accountId: this.getTaxAccountId(declaration.type), 
          debit: declaration.amount,
          credit: 0,
          description: `${declaration.type} Paid`,
        },
        {
          accountId: '521000', // Banque (Example SYSCOHADA)
          debit: 0,
          credit: declaration.amount,
          description: `Payment for ${declaration.type}`,
        },
      ],
    };
    
    const journalEntry = await this.journalService.create(journalDto, userId);
    declaration.journalEntryId = journalEntry.id; 
    await this.taxDeclarationRepository.save(declaration);
  }

  private getTaxAccountId(taxType: DeclarationType): string {
    // Get the appropriate account ID based on tax type
    // These are example SYSCOHADA account codes
    const accountMap = {
      [DeclarationType.TVA]: '445600', // TVA déductible
      [DeclarationType.IPR]: '442100', // État, impôts sur les salaires
      [DeclarationType.IB]: '444000',  // État, impôts sur les bénéfices
      [DeclarationType.CNSS]: '431000', // CNSS
      [DeclarationType.TPI]: '447100',  // Autres impôts et taxes
      [DeclarationType.TE]: '447200',   // Taxes environnementales
    };
    
    return accountMap[taxType] || '447000'; // Default to other taxes
  }

  async getTaxSummary(fiscalYearId: string, companyId: string): Promise<{
    totalDue: number;
    totalPaid: number;
    upcomingPayments: TaxDeclaration[];
    overduePayments: TaxDeclaration[];
  }> {
    const declarations = await this.taxDeclarationRepository.find({
      where: { fiscalYearId, companyId },
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

// Type augmentation for TaxFilterDto
declare module '../dtos/tax.dto' {
  interface TaxFilterDto {
    page?: number;
    pageSize?: number;
    period?: string;
    companyId?: string;
  }
}