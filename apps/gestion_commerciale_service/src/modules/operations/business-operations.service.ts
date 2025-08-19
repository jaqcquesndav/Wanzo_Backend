import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { BusinessOperation, OperationStatus, OperationType } from './entities/business-operation.entity';
import { CreateBusinessOperationDto } from './dto/create-business-operation.dto';
import { UpdateBusinessOperationDto } from './dto/update-business-operation.dto';
import { ListBusinessOperationsDto } from './dto/list-business-operations.dto';
import { ExportOperationsDto } from './dto/export-operations.dto';
import { EventsService } from '../events/events.service';
import { SharedOperationStatus, SharedOperationType } from '@wanzobe/shared/events/commerce-operations';

@Injectable()
export class BusinessOperationsService {
  private readonly logger = new Logger(BusinessOperationsService.name);

  constructor(
    @InjectRepository(BusinessOperation)
    private readonly businessOperationRepository: Repository<BusinessOperation>,
    private readonly eventsService: EventsService
  ) {}

  async create(createBusinessOperationDto: CreateBusinessOperationDto, userId: string): Promise<BusinessOperation> {
    const operation = this.businessOperationRepository.create({
      ...createBusinessOperationDto,
      createdBy: userId,
    });

    try {
      const savedOperation = await this.businessOperationRepository.save(operation);
      
      // Publier l'événement pour l'intégration ADHA AI et le service comptable
      
      // Convertir les enums locaux en enums partagés
      const sharedType = this.convertToSharedOperationType(savedOperation.type);
      const sharedStatus = this.convertToSharedOperationStatus(savedOperation.status);
      
      await this.eventsService.publishBusinessOperationCreated({
        id: savedOperation.id,
        type: sharedType,
        date: savedOperation.date,
        description: savedOperation.description,
        amountCdf: savedOperation.amountCdf,
        status: sharedStatus,
        clientId: savedOperation.relatedPartyId || 'unknown', // Utiliser relatedPartyId comme clientId si disponible
        companyId: userId, // En l'absence d'un companyId explicite, utiliser userId comme fallback
        createdBy: savedOperation.createdBy,
        createdAt: savedOperation.createdAt,
        updatedAt: savedOperation.updatedAt,
        relatedPartyId: savedOperation.relatedPartyId,
        relatedEntityId: savedOperation.entityId,
        relatedEntityType: savedOperation.type.toString(),
        metadata: {
          sourceType: 'commercial_operation',
          sourceName: 'Gestion Commerciale',
          relatedPartyName: savedOperation.relatedPartyName,
          paymentMethod: savedOperation.paymentMethod,
          amountUsd: savedOperation.amountUsd,
        }
      });
      
      return savedOperation;
    } catch (error: any) {
      this.logger.error(`Error creating business operation: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(queryParams: ListBusinessOperationsDto): Promise<{
    items: BusinessOperation[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    const {
      type,
      startDate,
      endDate,
      relatedPartyId,
      status,
      minAmount,
      maxAmount,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = queryParams;

    const where: FindOptionsWhere<BusinessOperation> = {};

    // Apply filters
    if (type) {
      where.type = type;
    }
    if (relatedPartyId) {
      where.relatedPartyId = relatedPartyId;
    }
    if (status) {
      where.status = status;
    }

    // Date filters
    if (startDate && endDate) {
      where.date = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.date = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.date = LessThanOrEqual(new Date(endDate));
    }

    // Amount filters
    if (minAmount !== undefined && maxAmount !== undefined) {
      where.amountCdf = Between(minAmount, maxAmount);
    } else if (minAmount !== undefined) {
      where.amountCdf = MoreThanOrEqual(minAmount);
    } else if (maxAmount !== undefined) {
      where.amountCdf = LessThanOrEqual(maxAmount);
    }

    const skip = (page - 1) * limit;
    const take = limit;

    try {
      const [items, totalItems] = await this.businessOperationRepository.findAndCount({
        where,
        order: { [sortBy]: sortOrder.toUpperCase() },
        skip,
        take,
      });

      const totalPages = Math.ceil(totalItems / limit);

      return {
        items,
        totalItems,
        totalPages,
        currentPage: page,
      };
    } catch (error: any) {
      this.logger.error(`Error fetching business operations: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<BusinessOperation> {
    const operation = await this.businessOperationRepository.findOneBy({ id });
    if (!operation) {
      throw new NotFoundException(`Business operation with ID ${id} not found`);
    }
    return operation;
  }

  async update(id: string, updateBusinessOperationDto: UpdateBusinessOperationDto): Promise<BusinessOperation> {
    const operation = await this.findOne(id);
    
    // Stocker l'état précédent pour l'événement
    const previousState = { ...operation };
    
    // Update only the fields that are provided
    Object.assign(operation, updateBusinessOperationDto);

    try {
      const updatedOperation = await this.businessOperationRepository.save(operation);
      
      // Publier l'événement de mise à jour
      
      // Convertir les enums locaux en enums partagés
      const sharedType = this.convertToSharedOperationType(updatedOperation.type);
      const sharedStatus = this.convertToSharedOperationStatus(updatedOperation.status);
      
      await this.eventsService.publishBusinessOperationUpdated({
        id: updatedOperation.id,
        type: sharedType,
        date: updatedOperation.date,
        description: updatedOperation.description,
        amountCdf: updatedOperation.amountCdf,
        status: sharedStatus,
        clientId: updatedOperation.relatedPartyId || 'unknown',
        companyId: updatedOperation.createdBy,
        createdBy: updatedOperation.createdBy,
        createdAt: updatedOperation.createdAt,
        updatedAt: updatedOperation.updatedAt,
        relatedPartyId: updatedOperation.relatedPartyId,
        relatedEntityId: updatedOperation.entityId,
        relatedEntityType: updatedOperation.type.toString(),
        previousState: {
          type: previousState.type ? this.convertToSharedOperationType(previousState.type) : undefined,
          date: previousState.date,
          description: previousState.description,
          amountCdf: previousState.amountCdf,
          status: previousState.status ? this.convertToSharedOperationStatus(previousState.status) : undefined,
        },
        metadata: {
          sourceType: 'commercial_operation',
          sourceName: 'Gestion Commerciale',
          relatedPartyName: updatedOperation.relatedPartyName,
          paymentMethod: updatedOperation.paymentMethod,
          amountUsd: updatedOperation.amountUsd,
        }
      });
      
      return updatedOperation;
    } catch (error: any) {
      this.logger.error(`Error updating business operation: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const operation = await this.findOne(id);
    try {
      // Publier l'événement de suppression avant de supprimer l'opération
      await this.eventsService.publishBusinessOperationDeleted({
        id: operation.id,
        clientId: operation.relatedPartyId || 'unknown',
        companyId: operation.createdBy,
        deletedBy: operation.createdBy, // À remplacer par l'ID de l'utilisateur qui effectue la suppression si disponible
        deletedAt: new Date()
      });
      
      await this.businessOperationRepository.remove(operation);
    } catch (error: any) {
      this.logger.error(`Error removing business operation: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getOperationsSummary(period: string, date?: string): Promise<any> {
    const referenceDate = date ? new Date(date) : new Date();
    let startDate: Date;
    let endDate: Date;

    // Calculate start and end dates based on period
    switch (period) {
      case 'day':
        startDate = new Date(referenceDate.setHours(0, 0, 0, 0));
        endDate = new Date(referenceDate.setHours(23, 59, 59, 999));
        break;
      case 'week':
        // Get the first day of the week (Monday)
        const day = referenceDate.getDay();
        const diff = referenceDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        startDate = new Date(referenceDate.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        
        // End date is 6 days later (Sunday)
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        endDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(referenceDate.getFullYear(), 0, 1);
        endDate = new Date(referenceDate.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        throw new Error(`Invalid period: ${period}. Must be one of: day, week, month, year`);
    }

    // Get operations for the period
    const operations = await this.businessOperationRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
    });

    // Initialize summary object
    const summary = {
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      summary: {
        totalOperations: operations.length,
        byType: {},
        byStatus: {},
      },
    };

    // Group by type
    const typeGroups = {};
    operations.forEach(op => {
      if (!typeGroups[op.type]) {
        typeGroups[op.type] = {
          count: 0,
          amountCdf: 0,
          amountUsd: 0,
        };
      }

      typeGroups[op.type].count++;
      typeGroups[op.type].amountCdf += Number(op.amountCdf);
      if (op.amountUsd) {
        typeGroups[op.type].amountUsd += Number(op.amountUsd);
      }

      // Add productCount for inventory operations
      if (op.type === OperationType.INVENTORY && op.productCount) {
        if (!typeGroups[op.type].productCount) {
          typeGroups[op.type].productCount = 0;
        }
        typeGroups[op.type].productCount += op.productCount;
      }
    });

    // Group by status
    const statusGroups = {};
    operations.forEach(op => {
      if (!statusGroups[op.status]) {
        statusGroups[op.status] = 0;
      }
      statusGroups[op.status]++;
    });

    // Add to summary
    summary.summary.byType = typeGroups;
    summary.summary.byStatus = statusGroups;

    return summary;
  }

  async exportOperations(exportDto: ExportOperationsDto, userId: string): Promise<any> {
    // This is a placeholder implementation
    // In a real implementation, this would generate actual PDF or Excel files

    const { startDate, endDate, type, relatedPartyId, status, format, includeDetails, groupBy } = exportDto;

    // First, get the operations that match the criteria
    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    if (relatedPartyId) {
      where.relatedPartyId = relatedPartyId;
    }
    if (status) {
      where.status = status;
    }
    
    where.date = Between(new Date(startDate), new Date(endDate));
    
    try {
      const operations = await this.businessOperationRepository.find({ where });
      
      // In a real implementation, we'd generate a file here
      // For now, we'll just return a mock response
      
      // Generate a unique filename based on the criteria
      const filename = `operations_export_${startDate}_${endDate}.${format}`;
      
      return {
        exportId: `export-${Date.now()}`,
        fileName: filename,
        fileSize: 1250, // Mock file size
        fileUrl: `https://api.wanzo.com/exports/${filename}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      };
    } catch (error: any) {
      this.logger.error(`Error exporting operations: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getOperationsTimeline(limit: number = 10): Promise<any[]> {
    try {
      const operations = await this.businessOperationRepository.find({
        order: { date: 'DESC' },
        take: limit,
      });

      // Format the operations for timeline display
      return operations.map(op => {
        const timeAgo = this.getTimeAgo(op.date);
        return {
          id: op.id,
          type: op.type,
          date: op.date,
          description: op.description,
          amountCdf: op.amountCdf,
          relatedPartyName: op.relatedPartyName,
          status: op.status,
          timeAgo,
        };
      });
    } catch (error: any) {
      this.logger.error(`Error fetching operations timeline: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper function to calculate "time ago" string
  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    let interval = seconds / 31536000; // seconds in a year
    
    if (interval > 1) {
      return `il y a ${Math.floor(interval)} ans`;
    }
    interval = seconds / 2592000; // seconds in a month
    if (interval > 1) {
      return `il y a ${Math.floor(interval)} mois`;
    }
    interval = seconds / 86400; // seconds in a day
    if (interval > 1) {
      return `il y a ${Math.floor(interval)} jours`;
    }
    interval = seconds / 3600; // seconds in an hour
    if (interval > 1) {
      return `il y a ${Math.floor(interval)} heures`;
    }
    interval = seconds / 60; // seconds in a minute
    if (interval > 1) {
      return `il y a ${Math.floor(interval)} minutes`;
    }
    return `il y a ${Math.floor(seconds)} secondes`;
  }
  
  /**
   * Convertit un OperationType local en SharedOperationType pour les événements
   */
  private convertToSharedOperationType(type: OperationType): SharedOperationType {
    switch(type) {
      case OperationType.SALE:
        return SharedOperationType.SALE;
      case OperationType.EXPENSE:
        return SharedOperationType.EXPENSE;
      case OperationType.FINANCING:
        return SharedOperationType.FINANCING;
      case OperationType.INVENTORY:
        return SharedOperationType.INVENTORY;
      default:
        return SharedOperationType.TRANSACTION;
    }
  }

  /**
   * Convertit un OperationStatus local en SharedOperationStatus pour les événements
   */
  private convertToSharedOperationStatus(status: OperationStatus): SharedOperationStatus {
    switch(status) {
      case OperationStatus.COMPLETED:
        return SharedOperationStatus.COMPLETED;
      case OperationStatus.PENDING:
        return SharedOperationStatus.PENDING;
      case OperationStatus.CANCELLED:
        return SharedOperationStatus.CANCELLED;
      default:
        return SharedOperationStatus.FAILED;
    }
  }
}
