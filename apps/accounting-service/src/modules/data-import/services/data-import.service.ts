import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { JournalService } from '../../journals/services/journal.service';
import { AccountService } from '../../accounts/services/account.service';
import { ImportJournalDataDto, ImportResultDto } from '../dtos/data-import.dto';
import { JournalType } from '../../journals/entities/journal.entity';

@Injectable()
export class DataImportService {
  private readonly logger = new Logger(DataImportService.name);

  constructor(
    private journalService: JournalService,
    private accountService: AccountService,
  ) {}

  async importJournalData(
    companyId: string,
    userId: string,
    data: ImportJournalDataDto,
  ): Promise<ImportResultDto> {
    this.logger.log(`Starting journal data import for fiscal year ${data.fiscalYear}`);

    const result: ImportResultDto = {
      totalEntries: data.entries.length,
      successfulEntries: 0,
      failedEntries: 0,
      errors: [],
    };

    // Validate fiscal year
    if (!this.isValidFiscalYear(data.fiscalYear)) {
      throw new BadRequestException('Invalid fiscal year format');
    }

    // Get all account codes for validation
    const accounts = await this.accountService.findAll({});
    const validAccountCodes = new Set(accounts.accounts.map(a => a.code));

    // Process each journal entry
    for (const entry of data.entries) {
      try {
        // Validate account codes
        for (const line of entry.lines) {
          if (!validAccountCodes.has(line.accountCode)) {
            throw new Error(`Invalid account code: ${line.accountCode}`);
          }
        }

        // Map account codes to IDs
        const accountCodeToId = new Map(
          accounts.accounts.map(a => [a.code, a.id])
        );

        // Create journal entry
        await this.journalService.create({
          fiscalYear: data.fiscalYear,
          type: JournalType.GENERAL,
          date: new Date(entry.date),
          reference: entry.reference,
          description: entry.description,
          lines: entry.lines.map(line => ({
            accountId: accountCodeToId.get(line.accountCode)!,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
            metadata: line.metadata,
          })),
          metadata: entry.metadata,
        }, userId);

        result.successfulEntries++;
      } catch (error) {
        const errorMessage = (error as Error).message;
        const errorStack = (error as Error).stack;
        this.logger.error(`Error importing journal entry: ${errorMessage}`, errorStack);
        result.failedEntries++;
        result.errors.push({
          entry,
          error: (error as Error).message,
        });
      }
    }

    this.logger.log(`Import completed. Success: ${result.successfulEntries}, Failed: ${result.failedEntries}`);
    return result;
  }

  private isValidFiscalYear(fiscalYear: string): boolean {
    // Validate fiscal year format (YYYY)
    return /^\d{4}$/.test(fiscalYear);
  }
}