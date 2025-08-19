import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, FindOptionsWhere } from 'typeorm';
import { Journal, JournalStatus, JournalType, JournalSource, ValidationStatus } from '../entities/journal.entity';
import { JournalLine } from '../entities/journal-line.entity';
import { CreateJournalDto, UpdateJournalStatusDto, JournalFilterDto, UpdateJournalDto, ValidateJournalDto } from '../dtos/journal.dto';
import { AccountService } from '../../accounts/services/account.service';
import { Account } from '../../accounts/entities/account.entity'; // Added import

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(JournalLine)
    private journalLineRepository: Repository<JournalLine>,
    private accountService: AccountService,
  ) {}

  async create(createJournalDto: CreateJournalDto, userId: string): Promise<Journal> {
    // Vérifier que les comptes existent
    for (const line of createJournalDto.lines) {
      await this.accountService.findById(line.accountId);
    }

    // Vérifier l'équilibre débit/crédit
    const totalDebit = createJournalDto.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = createJournalDto.lines.reduce((sum, line) => sum + line.credit, 0);

    if (totalDebit !== totalCredit) {
      throw new BadRequestException('Journal entry must be balanced (total debit = total credit)');
    }

    const kiotaId = `KIOTA-JRN-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    // Map DTO to a partial entity object
    const journalData: Partial<Journal> = {
      date: createJournalDto.date,
      description: createJournalDto.description,
      journalType: createJournalDto.journalType, // Utilisation de journalType directement
      fiscalYearId: createJournalDto.fiscalYear, // DTO `fiscalYear` (string ID) maps to entity `fiscalYearId`
      companyId: createJournalDto.companyId,
      reference: createJournalDto.reference,
      // `lines` will be set below after creating JournalLine instances if necessary
      // metadata: createJournalDto.metadata, // metadata is not in Journal entity, but could be added if needed
      kiotaId,
      totalDebit,
      totalCredit,
      totalVat: createJournalDto.totalVat || 0, // Ajout du totalVat
      createdBy: userId,
      status: JournalStatus.DRAFT,
      // source: JournalSource.MANUAL, // Set a default source if applicable
    };

    const journal = this.journalRepository.create(journalData);

    // Transform DTO lines to JournalLine entities. 
    // This assumes JournalLineDto has all necessary fields for JournalLine entity or they are optional/defaulted.
    // It's crucial that accountId is present and valid.
    journal.lines = createJournalDto.lines.map(lineDto => {
      const line = new JournalLine();
      line.accountId = lineDto.accountId;
      line.debit = lineDto.debit;
      line.credit = lineDto.credit;
      line.description = lineDto.description;
      // line.metadata = lineDto.metadata; // If JournalLine entity has metadata
      // Map other fields from lineDto to line if they exist on JournalLine entity
      return line;
    });

    return await this.journalRepository.save(journal);
  }

  async findAll(
    filters: JournalFilterDto,
    page = 1,
    perPage = 20,
  ): Promise<{
    journals: Journal[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const where: FindOptionsWhere<Journal> = {};

    if (filters.companyId) { // Added companyId filter
      where.companyId = filters.companyId;
    }

    if (filters.fiscalYear) {
      where.fiscalYearId = filters.fiscalYear; // Corrected to fiscalYearId
    }

    if (filters.journalType) {
      where.journalType = filters.journalType; // Utilisation de journalType directement
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      where.date = Between(filters.startDate, filters.endDate);
    }

    if (filters.search) {
      where.description = Like(`%${filters.search}%`);
    }

    const [journals, total] = await this.journalRepository.findAndCount({
      where,
      relations: ['lines'],
      skip: (page - 1) * perPage,
      take: perPage,
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    return {
      journals,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<Journal> {
    const journal = await this.journalRepository.findOne({
      where: { id },
      relations: ['lines'],
    });

    if (!journal) {
      throw new NotFoundException(`Journal with ID ${id} not found`);
    }

    return journal;
  }

  async updateStatus(id: string, updateStatusDto: UpdateJournalStatusDto, userId: string): Promise<Journal> {
    const journal = await this.findById(id);

    // Vérifier les transitions d'état valides
    if (!this.isValidStatusTransition(journal.status, updateStatusDto.status)) {
      throw new BadRequestException(`Invalid status transition from ${journal.status} to ${updateStatusDto.status}`);
    }

    // Si on poste l'écriture
    if (updateStatusDto.status === JournalStatus.POSTED) {
      journal.postedBy = userId;
      journal.postedAt = new Date();
    }

    // Si on rejette l'écriture
    if (updateStatusDto.status === JournalStatus.REJECTED) {
      if (!updateStatusDto.rejectionReason) {
        throw new BadRequestException('Rejection reason is required');
      }
      journal.rejectionReason = updateStatusDto.rejectionReason;
    }

    journal.status = updateStatusDto.status;
    return await this.journalRepository.save(journal);
  }

  private isValidStatusTransition(from: JournalStatus, to: JournalStatus): boolean {
    const validTransitions: Record<JournalStatus, JournalStatus[]> = {
      [JournalStatus.DRAFT]: [JournalStatus.PENDING, JournalStatus.CANCELLED],
      [JournalStatus.PENDING]: [JournalStatus.APPROVED, JournalStatus.REJECTED], // Added APPROVED
      [JournalStatus.APPROVED]: [JournalStatus.POSTED, JournalStatus.CANCELLED], // Added rule for APPROVED
      [JournalStatus.POSTED]: [JournalStatus.CANCELLED], // Can be cancelled if posted (e.g. reversal)
      [JournalStatus.REJECTED]: [JournalStatus.DRAFT],
      [JournalStatus.CANCELLED]: [], // Typically an end state for this flow
    };

    return validTransitions[from]?.includes(to) || false; // Added null check for from
  }

  async findAccountByCode(accountCode: string, companyId: string): Promise<Account | null> {
    const account = await this.accountService.findOneByCodeAndCompany(accountCode, companyId);
    if (!account) {
      // Logger.warn(`Account with code ${accountCode} not found for company ${companyId}`, JournalService.name);
      return null;
    }
    return account;
  }

  async findByAccount(accountId: string, filters: JournalFilterDto): Promise<Journal[]> {
    const query = this.journalRepository
      .createQueryBuilder('journal')
      .leftJoinAndSelect('journal.lines', 'line')
      .where('line.accountId = :accountId', { accountId });

    if (filters.companyId) { // Added companyId filter
      query.andWhere('journal.companyId = :companyId', { companyId: filters.companyId });
    }

    if (filters.fiscalYear) {
      query.andWhere('journal.fiscalYearId = :fiscalYearId', { fiscalYearId: filters.fiscalYear }); // Corrected to fiscalYearId
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('journal.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.journalType) {
      query.andWhere('journal.journalType = :journalType', { journalType: filters.journalType });
    }

    if (filters.status) {
      query.andWhere('journal.status = :status', { status: filters.status });
    }

    return await query
      .orderBy('journal.date', 'DESC')
      .addOrderBy('journal.createdAt', 'DESC')
      .getMany();
  }

  async getAccountBalance(accountId: string, fiscalYearId: string, companyId: string, asOfDate?: Date): Promise<{ // Signature updated
    debit: number;
    credit: number;
    balance: number;
  }> {
    const query = this.journalLineRepository
      .createQueryBuilder('line')
      .leftJoin('line.journal', 'journal')
      .where('line.accountId = :accountId', { accountId })
      .andWhere('journal.companyId = :companyId', { companyId })
      .andWhere('journal.fiscalYearId = :fiscalYearId', { fiscalYearId })
      .andWhere('journal.status = :status', { status: JournalStatus.POSTED });

    if (asOfDate) {
      query.andWhere('journal.date <= :asOfDate', { asOfDate });
    }

    const result = await query
      .select([
        'SUM(line.debit) as totalDebit',
        'SUM(line.credit) as totalCredit',
      ])
      .getRawOne();

    const totalDebit = parseFloat(result.totalDebit) || 0;
    const totalCredit = parseFloat(result.totalCredit) || 0;

    return {
      debit: totalDebit,
      credit: totalCredit,
      balance: totalDebit - totalCredit, // Note: Balance calculation depends on account type (Asset/Liability/Equity vs Income/Expense)
                                        // For a generic balance, this is fine. Specific reports might need to consider account nature.
    };
  }

  async getAccountMovements(
    accountId: string,
    companyId: string,
    fiscalYearId: string,
    periodStartDate: Date,
    periodEndDate: Date,
    // status: JournalStatus = JournalStatus.POSTED, // Optional: if we need to filter by status
  ): Promise<{ totalDebit: number; totalCredit: number }> {
    const result = await this.journalLineRepository
      .createQueryBuilder('line')
      .leftJoin('line.journal', 'journal')
      .select([
        'SUM(line.debit) as totalDebit',
        'SUM(line.credit) as totalCredit',
      ])
      .where('line.accountId = :accountId', { accountId })
      .andWhere('journal.companyId = :companyId', { companyId })
      .andWhere('journal.fiscalYearId = :fiscalYearId', { fiscalYearId })
      .andWhere('journal.status = :status', { status: JournalStatus.POSTED })
      .andWhere('journal.date >= :periodStartDate', { periodStartDate })
      .andWhere('journal.date <= :periodEndDate', { periodEndDate })
      .getRawOne();

    return {
      totalDebit: parseFloat(result?.totalDebit) || 0,
      totalCredit: parseFloat(result?.totalCredit) || 0,
    };
  }

  async findLinesByAccountAndFilters(
    accountId: string,
    filters: {
      companyId: string;
      fiscalYearId: string;
      startDate?: Date;
      endDate?: Date;
      status?: JournalStatus;
    },
  ): Promise<JournalLine[]> {
    const query = this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoinAndSelect('line.journal', 'journal') // Ensure journal data is loaded
      .where('line.accountId = :accountId', { accountId })
      .andWhere('journal.companyId = :companyId', { companyId: filters.companyId })
      .andWhere('journal.fiscalYearId = :fiscalYearId', { fiscalYearId: filters.fiscalYearId });

    if (filters.status) {
      query.andWhere('journal.status = :status', { status: filters.status });
    }

    // Date filtering
    if (filters.startDate && filters.endDate) {
      query.andWhere('journal.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    } else if (filters.startDate) {
      query.andWhere('journal.date >= :startDate', { startDate: filters.startDate });
    } else if (filters.endDate) {
      query.andWhere('journal.date <= :endDate', { endDate: filters.endDate });
    }

    query.orderBy('journal.date', 'ASC').addOrderBy('journal.createdAt', 'ASC'); // Chronological order

    return await query.getMany();
  }

  /**
   * Crée une écriture comptable à partir d'une source externe (comme les opérations commerciales)
   * @param data Les données de l'écriture à créer
   * @returns L'écriture comptable créée
   */
  async createJournalEntryFromExternalSource(data: {
    externalId: string;
    externalSource: string;
    companyId: string;
    date: Date;
    description: string;
    journalType: JournalType;
    amount: number;
    currency: string;
    lines: {
      accountCode: string;
      description: string;
      debit: number;
      credit: number;
    }[];
  }): Promise<Journal> {
    try {
      // Vérifier que tous les comptes existent par code
      const accountCodes = data.lines.map(line => line.accountCode);
      const accounts = await this.accountService.findByAccountCodes(data.companyId, accountCodes);
      
      // Créer une map de codes de compte vers ID de compte
      const accountCodeMap: { [code: string]: string } = {};
      accounts.forEach(account => {
        accountCodeMap[account.code] = account.id;
      });

      // Vérifier que tous les codes de compte sont valides
      for (const line of data.lines) {
        if (!accountCodeMap[line.accountCode]) {
          throw new BadRequestException(`Le compte avec le code ${line.accountCode} n'existe pas`);
        }
      }

      // Calculer les totaux pour vérifier l'équilibre débit/crédit
      const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.001) { // Tolérance pour les erreurs d'arrondi
        throw new BadRequestException(`Déséquilibre entre débit (${totalDebit}) et crédit (${totalCredit})`);
      }

      // Créer le journal en utilisant les propriétés correctes
      const journal = new Journal();
      journal.companyId = data.companyId;
      journal.date = data.date;
      journal.description = data.description;
      journal.journalType = data.journalType;
      journal.status = JournalStatus.POSTED; // Les écritures externes sont automatiquement validées
      journal.reference = data.externalId; // Stocker l'ID externe comme référence
      journal.source = JournalSource.IMPORT; // Source externe = import
      journal.createdBy = 'system'; // Les écritures automatiques sont créées par le système
      journal.totalDebit = totalDebit;
      journal.totalCredit = totalCredit;

      // Sauvegarder le journal
      const savedJournal = await this.journalRepository.save(journal);

      // Créer les lignes du journal
      const lines = data.lines.map(line => {
        const journalLine = new JournalLine();
        journalLine.journalId = savedJournal.id;
        journalLine.accountId = accountCodeMap[line.accountCode];
        journalLine.accountCode = line.accountCode;  // Enregistrer aussi le code du compte
        journalLine.debit = line.debit;
        journalLine.credit = line.credit;
        return journalLine;
      });

      // Sauvegarder les lignes
      await this.journalLineRepository.save(lines);

      // Retourner le journal avec ses lignes
      return this.findById(savedJournal.id);
    } catch (error: any) {
      throw new BadRequestException(`Erreur lors de la création de l'écriture comptable: ${error.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Update a journal entry
   */
  async update(id: string, updateJournalDto: UpdateJournalDto, userId: string): Promise<Journal> {
    const journal = await this.findById(id);

    // Only draft or pending entries can be updated
    if (journal.status === JournalStatus.POSTED) {
      throw new BadRequestException('Cannot update posted journal entries');
    }

    // If updating lines, validate balance
    if (updateJournalDto.lines) {
      const totalDebit = updateJournalDto.lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = updateJournalDto.lines.reduce((sum, line) => sum + line.credit, 0);

      if (totalDebit !== totalCredit) {
        throw new BadRequestException('Journal entry must be balanced (total debit = total credit)');
      }

      // Verify accounts exist
      for (const line of updateJournalDto.lines) {
        await this.accountService.findById(line.accountId);
      }

      // Update totals
      journal.totalDebit = totalDebit;
      journal.totalCredit = totalCredit;

      // Remove existing lines and create new ones
      await this.journalLineRepository.delete({ journalId: id });
      
      const newLines = updateJournalDto.lines.map(lineDto => {
        const line = new JournalLine();
        line.journalId = id;
        line.accountId = lineDto.accountId;
        line.debit = lineDto.debit;
        line.credit = lineDto.credit;
        line.description = lineDto.description;
        // Store additional fields in metadata if needed
        if (lineDto.originalDebit || lineDto.originalCredit || lineDto.currency || lineDto.exchangeRate) {
          line.metadata = {
            originalDebit: lineDto.originalDebit,
            originalCredit: lineDto.originalCredit,
            currency: lineDto.currency,
            exchangeRate: lineDto.exchangeRate,
            ...lineDto.metadata
          };
        } else if (lineDto.metadata) {
          line.metadata = lineDto.metadata;
        }
        return line;
      });

      await this.journalLineRepository.save(newLines);
    }

    // Update journal fields
    if (updateJournalDto.date) journal.date = updateJournalDto.date;
    if (updateJournalDto.description) journal.description = updateJournalDto.description;
    if (updateJournalDto.reference) journal.reference = updateJournalDto.reference;
    if (updateJournalDto.journalType) journal.journalType = updateJournalDto.journalType;
    if (updateJournalDto.status) journal.status = updateJournalDto.status;

    const updatedJournal = await this.journalRepository.save(journal);
    return this.findById(updatedJournal.id);
  }

  /**
   * Delete a journal entry
   */
  async remove(id: string, userId: string): Promise<void> {
    const journal = await this.findById(id);

    // Only draft entries can be deleted
    if (journal.status !== JournalStatus.DRAFT) {
      throw new BadRequestException('Only draft journal entries can be deleted');
    }

    // Delete lines first due to foreign key constraint
    await this.journalLineRepository.delete({ journalId: id });
    
    // Delete the journal
    await this.journalRepository.delete(id);
  }

  /**
   * Validate or reject an AI-generated journal entry
   */
  async validateEntry(id: string, validateDto: ValidateJournalDto, userId: string): Promise<Journal> {
    const journal = await this.findById(id);

    // Only agent-generated entries can be validated
    if (journal.source !== JournalSource.AGENT) {
      throw new BadRequestException('Only AI-generated journal entries can be validated');
    }

    // Update validation status
    journal.validationStatus = validateDto.validationStatus === 'validated' 
      ? ValidationStatus.VALIDATED 
      : ValidationStatus.REJECTED;
    journal.validatedBy = userId;
    journal.validatedAt = new Date();

    // If rejected, set rejection reason and keep status as draft
    if (validateDto.validationStatus === 'rejected') {
      journal.rejectionReason = validateDto.rejectionReason;
      journal.status = JournalStatus.DRAFT;
    } else {
      // If validated, move to pending status for approval
      journal.status = JournalStatus.PENDING;
      journal.rejectionReason = undefined;
    }

    return this.journalRepository.save(journal);
  }
}
