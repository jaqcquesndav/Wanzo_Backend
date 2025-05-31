import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus } from '../entities/document.entity';
import { CreateDocumentDto, UpdateDocumentStatusDto, DocumentFilterDto } from '../dtos/document.dto';
import { NotificationService } from '../../notifications/services/notification.service';
import { ActivityService } from '../../activities/services/activity.service';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private notificationService: NotificationService,
    private activityService: ActivityService,
  ) {}

  async create(
    createDocumentDto: CreateDocumentDto,
    cloudinaryId: string,
    url: string,
    userId: string,
  ): Promise<Document> {
    const document = this.documentRepository.create({
      ...createDocumentDto,
      cloudinaryId,
      url,
      uploadedBy: userId,
      status: DocumentStatus.PENDING,
    });

    const savedDocument = await this.documentRepository.save(document);

    // Log activity
    await this.activityService.logUserActivity(
      userId,
      'DOCUMENT_UPLOADED',
      `Document ${document.name} was uploaded`,
      { documentId: savedDocument.id }
    );

    // Send notification
    await this.notificationService.createSystemNotification(
      userId,
      'Document Uploaded',
      `Your document ${document.name} has been uploaded and is pending review.`
    );

    return savedDocument;
  }

  async findAll(
    filters: DocumentFilterDto,
    page = 1,
    perPage = 10,
  ): Promise<{ documents: Document[]; total: number; page: number; perPage: number }> {
    const query = this.documentRepository.createQueryBuilder('document');

    if (filters.companyId) {
      query.andWhere('document.companyId = :companyId', { companyId: filters.companyId });
    }

    if (filters.type) {
      query.andWhere('document.type = :type', { type: filters.type });
    }

    if (filters.status) {
      query.andWhere('document.status = :status', { status: filters.status });
    }

    if (filters.search) {
      query.andWhere('(document.name ILIKE :search OR document.description ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const [documents, total] = await query
      .orderBy('document.createdAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return {
      documents,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async updateStatus(
    id: string,
    updateDocumentStatusDto: UpdateDocumentStatusDto,
    reviewerId: string,
  ): Promise<Document> {
    const document = await this.findById(id);
    
    const previousStatus = document.status;
    Object.assign(document, {
      ...updateDocumentStatusDto,
      reviewedBy: reviewerId,
    });

    const updatedDocument = await this.documentRepository.save(document);

    // Log activity
    await this.activityService.logUserActivity(
      reviewerId,
      'DOCUMENT_STATUS_UPDATED',
      `Document ${document.name} status changed from ${previousStatus} to ${document.status}`,
      { documentId: document.id }
    );

    // Send notification to document owner
    await this.notificationService.createSystemNotification(
      document.uploadedBy,
      'Document Status Updated',
      `Your document ${document.name} has been ${document.status.toLowerCase()}.`
    );

    return updatedDocument;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const document = await this.findById(id);
    await this.documentRepository.remove(document);
    return { success: true, message: 'Document deleted successfully' };
  }

  async findCompanyDocuments(companyId: string, type?: string): Promise<Document[]> {
    const whereClause: any = { companyId };
    if (type) {
      whereClause.type = type;
    }

    return await this.documentRepository.find({
      where: whereClause,
      order: {
        createdAt: 'DESC',
      },
    });
  }
}