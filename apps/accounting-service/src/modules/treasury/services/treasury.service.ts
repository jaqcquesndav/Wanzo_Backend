import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, Like } from 'typeorm';
import { TreasuryTransaction, TransactionType, TransactionStatus } from '../entities/treasury-transaction.entity';
import { TreasuryAccount } from '../entities/treasury-account.entity';
import { CreateTreasuryAccountDto, UpdateTreasuryAccountDto, CreateTransactionDto, UpdateTransactionStatusDto, TransactionFilterDto } from '../dtos/treasury.dto';
import { JournalService } from '../../journals/services/journal.service';
import { JournalType } from '../../journals/entities/journal.entity';

@Injectable()
export class TreasuryService {
  constructor(
    @InjectRepository(TreasuryTransaction)
    private transactionRepository: Repository<TreasuryTransaction>,
    @InjectRepository(TreasuryAccount)
    private accountRepository: Repository<TreasuryAccount>,
    private journalService: JournalService,
  ) {}

  async createAccount(createAccountDto: CreateTreasuryAccountDto, userId: string): Promise<TreasuryAccount> {
    const kiotaId = `KIOTA-TRS-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const account = this.accountRepository.create({
      ...createAccountDto,
      kiotaId,
      createdBy: userId,
    });

    return await this.accountRepository.save(account);
  }

  async findAllAccounts(): Promise<TreasuryAccount[]> {
    return await this.accountRepository.find({
      where: { active: true },
      order: { name: 'ASC' },
    });
  }

  async findAccountById(id: string): Promise<TreasuryAccount> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Treasury account with ID ${id} not found`);
    }
    return account;
  }

  async updateAccount(id: string, updateAccountDto: UpdateTreasuryAccountDto): Promise<TreasuryAccount> {
    const account = await this.findAccountById(id);
    Object.assign(account, updateAccountDto);
    return await this.accountRepository.save(account);
  }

  async createTransaction(createTransactionDto: CreateTransactionDto, userId: string): Promise<TreasuryTransaction> {
    const account = await this.findAccountById(createTransactionDto.accountId);

    if (createTransactionDto.counterpartyAccountId) {
      await this.findAccountById(createTransactionDto.counterpartyAccountId);
    }

    const kiotaId = `KIOTA-TRX-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      kiotaId,
      createdBy: userId,
      status: TransactionStatus.PENDING,
    });

    return await this.transactionRepository.save(transaction);
  }

  async findAllTransactions(
    filters: TransactionFilterDto,
    page = 1,
    perPage = 20,
  ): Promise<{
    transactions: TreasuryTransaction[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const where: FindOptionsWhere<TreasuryTransaction> = {};

    if (filters.fiscalYear) {
      where.fiscalYear = filters.fiscalYear;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.startDate && filters.endDate) {
      where.date = Between(filters.startDate, filters.endDate);
    }

    if (filters.search) {
      where.description = Like(`%${filters.search}%`);
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where,
      relations: ['account'],
      skip: (page - 1) * perPage,
      take: perPage,
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    return {
      transactions,
      total,
      page,
      perPage,
    };
  }

  async findTransactionById(id: string): Promise<TreasuryTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['account'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async updateTransactionStatus(
    id: string,
    updateStatusDto: UpdateTransactionStatusDto,
    userId: string,
  ): Promise<TreasuryTransaction> {
    const transaction = await this.findTransactionById(id);

    if (!this.isValidStatusTransition(transaction.status, updateStatusDto.status)) {
      throw new BadRequestException(`Invalid status transition from ${transaction.status} to ${updateStatusDto.status}`);
    }

    if (updateStatusDto.status === TransactionStatus.REJECTED) {
      if (!updateStatusDto.rejectionReason) {
        throw new BadRequestException('Rejection reason is required');
      }
      transaction.rejectionReason = updateStatusDto.rejectionReason;
    }

    if (updateStatusDto.status === TransactionStatus.COMPLETED) {
      const account = await this.findAccountById(transaction.accountId);
      
      if (transaction.type === TransactionType.RECEIPT) {
        account.balance += transaction.amount;
      } else if (transaction.type === TransactionType.PAYMENT) {
        account.balance -= transaction.amount;
      }

      await this.accountRepository.save(account);

      if (transaction.type === TransactionType.TRANSFER && transaction.counterpartyAccountId) {
        const counterpartyAccount = await this.findAccountById(transaction.counterpartyAccountId);
        counterpartyAccount.balance += transaction.amount;
        await this.accountRepository.save(counterpartyAccount);
      }

      const journalEntry = await this.createJournalEntry(transaction, userId);
      transaction.journalEntryId = journalEntry.id;
    }

    transaction.status = updateStatusDto.status;
    return await this.transactionRepository.save(transaction);
  }

  private isValidStatusTransition(from: TransactionStatus, to: TransactionStatus): boolean {
    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      [TransactionStatus.PENDING]: [TransactionStatus.COMPLETED, TransactionStatus.REJECTED],
      [TransactionStatus.COMPLETED]: [TransactionStatus.CANCELLED],
      [TransactionStatus.REJECTED]: [TransactionStatus.PENDING],
      [TransactionStatus.CANCELLED]: [],
    };

    return validTransitions[from].includes(to);
  }

  async getAccountBalance(accountId: string, asOfDate?: Date): Promise<{
    currentBalance: number;
    pendingReceipts: number;
    pendingPayments: number;
    availableBalance: number;
  }> {
    const account = await this.findAccountById(accountId);

    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.accountId = :accountId', { accountId })
      .andWhere('transaction.status = :status', { status: TransactionStatus.PENDING });

    if (asOfDate) {
      query.andWhere('transaction.date <= :asOfDate', { asOfDate });
    }

    const pendingTransactions = await query.getMany();

    const pendingReceipts = pendingTransactions
      .filter(t => t.type === TransactionType.RECEIPT)
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingPayments = pendingTransactions
      .filter(t => t.type === TransactionType.PAYMENT)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      currentBalance: account.balance,
      pendingReceipts,
      pendingPayments,
      availableBalance: account.balance + pendingReceipts - pendingPayments,
    };
  }

  private async createJournalEntry(transaction: TreasuryTransaction, userId: string) {
    const journalEntry = await this.journalService.create({
      fiscalYear: transaction.fiscalYear,
      companyId: transaction.companyId!, // Added non-null assertion
      type: JournalType.BANK,
      reference: transaction.reference,
      date: new Date(),
      description: `Payment of transaction ${transaction.reference}`,
      lines: [
        {
          accountId: transaction.accountId,
          description: `Payment of transaction ${transaction.reference}`,
          debit: transaction.amount,
          credit: 0,
        },
        {
          accountId: '512000',
          description: `Payment of transaction ${transaction.reference}`,
          debit: 0,
          credit: transaction.amount,
        },
      ],
    }, userId);

    return journalEntry;
  }
}