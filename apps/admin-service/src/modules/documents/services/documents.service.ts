import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { Document, DocumentFolder, DocumentStatus } from '../entities';
import {
  DocumentDto,
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentQueryParamsDto,
  DocumentFolderDto,
  CreateDocumentFolderDto,
  UpdateDocumentFolderDto,
  FolderQueryParamsDto
} from '../dtos';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(DocumentFolder)
    private foldersRepository: Repository<DocumentFolder>
  ) {}

  /**
   * Get all documents with optional filtering and pagination
   */
  async findAll(queryParams: DocumentQueryParamsDto): Promise<{
    documents: DocumentDto[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const {
      type,
      status,
      folderId,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = queryParams;

    const where: FindOptionsWhere<Document> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (folderId) where.folderId = folderId;
    if (search) {
      where.name = Like(`%${search}%`);
      // Additional search conditions could be added here with OR logic
    }

    const [documents, total] = await this.documentsRepository.findAndCount({
      where,
      order: {
        [sortBy]: sortOrder.toUpperCase()
      },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['folder']
    });

    const pages = Math.ceil(total / limit);

    return {
      documents: documents.map(doc => this.mapToDto(doc)),
      total,
      page,
      limit,
      pages
    };
  }

  /**
   * Get all documents for a specific company
   */
  async findByCompany(companyId: string, queryParams: DocumentQueryParamsDto = {}): Promise<{
    documents: DocumentDto[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    // Combine company filter with other query params
    const combinedParams = {
      ...queryParams,
      companyId
    };

    // Use the existing findAll method with the company filter
    return this.findAll(combinedParams as DocumentQueryParamsDto);
  }

  /**
   * Get a single document by ID
   */
  async findOne(id: string): Promise<DocumentDto> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['folder']
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return this.mapToDto(document);
  }

  /**
   * Create a new document
   */
  async create(createDocumentDto: CreateDocumentDto, fileSize: number, fileUrl: string, uploadedBy: string, mimeType: string): Promise<DocumentDto> {
    // Validate folder if provided
    if (createDocumentDto.folderId) {
      const folder = await this.foldersRepository.findOneBy({ id: createDocumentDto.folderId });
      if (!folder) {
        throw new NotFoundException(`Folder with ID ${createDocumentDto.folderId} not found`);
      }
      // Validate folder belongs to the same company
      if (folder.companyId !== createDocumentDto.companyId) {
        throw new BadRequestException(`Folder does not belong to the specified company`);
      }
    }

    const document = this.documentsRepository.create({
      ...createDocumentDto,
      size: fileSize,
      url: fileUrl,
      uploadedBy,
      mimeType,
      status: DocumentStatus.UPLOADED,
      expiresAt: createDocumentDto.expiresAt ? new Date(createDocumentDto.expiresAt) : null
    });

    const savedDocument = await this.documentsRepository.save(document);
    return this.mapToDto(savedDocument);
  }

  /**
   * Update an existing document
   */
  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<DocumentDto> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['folder']
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Validate folder if changing
    if (updateDocumentDto.folderId && updateDocumentDto.folderId !== document.folderId) {
      const folder = await this.foldersRepository.findOneBy({ id: updateDocumentDto.folderId });
      if (!folder) {
        throw new NotFoundException(`Folder with ID ${updateDocumentDto.folderId} not found`);
      }
      // Validate folder belongs to the same company
      if (folder.companyId !== document.companyId) {
        throw new BadRequestException(`Folder does not belong to the document's company`);
      }
    }

    // Update document fields
    Object.assign(document, {
      ...updateDocumentDto,
      expiresAt: updateDocumentDto.expiresAt ? new Date(updateDocumentDto.expiresAt) : document.expiresAt
    });

    const updatedDocument = await this.documentsRepository.save(document);
    return this.mapToDto(updatedDocument);
  }

  /**
   * Delete a document
   */
  async remove(id: string): Promise<void> {
    const document = await this.documentsRepository.findOneBy({ id });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    await this.documentsRepository.remove(document);
  }

  /**
   * Archive a document
   */
  async archive(id: string): Promise<DocumentDto> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['folder']
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    document.status = DocumentStatus.ARCHIVED;
    const updatedDocument = await this.documentsRepository.save(document);
    return this.mapToDto(updatedDocument);
  }

  /**
   * Get all folders for a company
   */
  async findAllFolders(companyId: string, queryParams: FolderQueryParamsDto = {}): Promise<DocumentFolderDto[]> {
    const { parentFolderId, search } = queryParams;

    const where: FindOptionsWhere<DocumentFolder> = { companyId };
    if (parentFolderId) {
      where.parentFolderId = parentFolderId;
    } else {
      // If no parent folder specified, return top-level folders
      where.parentFolderId = null;
    }

    if (search) {
      where.name = Like(`%${search}%`);
    }

    const folders = await this.foldersRepository.find({
      where,
      relations: ['parentFolder'],
      order: { name: 'ASC' }
    });

    return folders.map(folder => this.mapFolderToDto(folder));
  }

  /**
   * Get a folder by ID
   */
  async findOneFolder(id: string): Promise<DocumentFolderDto> {
    const folder = await this.foldersRepository.findOne({
      where: { id },
      relations: ['parentFolder']
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    return this.mapFolderToDto(folder);
  }

  /**
   * Create a new folder
   */
  async createFolder(createFolderDto: CreateDocumentFolderDto): Promise<DocumentFolderDto> {
    // Validate parent folder if provided
    if (createFolderDto.parentFolderId) {
      const parentFolder = await this.foldersRepository.findOneBy({ id: createFolderDto.parentFolderId });
      if (!parentFolder) {
        throw new NotFoundException(`Parent folder with ID ${createFolderDto.parentFolderId} not found`);
      }
      // Validate parent folder belongs to the same company
      if (parentFolder.companyId !== createFolderDto.companyId) {
        throw new BadRequestException(`Parent folder does not belong to the specified company`);
      }
    }

    const folder = this.foldersRepository.create({
      ...createFolderDto,
      isPublic: createFolderDto.isPublic || false
    });

    const savedFolder = await this.foldersRepository.save(folder);
    return this.mapFolderToDto(savedFolder);
  }

  /**
   * Update a folder
   */
  async updateFolder(id: string, updateFolderDto: UpdateDocumentFolderDto): Promise<DocumentFolderDto> {
    const folder = await this.foldersRepository.findOne({
      where: { id },
      relations: ['parentFolder']
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    // Validate parent folder if changing
    if (updateFolderDto.parentFolderId && updateFolderDto.parentFolderId !== folder.parentFolderId) {
      // Prevent circular references
      if (updateFolderDto.parentFolderId === id) {
        throw new BadRequestException(`A folder cannot be its own parent`);
      }

      const parentFolder = await this.foldersRepository.findOneBy({ id: updateFolderDto.parentFolderId });
      if (!parentFolder) {
        throw new NotFoundException(`Parent folder with ID ${updateFolderDto.parentFolderId} not found`);
      }
      // Validate parent folder belongs to the same company
      if (parentFolder.companyId !== folder.companyId) {
        throw new BadRequestException(`Parent folder does not belong to the folder's company`);
      }
    }

    // Update folder fields
    Object.assign(folder, updateFolderDto);

    const updatedFolder = await this.foldersRepository.save(folder);
    return this.mapFolderToDto(updatedFolder);
  }

  /**
   * Delete a folder
   */
  async removeFolder(id: string): Promise<void> {
    const folder = await this.foldersRepository.findOneBy({ id });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    // Check if folder has documents
    const documentsCount = await this.documentsRepository.count({ where: { folderId: id } });
    if (documentsCount > 0) {
      throw new BadRequestException(`Cannot delete folder with documents. Move or delete the documents first.`);
    }

    // Check if folder has sub-folders
    const subFoldersCount = await this.foldersRepository.count({ where: { parentFolderId: id } });
    if (subFoldersCount > 0) {
      throw new BadRequestException(`Cannot delete folder with sub-folders. Move or delete the sub-folders first.`);
    }

    await this.foldersRepository.remove(folder);
  }

  /**
   * Helper method to map Document entity to DocumentDto
   */
  private mapToDto(document: Document): DocumentDto {
    return {
      id: document.id,
      companyId: document.companyId,
      name: document.name,
      type: document.type,
      size: Number(document.size), // Convert from bigint if necessary
      url: document.url,
      status: document.status,
      uploadedBy: document.uploadedBy,
      metadata: document.metadata,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      folderId: document.folderId,
      description: document.description,
      mimeType: document.mimeType,
      thumbnail: document.thumbnail,
      isPublic: document.isPublic,
      expiresAt: document.expiresAt
    };
  }

  /**
   * Helper method to map DocumentFolder entity to DocumentFolderDto
   */
  private mapFolderToDto(folder: DocumentFolder): DocumentFolderDto {
    return {
      id: folder.id,
      name: folder.name,
      companyId: folder.companyId,
      parentFolderId: folder.parentFolderId,
      description: folder.description,
      isPublic: folder.isPublic,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt
    };
  }
}
