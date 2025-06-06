import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, FindOptionsWhere } from 'typeorm';
import { Journal, JournalStatus, JournalType } from '../entities/journal.entity';
import { JournalLine } from '../entities/journal-line.entity';
import { CreateJournalDto, UpdateJournalStatusDto, JournalFilterDto } from '../dtos/journal.dto';
import { AccountService } from '../../accounts/services/account.service';

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

    const journal = this.journalRepository.create({
      ...createJournalDto,
      kiotaId,
      totalDebit,
      totalCredit,
      createdBy: userId,
      status: JournalStatus.DRAFT,
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

    if (filters.fiscalYear) {
      where.fiscalYear = filters.fiscalYear;
    }

    if (filters.type) {
      where.type = filters.type;
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
      [JournalStatus.PENDING]: [JournalStatus.POSTED, JournalStatus.REJECTED],
      [JournalStatus.POSTED]: [JournalStatus.CANCELLED],
      [JournalStatus.REJECTED]: [JournalStatus.DRAFT],
      [JournalStatus.CANCELLED]: [],
    };

    return validTransitions[from].includes(to);
  }

  async findByAccount(accountId: string, filters: JournalFilterDto): Promise<Journal[]> {
    const query = this.journalRepository
      .createQueryBuilder('journal')
      .leftJoinAndSelect('journal.lines', 'line')
      .where('line.accountId = :accountId', { accountId });

    if (filters.fiscalYear) {
      query.andWhere('journal.fiscalYear = :fiscalYear', { fiscalYear: filters.fiscalYear });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('journal.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.type) {
      query.andWhere('journal.type = :type', { type: filters.type });
    }

    if (filters.status) {
      query.andWhere('journal.status = :status', { status: filters.status });
    }

    return await query
      .orderBy('journal.date', 'DESC')
      .addOrderBy('journal.createdAt', 'DESC')
      .getMany();
  }

  async getAccountBalance(accountId: string, fiscalYear: string, asOfDate?: Date): Promise<{
    debit: number;
    credit: number;
    balance: number;
  }> {
    const query = this.journalLineRepository
      .createQueryBuilder('line')
      .leftJoin('line.journal', 'journal')
      .where('line.accountId = :accountId', { accountId })
      .andWhere('journal.fiscalYear = :fiscalYear', { fiscalYear })
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
      balance: totalDebit - totalCredit,
    };
  }
}