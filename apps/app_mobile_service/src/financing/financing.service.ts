import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, MoreThanOrEqual, LessThanOrEqual, ILike } from 'typeorm';
import { FinancingRecord, FinancingRecordStatus, FinancingRecordType } from './entities/financing-record.entity';
import { CreateFinancingRecordDto, RelatedDocumentDto } from './dto/create-financing-record.dto';
import { UpdateFinancingRecordDto } from './dto/update-financing-record.dto';
import { ListFinancingRecordsDto } from './dto/list-financing-records.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class FinancingService {
  constructor(
    @InjectRepository(FinancingRecord)
    private readonly financingRecordRepository: Repository<FinancingRecord>,
  ) {}

  async create(createFinancingRecordDto: CreateFinancingRecordDto, user: User): Promise<FinancingRecord> {
    const newRecord = this.financingRecordRepository.create({
      ...createFinancingRecordDto,
      date: new Date(createFinancingRecordDto.date), // Convert ISO string to Date
      userId: user.id,
      // relatedDocuments will be mapped directly if the structure matches
    });
    return this.financingRecordRepository.save(newRecord);
  }

  async findAll(
    listFinancingRecordsDto: ListFinancingRecordsDto,
    user: User,
  ): Promise<{ data: FinancingRecord[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', type, status, dateFrom, dateTo, search } = listFinancingRecordsDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.financingRecordRepository.createQueryBuilder('financing_record');
    queryBuilder.where('financing_record.userId = :userId', { userId: user.id });

    if (type) {
      queryBuilder.andWhere('financing_record.type = :type', { type: type as FinancingRecordType });
    }
    if (status) {
      queryBuilder.andWhere('financing_record.status = :status', { status: status as FinancingRecordStatus });
    }
    if (dateFrom) {
      queryBuilder.andWhere('financing_record.date >= :dateFrom', { dateFrom: new Date(dateFrom) });
    }
    if (dateTo) {
      queryBuilder.andWhere('financing_record.date <= :dateTo', { dateTo: new Date(dateTo) });
    }

    if (search) {
      queryBuilder.andWhere('(financing_record.sourceOrPurpose ILIKE :search OR financing_record.terms ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    queryBuilder
      .orderBy(`financing_record.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string, user: User): Promise<FinancingRecord> {
    const record = await this.financingRecordRepository.findOne({ where: { id, userId: user.id } });
    if (!record) {
      throw new NotFoundException(`Financing record with ID "${id}" not found or access denied.`);
    }
    return record;
  }

  async update(id: string, updateFinancingRecordDto: UpdateFinancingRecordDto, user: User): Promise<FinancingRecord> {
    await this.findOne(id, user); // Ensures user owns the record and it exists

    const { date, ...restOfDto } = updateFinancingRecordDto;
    const updateData: Partial<FinancingRecord> = { ...restOfDto };

    if (date) {
      updateData.date = new Date(date);
    }
    
    // Ensure relatedDocuments are handled correctly if they can be partially updated
    // For simplicity, this example replaces them if provided.
    // If relatedDocuments is not in restOfDto (because it was undefined in DTO), 
    // it won't be part of updateData, thus won't be changed unless explicitly provided.
    if (updateFinancingRecordDto.hasOwnProperty('relatedDocuments')) {
        updateData.relatedDocuments = updateFinancingRecordDto.relatedDocuments;
    }

    await this.financingRecordRepository.update(id, updateData);
    return this.findOne(id, user); // Return the updated entity from the database
  }

  async remove(id: string, user: User): Promise<void> {
    await this.findOne(id, user); // Ensures user owns the record and it exists
    const result = await this.financingRecordRepository.delete({ id, userId: user.id }); // ensure delete is also scoped by userId
    if (result.affected === 0) {
      // This case should ideally be caught by findOne, but as a safeguard:
      throw new NotFoundException(`Financing record with ID "${id}" not found or operation did not affect any rows.`);
    }
  }
}
