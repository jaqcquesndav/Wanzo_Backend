import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus, DocumentType } from '../entities/document.entity';
import {
  DocumentDto,
  DocumentsResponseDto,
  UpdateDocumentStatusDto,
  UpdateDocumentDto,
  DocumentQueryParamsDto,
  CreateDocumentDto,
  DocumentFolderDto,
  CreateDocumentFolderDto,
  UpdateDocumentFolderDto,
  FolderQueryParamsDto
} from '../dtos';
import { EventsService } from '../../events/events.service';
// Import events from shared package
// import { DocumentEventTopics } from '@wanzobe/shared';
// import type { DocumentUploadedEvent, DocumentDeletedEvent } from '@wanzobe/shared';

// Temporary local enum until shared package import works
enum DocumentEventTopics {
  DOCUMENT_UPLOADED = 'document.uploaded',
  DOCUMENT_DELETED = 'document.deleted',
  DOCUMENT_ANALYSIS_COMPLETED = 'document.analysis.completed',
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Get all documents with pagination and filtering
   */
  async findAll(queryParams: DocumentQueryParamsDto): Promise<DocumentsResponseDto> {
    const { page = 1, limit = 10, search, type, status, startDate, endDate } = queryParams;
    
    // Build query
    const queryBuilder = this.documentsRepository.createQueryBuilder('doc');
    
    // Apply filters
    if (search) {
      queryBuilder.andWhere('doc.fileName LIKE :search', { search: `%${search}%` });
    }
    
    if (type) {
      queryBuilder.andWhere('doc.type = :type', { type });
    }
    
    if (status) {
      queryBuilder.andWhere('doc.status = :status', { status });
    }
    
    if (startDate) {
      queryBuilder.andWhere('doc.uploadedAt >= :startDate', { startDate: new Date(startDate) });
    }
    
    if (endDate) {
      queryBuilder.andWhere('doc.uploadedAt <= :endDate', { endDate: new Date(endDate) });
    }
    
    // Get total count
    const total = await queryBuilder.getCount();
    
    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    
    // Execute query
    const documents = await queryBuilder.getMany();
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    return {
      items: (documents || []).map(doc => this.mapToDto(doc)),
      totalCount: total,
      page,
      totalPages
    };
  }

  /**
   * Get a single document by ID
   */
  async findOne(id: string): Promise<DocumentDto> {
    const document = await this.documentsRepository.findOneBy({ id });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return this.mapToDto(document);
  }

  /**
   * Create a new document
   */
  async create(
    createDocumentDto: CreateDocumentDto,
    fileSize: number,
    fileUrl: string,
    userId: string,
    mimeType: string,
    fileName?: string
  ): Promise<DocumentDto> {
    try {
      // Validate required fields
      if (!createDocumentDto.companyId) {
        throw new BadRequestException('Company ID is required');
      }
      if (!createDocumentDto.type) {
        throw new BadRequestException('Document type is required');
      }

      const document = this.documentsRepository.create({
        companyId: createDocumentDto.companyId,
        type: createDocumentDto.type,
        fileName: fileName || 'Unnamed Document',
        fileUrl,
        mimeType,
        fileSize,
        status: DocumentStatus.PENDING
      });

      const savedDocument = await this.documentsRepository.save(document);

      // TODO: Re-enable events when event types are properly imported
      /*
      const eventPayload: DocumentUploadedEvent = {
        documentId: savedDocument.id,
        fileName: savedDocument.fileName,
        fileUrl: savedDocument.fileUrl,
        mimeType: savedDocument.mimeType,
        fileSize: savedDocument.fileSize,
        userId,
        companyId: savedDocument.companyId,
        timestamp: new Date().toISOString(),
      };
      this.eventsService.emit(DocumentEventTopics.DOCUMENT_UPLOADED, eventPayload);
      */

      return this.mapToDto(savedDocument);
    } catch (error) {
      this.logger.error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        error instanceof Error ? error.stack : '');
      
      // Re-throw validation errors as-is
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to create document');
    }
  }

  /**
   * Update a document
   */
  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<DocumentDto> {
    const document = await this.documentsRepository.findOneBy({ id });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Update only provided fields
    Object.assign(document, updateDocumentDto);
    
    const updatedDocument = await this.documentsRepository.save(document);
    return this.mapToDto(updatedDocument);
  }

  /**
   * Delete a document
   */
  async remove(id: string, userId: string): Promise<void> {
    const document = await this.documentsRepository.findOneBy({ id });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    await this.documentsRepository.remove(document);

    // TODO: Re-enable events when event types are properly imported
    /*
    const eventPayload: DocumentDeletedEvent = {
      documentId: id,
      deletedBy: userId,
      timestamp: new Date().toISOString(),
    };
    this.eventsService.emit(DocumentEventTopics.DOCUMENT_DELETED, eventPayload);
    */
  }

  /**
   * Archive a document
   */
  async archive(id: string): Promise<DocumentDto> {
    // This is a mock implementation. In a real application, you might mark it as archived
    // or move it to a different storage location
    const document = await this.documentsRepository.findOneBy({ id });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Set status to represent archived state (using REJECTED as a substitute)
    document.status = DocumentStatus.REJECTED;
    
    const updatedDocument = await this.documentsRepository.save(document);
    return this.mapToDto(updatedDocument);
  }

  /**
   * Find documents by company ID
   */
  async findByCompany(companyId: string, queryParams: DocumentQueryParamsDto): Promise<DocumentsResponseDto> {
    const { page = 1, limit = 10 } = queryParams;
    
    // Build query with company filter
    const queryBuilder = this.documentsRepository.createQueryBuilder('doc')
      .where('doc.companyId = :companyId', { companyId });
    
    // Apply additional filters from queryParams
    // ... similar to findAll method
    
    // Get total count
    const totalCount = await queryBuilder.getCount();
    
    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    
    // Execute query
    const documents = await queryBuilder.getMany();
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      items: (documents || []).map(doc => this.mapToDto(doc)),
      totalCount,
      page,
      totalPages
    };
  }

  // ===== FOLDER METHODS =====
  // These are placeholder implementations since we don't have a DocumentFolder entity yet

  /**
   * Find all folders for a company
   */
  async findAllFolders(companyId: string, queryParams: FolderQueryParamsDto): Promise<DocumentFolderDto[]> {
    // Placeholder implementation
    return [
      {
        id: 'folder_1',
        name: 'Tax Documents',
        companyId,
        createdAt: new Date()
      },
      {
        id: 'folder_2',
        name: 'Contracts',
        companyId,
        createdAt: new Date()
      }
    ];
  }

  /**
   * Find a single folder
   */
  async findOneFolder(id: string): Promise<DocumentFolderDto> {
    // Placeholder implementation
    return {
      id,
      name: 'Tax Documents',
      companyId: 'company_123',
      createdAt: new Date()
    };
  }

  /**
   * Create a new folder
   */
  async createFolder(createFolderDto: CreateDocumentFolderDto): Promise<DocumentFolderDto> {
    // Placeholder implementation
    return {
      id: 'new_folder_' + Date.now(),
      name: createFolderDto.name,
      companyId: createFolderDto.companyId,
      parentId: createFolderDto.parentId,
      createdAt: new Date()
    };
  }

  /**
   * Update a folder
   */
  async updateFolder(id: string, updateFolderDto: UpdateDocumentFolderDto): Promise<DocumentFolderDto> {
    // Placeholder implementation
    return {
      id,
      name: updateFolderDto.name || 'Updated Folder',
      companyId: 'company_123',
      parentId: updateFolderDto.parentId,
      createdAt: new Date()
    };
  }

  /**
   * Remove a folder
   */
  async removeFolder(id: string): Promise<void> {
    // Placeholder implementation
    console.log(`Removing folder with ID: ${id}`);
  }

  /**
   * Map entity to DTO
   */
  private mapToDto(document: Document): DocumentDto {
    return {
      id: document.id,
      companyId: document.companyId,
      type: document.type,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      status: document.status,
      uploadedAt: document.uploadedAt
    };
  }

  /**
   * Update document status
   */
  async updateStatus(id: string, updateDto: UpdateDocumentStatusDto): Promise<DocumentDto> {
    const document = await this.documentsRepository.findOneBy({ id });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Update status
    document.status = updateDto.status;
    
    // If verified, update verification info
    if (updateDto.status === DocumentStatus.VERIFIED) {
      document.verifiedAt = new Date();
      // In a real app, you'd get the current user ID here
      document.verifiedBy = 'system'; 
    }

    const updatedDocument = await this.documentsRepository.save(document);
    return this.mapToDto(updatedDocument);
  }
}
