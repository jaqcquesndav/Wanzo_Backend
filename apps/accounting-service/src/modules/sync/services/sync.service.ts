import { Injectable, Logger } from '@nestjs/common';
import { AccountService } from '../../accounts/services/account.service';
import { JournalService } from '../../journals/services/journal.service';
import { OrganizationService } from '../../organization/services/organization.service';
import { 
  SyncRequestDto, 
  SyncResponseDto, 
  SyncOperationType, 
  SyncEntityType, 
  SyncResultDto, 
  SyncChangeDto, 
  SyncConflictDto 
} from '../dtos/sync.dto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private accountsService: AccountService,
    private journalsService: JournalService,
    private organizationService: OrganizationService,
  ) {}

  async processSyncOperations(
    syncRequest: SyncRequestDto,
    companyId: string,
    userId: string,
  ): Promise<SyncResponseDto> {
    const results: SyncResultDto[] = [];
    const changes: SyncChangeDto[] = [];
    const conflicts: SyncConflictDto[] = [];
    
    // Process each operation
    for (const operation of syncRequest.operations) {
      try {
        const result = await this.processSyncOperation(operation, companyId, userId);
        results.push(result);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        results.push({
          success: false,
          clientId: operation.clientId,
          serverId: operation.data.id,
          entity: operation.entity,
          error: errorMessage,
        });
      }
    }
    
    // Get changes since last sync
    const changesFromServer = await this.getChangesSinceLastSync(
      syncRequest.lastSyncTimestamp,
      companyId,
    );
    
    changes.push(...changesFromServer);
    
    // Return the response
    return {
      timestamp: new Date().toISOString(),
      results,
      changes,
      conflicts,
    };
  }

  private async processSyncOperation(
    operation: SyncRequestDto['operations'][0], 
    companyId: string, 
    userId: string
  ): Promise<SyncResultDto> {
    const { type, entity, data, clientId } = operation;
    
    switch (entity) {
      case SyncEntityType.ACCOUNT:
        return this.processAccountOperation(type, data, companyId, userId, clientId);
      case SyncEntityType.JOURNAL_ENTRY:
        return this.processJournalEntryOperation(type, data, companyId, userId, clientId);
      case SyncEntityType.ORGANIZATION:
        return this.processOrganizationOperation(type, data, companyId, userId, clientId);
      default:
        throw new Error(`Unsupported entity type: ${entity}`);
    }
  }
  
  private async processAccountOperation(
    type: SyncOperationType, 
    data: any, 
    companyId: string, 
    userId: string, 
    clientId?: string
  ): Promise<SyncResultDto> {
    switch (type) {
      case SyncOperationType.CREATE:
        const account = await this.accountsService.create(data, userId);
        return {
          success: true,
          clientId,
          serverId: account.id,
          entity: SyncEntityType.ACCOUNT,
        };
      case SyncOperationType.UPDATE:
        await this.accountsService.update(data.id, data);
        return {
          success: true,
          serverId: data.id,
          entity: SyncEntityType.ACCOUNT,
        };
      case SyncOperationType.DELETE:
        await this.accountsService.delete(data.id);
        return {
          success: true,
          serverId: data.id,
          entity: SyncEntityType.ACCOUNT,
        };
      default:
        throw new Error(`Unsupported operation type: ${type}`);
    }
  }
  
  private async processJournalEntryOperation(
    type: SyncOperationType, 
    data: any, 
    companyId: string, 
    userId: string, 
    clientId?: string
  ): Promise<SyncResultDto> {
    switch (type) {
      case SyncOperationType.CREATE:
        const journal = await this.journalsService.create(data, userId);
        return {
          success: true,
          clientId,
          serverId: journal.id,
          entity: SyncEntityType.JOURNAL_ENTRY,
        };
      case SyncOperationType.UPDATE:
        // Implement this when JournalService has an update method
        this.logger.warn('Update operation not implemented for journal entries');
        return {
          success: false,
          serverId: data.id,
          entity: SyncEntityType.JOURNAL_ENTRY,
          error: 'Update operation not implemented for journal entries',
        };
      case SyncOperationType.DELETE:
        // Implement this when JournalService has a delete method
        this.logger.warn('Delete operation not implemented for journal entries');
        return {
          success: false,
          serverId: data.id,
          entity: SyncEntityType.JOURNAL_ENTRY,
          error: 'Delete operation not implemented for journal entries',
        };
      default:
        throw new Error(`Unsupported operation type: ${type}`);
    }
  }
  
  private async processOrganizationOperation(
    type: SyncOperationType, 
    data: any, 
    companyId: string, 
    userId: string, 
    clientId?: string
  ): Promise<SyncResultDto> {
    switch (type) {
      case SyncOperationType.UPDATE:
        const organization = await this.organizationService.update(companyId, data);
        return {
          success: true,
          serverId: organization.id,
          entity: SyncEntityType.ORGANIZATION,
        };
      default:
        throw new Error(`Unsupported operation type: ${type} for entity: ${SyncEntityType.ORGANIZATION}`);
    }
  }
  
  private async getChangesSinceLastSync(lastSyncTimestamp: string, companyId: string): Promise<SyncChangeDto[]> {
    const changes: SyncChangeDto[] = [];
    
    try {
      // The following methods don't exist yet, so we'll add comments for implementation
      // TODO: Implement findChangedSince in AccountService
      /* 
      const accountChanges = await this.accountsService.findChangedSince(lastSyncTimestamp, companyId);
      changes.push(...accountChanges.map(account => ({
        type: SyncOperationType.UPDATE,
        entity: SyncEntityType.ACCOUNT,
        data: account,
      })));
      */
      
      // TODO: Implement findChangedSince in JournalService
      /*
      const journalChanges = await this.journalsService.findChangedSince(lastSyncTimestamp, companyId);
      changes.push(...journalChanges.map(journal => ({
        type: SyncOperationType.UPDATE,
        entity: SyncEntityType.JOURNAL_ENTRY,
        data: journal,
      })));
      */
      
      this.logger.warn('getChangesSinceLastSync is not fully implemented');
    } catch (error: unknown) {
      this.logger.error('Error fetching changes since last sync', error instanceof Error ? error.stack : String(error));
    }
    
    return changes;
  }
}
