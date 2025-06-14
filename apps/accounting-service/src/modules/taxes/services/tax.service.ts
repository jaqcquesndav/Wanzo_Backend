import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm'; // Added FindOptionsWhere and Like
import { TaxDeclaration, DeclarationType, DeclarationStatus } from '../entities/tax-declaration.entity';
import { CreateTaxDeclarationDto, UpdateTaxDeclarationDto, UpdateTaxDeclarationStatusDto, TaxFilterDto } from '../dtos/tax.dto'; // Changed TaxDeclarationFilterDto to TaxFilterDto
import { JournalService } from '../../journals/services/journal.service';
import { JournalType } from '../../journals/entities/journal.entity';
import { CreateJournalDto } from '../../journals/dtos/journal.dto'; // Added CreateJournalDto
import { DeclarationPeriodicity } from '../entities/tax-declaration.entity'; // Added import

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(TaxDeclaration)
    private taxDeclarationRepository: Repository<TaxDeclaration>,
    private journalService: JournalService,
  ) {}

  async create(createTaxDeclarationDto: CreateTaxDeclarationDto, userId: string): Promise<TaxDeclaration> { // Removed companyId from parameters
    const kiotaId = `KIOTA-TAX-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;
    
    const amount = (createTaxDeclarationDto.taxableBase * createTaxDeclarationDto.taxRate) / 100;

    const declaration = this.taxDeclarationRepository.create({
      ...createTaxDeclarationDto,
      kiotaId, // Added kiotaId
      amount, // Calculated amount
      createdBy: userId,
      // companyId is now part of createTaxDeclarationDto
      status: DeclarationStatus.DRAFT,
    });
    return await this.taxDeclarationRepository.save(declaration);
  }

  async findAll(
    filters: TaxFilterDto, // Changed TaxDeclarationFilterDto to TaxFilterDto
  ): Promise<{ declarations: TaxDeclaration[], total: number, page?: number, perPage?: number }> { // Added pagination and total count
    const page = filters.page || 1;
    const perPage = filters.perPage || 20;
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
    if (filters.search) {
      // Assuming search applies to reference or description if they exist on TaxDeclaration
      // For now, let's assume it applies to 'reference' if it's added to the entity
      // where.reference = Like(`%${filters.search}%`); 
      // Or if description is added:
      // where.description = Like(`%${filters.search}%`);
    }

    const [declarations, total] = await this.taxDeclarationRepository.findAndCount({ 
      where,
      skip,
      take: perPage,
      order: { createdAt: 'DESC' } // Example ordering
    });
    return { declarations, total, page, perPage };
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

    // Basic state machine for status transitions (can be expanded)
    declaration.status = updateStatusDto.status;

    if (updateStatusDto.status === DeclarationStatus.SUBMITTED) {
      declaration.submittedAt = new Date();
      declaration.submittedBy = userId;
    } else if (updateStatusDto.status === DeclarationStatus.PAID) {
      declaration.paidAt = updateStatusDto.paidAt || new Date(); 
      declaration.paidBy = updateStatusDto.paidBy || userId;
      declaration.paymentReference = updateStatusDto.paymentReference;
      
      // Potentially create a journal entry for payment
      // Example: only for TVA, and if amount is present
      if (declaration.type === DeclarationType.TVA && declaration.amount) { 
        await this.createTaxPaymentJournalEntry(declaration, userId);
      }
    } else if (updateStatusDto.status === DeclarationStatus.REJECTED) {
      declaration.rejectionReason = updateStatusDto.rejectionReason;
    }

    return await this.taxDeclarationRepository.save(declaration);
  }

  async update(id: string, updateTaxDeclarationDto: UpdateTaxDeclarationDto, userId: string): Promise<TaxDeclaration> {
    const declaration = await this.findById(id);

    // Recalculate amount if taxableBase or taxRate changes
    if (updateTaxDeclarationDto.taxableBase !== undefined && updateTaxDeclarationDto.taxRate !== undefined) {
      updateTaxDeclarationDto.amount = (updateTaxDeclarationDto.taxableBase * updateTaxDeclarationDto.taxRate) / 100;
    } else if (updateTaxDeclarationDto.taxableBase !== undefined && declaration.taxRate !== undefined) {
      updateTaxDeclarationDto.amount = (updateTaxDeclarationDto.taxableBase * declaration.taxRate) / 100;
    } else if (updateTaxDeclarationDto.taxRate !== undefined && declaration.taxableBase !== undefined) { // taxableBase should exist on entity
      // Assuming taxableBase exists on declaration entity, if not, this needs adjustment
      // updateTaxDeclarationDto.amount = (declaration.taxableBase * updateTaxDeclarationDto.taxRate) / 100; 
    }


    Object.assign(declaration, updateTaxDeclarationDto);
    declaration.updatedAt = new Date(); // Manually update updatedAt if not auto-updated by TypeORM save

    return await this.taxDeclarationRepository.save(declaration);
  }


  private async createTaxPaymentJournalEntry(declaration: TaxDeclaration, userId: string): Promise<void> {
    // This is a simplified example. You'll need to adjust account IDs and logic.
    const journalDto: CreateJournalDto = {
      companyId: declaration.companyId!,
      fiscalYear: declaration.fiscalYearId, 
      type: JournalType.GENERAL, 
      reference: `Tax Payment - ${declaration.type} ${declaration.period}`,
      date: new Date(),
      description: `Payment for ${declaration.type} declaration for period ${declaration.period}`,
      lines: [
        {
          accountId: '445000', // État, TVA à payer (Example SYSCOHADA)
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

  async getTaxSummary(fiscalYearId: string, companyId: string): Promise<{ // Added companyId, changed fiscalYear to fiscalYearId
    totalDue: number;
    totalPaid: number;
    upcomingPayments: TaxDeclaration[];
    overduePayments: TaxDeclaration[];
  }> {
    const declarations = await this.taxDeclarationRepository.find({
      where: { fiscalYearId, companyId }, // Use fiscalYearId and companyId
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
declare module '../dtos/tax.dto' { // Module augmentation for TaxFilterDto
  interface TaxFilterDto {
    page?: number;
    perPage?: number;
    periodicity?: DeclarationPeriodicity; // Added from previous version of findAll
  }
}