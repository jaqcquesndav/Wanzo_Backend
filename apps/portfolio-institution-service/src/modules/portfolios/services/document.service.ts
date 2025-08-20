import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Document, DocumentType, DocumentStatus } from '../entities/document.entity';
import { CreateDocumentDto, UpdateDocumentDto, DocumentFilterDto } from '../dtos/document.dto';
import { EventsService } from '../../events/events.service';
import { DocumentUploadedEvent } from '@wanzobe/shared';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class DocumentService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private eventsService: EventsService,
  ) {
    // Définir le répertoire de stockage des documents
    this.uploadDir = path.join(process.cwd(), 'uploads');
    // S'assurer que le répertoire existe
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Crée un nouveau document à partir d'un fichier uploadé
   */
  async create(
    file: Express.Multer.File,
    createDocumentDto: CreateDocumentDto,
    userId: string
  ): Promise<Document> {
    if (!file) {
      throw new BadRequestException('Fichier manquant');
    }

    // Générer un nom de fichier unique pour éviter les collisions
    const uniqueFilename = this.generateUniqueFilename(file.originalname);
    const filePath = path.join(this.uploadDir, uniqueFilename);

    // Écrire le fichier sur le disque
    fs.writeFileSync(filePath, file.buffer);

    // Créer le document en base de données
    const document = this.documentRepository.create({
      ...createDocumentDto,
      file_path: uniqueFilename,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_by: userId,
      metadata: {
        ...createDocumentDto.metadata,
        uploaded_by: userId,
        upload_date: new Date(),
      },
    });

    const savedDocument = await this.documentRepository.save(document);

    // Publier l'événement d'upload de document
    await this.eventsService.publishDocumentUploaded({
      id: savedDocument.id.toString(),
      name: savedDocument.name,
      type: savedDocument.type,
      portfolio_id: undefined,
      funding_request_id: savedDocument.funding_request_id,
      contract_id: savedDocument.contract_id,
      disbursement_id: savedDocument.disbursement_id,
      repayment_id: savedDocument.repayment_id,
      uploaded_by: userId,
      upload_date: new Date(),
      file_size: savedDocument.file_size || 0,
      mime_type: savedDocument.mime_type || 'application/octet-stream'
    });

    return savedDocument;
  }

  /**
   * Récupère la liste des documents selon les filtres
   */
  async findAll(filters: DocumentFilterDto): Promise<Document[]> {
    const queryBuilder = this.documentRepository.createQueryBuilder('doc');
    
    if (filters.type) {
      queryBuilder.andWhere('doc.type = :type', { type: filters.type });
    }
    
    if (filters.status) {
      queryBuilder.andWhere('doc.status = :status', { status: filters.status });
    }
    
    if (filters.funding_request_id) {
      queryBuilder.andWhere('doc.funding_request_id = :fundingRequestId', { 
        fundingRequestId: filters.funding_request_id 
      });
    }
    
    if (filters.contract_id) {
      queryBuilder.andWhere('doc.contract_id = :contractId', { 
        contractId: filters.contract_id 
      });
    }
    
    if (filters.disbursement_id) {
      queryBuilder.andWhere('doc.disbursement_id = :disbursementId', { 
        disbursementId: filters.disbursement_id 
      });
    }
    
    if (filters.repayment_id) {
      queryBuilder.andWhere('doc.repayment_id = :repaymentId', { 
        repaymentId: filters.repayment_id 
      });
    }
    
    if (filters.search) {
      queryBuilder.andWhere('(doc.name ILIKE :search OR doc.description ILIKE :search)', { 
        search: `%${filters.search}%` 
      });
    }
    
    if (filters.sortBy) {
      const order = filters.sortOrder || 'asc';
      queryBuilder.orderBy(`doc.${filters.sortBy}`, order.toUpperCase() as 'ASC' | 'DESC');
    } else {
      queryBuilder.orderBy('doc.created_at', 'DESC');
    }
    
    return await queryBuilder.getMany();
  }

  /**
   * Récupère un document par son ID
   */
  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document avec l'ID ${id} non trouvé`);
    }
    return document;
  }

  /**
   * Met à jour un document existant
   */
  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    const document = await this.findOne(id);
    
    // Mettre à jour les propriétés
    Object.assign(document, updateDocumentDto);
    
    
    // Si les métadonnées sont fournies, les fusionner avec les métadonnées existantes
    if (updateDocumentDto.metadata) {
      document.metadata = {
        ...document.metadata,
        ...updateDocumentDto.metadata,
        // Assurer que upload_date est un objet Date s'il est présent
        upload_date: updateDocumentDto.metadata?.upload_date 
          ? new Date(updateDocumentDto.metadata.upload_date) 
          : document.metadata?.upload_date,
        // Assurer que expiry_date est un objet Date s'il est présent
        expiry_date: updateDocumentDto.metadata?.expiry_date 
          ? new Date(updateDocumentDto.metadata.expiry_date) 
          : document.metadata?.expiry_date
      };
    }
    
    const updatedDocument = await this.documentRepository.save(document);

    // Publier l'événement de mise à jour du document
    await this.eventsService.publishDocumentUpdated({
      id: updatedDocument.id,
      name: updatedDocument.name,
      type: updatedDocument.type,
      status: updatedDocument.status,
      updated_by: 'system', // Idéalement, cela devrait être passé comme paramètre
      update_date: new Date(),
      changes: Object.keys(updateDocumentDto).map(field => ({
        field,
        new_value: updateDocumentDto[field],
      }))
    });

    return updatedDocument;
  }

  /**
   * Remplace le fichier d'un document existant
   */
  async replaceFile(id: string, file: Express.Multer.File, userId: string): Promise<Document> {
    const document = await this.findOne(id);
    
    // Supprimer l'ancien fichier s'il existe
    if (document.file_path) {
      const oldFilePath = path.join(this.uploadDir, document.file_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    // Générer un nouveau nom de fichier
    const uniqueFilename = this.generateUniqueFilename(file.originalname);
    const filePath = path.join(this.uploadDir, uniqueFilename);
    
    // Écrire le nouveau fichier
    fs.writeFileSync(filePath, file.buffer);
    
    // Mettre à jour les propriétés du document
    document.file_path = uniqueFilename;
    document.file_size = file.size;
    document.mime_type = file.mimetype;
    document.version = (document.version || 0) + 1;
    
    // Mettre à jour les métadonnées
    document.metadata = {
      ...document.metadata,
      uploaded_by: userId,
      upload_date: new Date(),
    };
    
    const updatedDocument = await this.documentRepository.save(document);

    // Publier l'événement de mise à jour du document
    await this.eventsService.publishDocumentUpdated({
      id: updatedDocument.id,
      name: updatedDocument.name,
      type: updatedDocument.type,
      status: updatedDocument.status,
      updated_by: userId,
      update_date: new Date(),
      changes: [{
        field: 'file',
        new_value: `New file uploaded: ${file.originalname}`
      }]
    });
    
    return updatedDocument;
  }

  /**
   * Archive un document
   */
  async archive(id: string, userId?: string): Promise<Document> {
    const document = await this.findOne(id);
    const oldStatus = document.status;
    document.status = DocumentStatus.ARCHIVED;
    
    const updatedDocument = await this.documentRepository.save(document);

    // Publier l'événement de changement de statut
    await this.eventsService.publishDocumentStatusChanged({
      id: updatedDocument.id,
      name: updatedDocument.name,
      type: updatedDocument.type,
      old_status: oldStatus,
      new_status: DocumentStatus.ARCHIVED,
      changed_by: userId || 'system',
      change_date: new Date(),
      reason: 'Document archivé'
    });
    
    return updatedDocument;
  }

  /**
   * Supprime un document (marque comme supprimé, ne supprime pas physiquement)
   */
  async softDelete(id: string, userId?: string): Promise<Document> {
    const document = await this.findOne(id);
    const oldStatus = document.status;
    document.status = DocumentStatus.DELETED;
    
    const updatedDocument = await this.documentRepository.save(document);

    // Publier l'événement de changement de statut
    await this.eventsService.publishDocumentStatusChanged({
      id: updatedDocument.id,
      name: updatedDocument.name,
      type: updatedDocument.type,
      old_status: oldStatus,
      new_status: DocumentStatus.DELETED,
      changed_by: userId || 'system',
      change_date: new Date(),
      reason: 'Document supprimé (suppression logique)'
    });
    
    return updatedDocument;
  }

  /**
   * Supprime physiquement un document
   */
  async hardDelete(id: string, userId?: string): Promise<void> {
    const document = await this.findOne(id);
    
    // Publier l'événement de changement de statut avant la suppression
    await this.eventsService.publishDocumentStatusChanged({
      id: document.id,
      name: document.name,
      type: document.type,
      old_status: document.status,
      new_status: 'PERMANENTLY_DELETED', // Status fictif pour l'événement
      changed_by: userId || 'system',
      change_date: new Date(),
      reason: 'Document supprimé définitivement'
    });
    
    // Supprimer le fichier
    if (document.file_path) {
      const filePath = path.join(this.uploadDir, document.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Supprimer de la base de données
    await this.documentRepository.remove(document);
  }

  /**
   * Récupère le contenu d'un document
   */
  async getDocumentContent(id: string): Promise<{ buffer: Buffer; document: Document }> {
    const document = await this.findOne(id);
    
    if (!document.file_path) {
      throw new NotFoundException('Fichier non trouvé');
    }
    
    const filePath = path.join(this.uploadDir, document.file_path);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Fichier physique non trouvé');
    }
    
    const buffer = fs.readFileSync(filePath);
    
    return { buffer, document };
  }

  /**
   * Génère un nom de fichier unique
   */
  private generateUniqueFilename(originalFilename: string): string {
    const timestamp = new Date().getTime();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalFilename);
    const sanitizedName = path.basename(originalFilename, extension)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    
    return `${sanitizedName}_${timestamp}_${random}${extension}`;
  }
}
