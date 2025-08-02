import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Journal } from '../../journals/entities/journal.entity';
import { JournalLine } from '../../journals/entities/journal-line.entity';
import { AccountBalanceQueryDto, AccountMovementsQueryDto, TrialBalanceQueryDto } from '../dtos/ledger.dto';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Journal)
    private readonly journalRepository: Repository<Journal>,
    @InjectRepository(JournalLine)
    private readonly journalLineRepository: Repository<JournalLine>,
  ) {}

  async getAccountBalance(accountId: string, query: AccountBalanceQueryDto) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId }
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Build query for journal lines
    let queryBuilder = this.journalLineRepository
      .createQueryBuilder('line')
      .leftJoin('line.journal', 'journal')
      .where('line.accountId = :accountId', { accountId })
      .andWhere('journal.status = :status', { status: 'posted' });

    // Apply date filter if provided
    if (query.date) {
      queryBuilder = queryBuilder.andWhere('journal.date <= :date', { date: query.date });
    }

    const lines = await queryBuilder.getMany();

    // Calculate totals
    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit), 0);
    
    // Balance calculation depends on account type
    let balance: number;
    if (['asset', 'expense'].includes(account.type)) {
      balance = totalDebit - totalCredit; // Debit normal accounts
    } else {
      balance = totalCredit - totalDebit; // Credit normal accounts
    }

    return {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      accountType: account.type,
      debit: totalDebit,
      credit: totalCredit,
      balance,
      currency: query.currency || 'CDF',
      asOfDate: query.date || new Date().toISOString().split('T')[0]
    };
  }

  async getAccountMovements(accountId: string, query: AccountMovementsQueryDto) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId }
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Build query for journals with lines for this account
    let queryBuilder = this.journalRepository
      .createQueryBuilder('journal')
      .leftJoinAndSelect('journal.lines', 'lines')
      .where('lines.accountId = :accountId', { accountId });

    // Apply filters
    if (query.startDate) {
      queryBuilder = queryBuilder.andWhere('journal.date >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder = queryBuilder.andWhere('journal.date <= :endDate', { endDate: query.endDate });
    }

    if (query.journalType && query.journalType !== 'all') {
      queryBuilder = queryBuilder.andWhere('journal.journalType = :journalType', { journalType: query.journalType });
    }

    if (query.status && query.status !== 'all') {
      queryBuilder = queryBuilder.andWhere('journal.status = :status', { status: query.status });
    }

    if (query.minAmount) {
      queryBuilder = queryBuilder.andWhere('(lines.debit >= :minAmount OR lines.credit >= :minAmount)', { minAmount: query.minAmount });
    }

    if (query.maxAmount) {
      queryBuilder = queryBuilder.andWhere('(lines.debit <= :maxAmount OR lines.credit <= :maxAmount)', { maxAmount: query.maxAmount });
    }

    // Apply sorting
    const sortBy = query.sortBy || 'date';
    const sortOrder = query.sortOrder || 'desc';
    
    if (sortBy === 'date') {
      queryBuilder = queryBuilder.orderBy('journal.date', sortOrder.toUpperCase() as 'ASC' | 'DESC');
    } else if (sortBy === 'reference') {
      queryBuilder = queryBuilder.orderBy('journal.reference', sortOrder.toUpperCase() as 'ASC' | 'DESC');
    } else if (sortBy === 'amount') {
      queryBuilder = queryBuilder.orderBy('lines.debit + lines.credit', sortOrder.toUpperCase() as 'ASC' | 'DESC');
    }

    // Apply pagination
    const page = query.page || 1;
    const pageSize = query.pageSize || 50;
    const skip = (page - 1) * pageSize;

    queryBuilder = queryBuilder.skip(skip).take(pageSize);

    const [journals, total] = await queryBuilder.getManyAndCount();

    // Transform data to include only relevant line for this account
    const movements = journals.map(journal => ({
      id: journal.id,
      date: journal.date.toISOString().split('T')[0],
      journalType: journal.journalType,
      description: journal.description,
      reference: journal.reference,
      status: journal.status,
      line: journal.lines.find(line => line.accountId === accountId),
      totalDebit: Number(journal.totalDebit),
      totalCredit: Number(journal.totalCredit),
      totalVat: Number(journal.totalVat)
    }));

    return {
      data: movements,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async getTrialBalance(query: TrialBalanceQueryDto) {
    // Build query for all accounts
    let accountQuery = this.accountRepository.createQueryBuilder('account');

    if (query.fiscalYearId) {
      accountQuery = accountQuery.where('account.fiscalYearId = :fiscalYearId', { fiscalYearId: query.fiscalYearId });
    }

    if (query.accountType && query.accountType !== 'all') {
      accountQuery = accountQuery.andWhere('account.type = :accountType', { accountType: query.accountType });
    }

    const accounts = await accountQuery.getMany();

    // Calculate balances for each account
    const trialBalanceEntries: Array<{
      accountId: string;
      accountCode: string;
      accountName: string;
      accountType: string;
      debit: number;
      credit: number;
      balance: number;
      class: string;
    }> = [];

    for (const account of accounts) {
      // Build query for journal lines
      let lineQuery = this.journalLineRepository
        .createQueryBuilder('line')
        .leftJoin('line.journal', 'journal')
        .where('line.accountId = :accountId', { accountId: account.id })
        .andWhere('journal.status = :status', { status: 'posted' });

      // Apply date filters
      if (query.startDate) {
        lineQuery = lineQuery.andWhere('journal.date >= :startDate', { startDate: query.startDate });
      }

      if (query.endDate) {
        lineQuery = lineQuery.andWhere('journal.date <= :endDate', { endDate: query.endDate });
      }

      const lines = await lineQuery.getMany();

      const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit), 0);
      const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit), 0);

      // Calculate balance based on account type
      let balance: number;
      if (['asset', 'expense'].includes(account.type)) {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }

      // Include account if it has balance or if includeZeroBalance is true
      if (balance !== 0 || query.includeZeroBalance) {
        trialBalanceEntries.push({
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type,
          debit: totalDebit,
          credit: totalCredit,
          balance,
          class: account.class
        });
      }
    }

    // Sort by account code
    trialBalanceEntries.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    // Calculate totals
    const totals = {
      totalDebit: trialBalanceEntries.reduce((sum, entry) => sum + entry.debit, 0),
      totalCredit: trialBalanceEntries.reduce((sum, entry) => sum + entry.credit, 0),
      totalBalance: trialBalanceEntries.reduce((sum, entry) => sum + Math.abs(entry.balance), 0)
    };

    return {
      entries: trialBalanceEntries,
      totals,
      currency: query.currency || 'CDF',
      period: {
        startDate: query.startDate,
        endDate: query.endDate
      },
      generatedAt: new Date().toISOString()
    };
  }

  async getGeneralLedger(query: TrialBalanceQueryDto) {
    // Get all accounts with their movements
    const accounts = await this.getTrialBalance(query);
    
    const generalLedger: Array<{
      account: {
        accountId: string;
        accountCode: string;
        accountName: string;
        accountType: string;
        debit: number;
        credit: number;
        balance: number;
        class: string;
      };
      movements: any[];
    }> = [];

    for (const accountEntry of accounts.entries) {
      // Get movements for this account
      const movements = await this.getAccountMovements(accountEntry.accountId, {
        startDate: query.startDate,
        endDate: query.endDate,
        sortBy: 'date',
        sortOrder: 'asc',
        page: 1,
        pageSize: 1000 // Get all movements for general ledger
      });

      generalLedger.push({
        account: accountEntry,
        movements: movements.data
      });
    }

    return {
      accounts: generalLedger,
      totals: accounts.totals,
      currency: query.currency || 'CDF',
      period: {
        startDate: query.startDate,
        endDate: query.endDate
      },
      generatedAt: new Date().toISOString()
    };
  }

  async exportLedger(query: any) {
    // Mock implementation for export functionality
    const { format = 'json', accountIds, startDate, endDate } = query;
    
    // For now, return a mock response
    // In a real implementation, this would generate actual files
    return {
      success: true,
      message: `Ledger exported successfully in ${format} format`,
      downloadUrl: `/downloads/ledger.${format}`,
      generatedAt: new Date().toISOString()
    };
  }

  async exportBalanceSheet(query: any) {
    // Mock implementation for balance sheet export
    const { format = 'json', mode = 'SYSCOHADA', date } = query;
    
    return {
      success: true,
      message: `Balance sheet exported successfully in ${format} format`,
      downloadUrl: `/downloads/balance-sheet.${format}`,
      mode,
      date: date || new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString()
    };
  }

  async searchLedger(query: any) {
    const { 
      query: searchTerm, 
      startDate, 
      endDate, 
      accountType, 
      journalType, 
      status,
      page = 1,
      pageSize = 50
    } = query;

    if (!searchTerm) {
      return {
        results: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }

    // Build search query
    let queryBuilder = this.journalLineRepository
      .createQueryBuilder('line')
      .leftJoin('line.journal', 'journal')
      .leftJoin('line.account', 'account')
      .where('1=1'); // Base condition

    // Search in description, reference, or account name
    queryBuilder = queryBuilder.andWhere(
      '(journal.description ILIKE :search OR journal.reference ILIKE :search OR account.name ILIKE :search)',
      { search: `%${searchTerm}%` }
    );

    // Apply filters
    if (startDate) {
      queryBuilder = queryBuilder.andWhere('journal.date >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder = queryBuilder.andWhere('journal.date <= :endDate', { endDate });
    }
    if (accountType) {
      queryBuilder = queryBuilder.andWhere('account.type = :accountType', { accountType });
    }
    if (journalType) {
      queryBuilder = queryBuilder.andWhere('journal.type = :journalType', { journalType });
    }
    if (status) {
      queryBuilder = queryBuilder.andWhere('journal.status = :status', { status });
    }

    // Add pagination
    const skip = (page - 1) * pageSize;
    const [results, total] = await queryBuilder
      .select([
        'line.id',
        'line.debit',
        'line.credit',
        'journal.id',
        'journal.date',
        'journal.description',
        'journal.reference',
        'journal.type',
        'journal.status',
        'account.id',
        'account.code',
        'account.name',
        'account.type'
      ])
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}
