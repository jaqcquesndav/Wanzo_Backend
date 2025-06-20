import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditLogFilterDto } from '../dtos/audit-log-filter.dto';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(filters: AuditLogFilterDto, page = 1, pageSize = 20) {
    const where: FindOptionsWhere<AuditLog> = {};

    if (filters.id) {
      where.id = filters.id;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.startDate && filters.endDate) {
      where.timestamp = Between(new Date(filters.startDate), new Date(filters.endDate));
    }

    const [logs, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Format timestamp to ISO string
    const formattedLogs = logs.map(log => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    }));

    return {
      data: formattedLogs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string) {
    const log = await this.auditLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException('Audit log not found');
    }

    return {
      ...log,
      timestamp: log.timestamp.toISOString(),
    };
  }

  async createLog(
    action: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    userId: string,
    userName: string,
    userRole: string,
    description: string,
    changes: { [fieldName: string]: [any, any] },
  ) {
    const log = this.auditLogRepository.create({
      action,
      entityType,
      entityId,
      userId,
      userName,
      userRole,
      details: {
        description,
        changes,
      },
    });

    return await this.auditLogRepository.save(log);
  }
}
