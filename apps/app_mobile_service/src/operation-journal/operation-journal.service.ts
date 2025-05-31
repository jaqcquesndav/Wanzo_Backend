import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, MoreThanOrEqual, LessThanOrEqual, Between, FindOperator } from 'typeorm';
import { OperationJournalEntry, OperationType, ResourceAffected } from './entities/operation-journal-entry.entity';
import { CreateOperationJournalEntryDto } from './dto/create-operation-journal-entry.dto';
import { ListOperationJournalEntriesDto } from './dto/list-operation-journal-entries.dto';
import { User } from '../auth/entities/user.entity'; // Corrected import path for User entity

@Injectable()
export class OperationJournalService {
  private readonly logger = new Logger(OperationJournalService.name);

  constructor(
    @InjectRepository(OperationJournalEntry)
    private readonly operationJournalRepository: Repository<OperationJournalEntry>,
  ) {}

  async create(createOperationJournalEntryDto: CreateOperationJournalEntryDto): Promise<OperationJournalEntry> {
    const newEntryData: Partial<OperationJournalEntry> = {
      ...createOperationJournalEntryDto,
      timestamp: createOperationJournalEntryDto.timestamp || new Date(), // Default to now if not provided
      // Ensure enum values are correctly passed if they are part of the DTO
      operationType: createOperationJournalEntryDto.operationType as OperationType,
      resourceAffected: createOperationJournalEntryDto.resourceAffected as ResourceAffected,
    };
    const newEntry = this.operationJournalRepository.create(newEntryData);
    try {
      return await this.operationJournalRepository.save(newEntry);
    } catch (error) {
      this.logger.error(`Failed to create operation journal entry: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async findAll(params: ListOperationJournalEntriesDto): Promise<{ data: OperationJournalEntry[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, userId, operationType, resourceAffected, resourceId, startDate, endDate, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: FindManyOptions<OperationJournalEntry>['where'] = {};

    if (userId) {
      where.userId = userId;
    }
    if (operationType) {
      where.operationType = operationType as OperationType;
    }
    if (resourceAffected) {
      where.resourceAffected = resourceAffected as ResourceAffected;
    }
    if (resourceId) {
      where.resourceId = resourceId;
    }
    // Removed status as it's not in the entity, adjust if it was intended to be mapped to another field

    if (startDate && endDate) {
      where.timestamp = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.timestamp = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.timestamp = LessThanOrEqual(new Date(endDate));
    }
    
    const findOptions: FindManyOptions<OperationJournalEntry> = {
      take: limit,
      skip: skip,
      where,
      order: sortBy && sortOrder ? { [sortBy]: sortOrder } : { timestamp: 'DESC' },
    };

    try {
      const [data, total] = await this.operationJournalRepository.findAndCount(findOptions);
      return { data, total, page, limit };
    } catch (error) {
      this.logger.error(`Failed to list operation journal entries: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<OperationJournalEntry | null> {
    try {
      const entry = await this.operationJournalRepository.findOneBy({ id });
      return entry;
    } catch (error) {
      this.logger.error(`Failed to find operation journal entry with id ${id}: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }
}
