import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Document } from '../entities/document.entity';
import { CreateDocumentDto, UpdateDocumentDto, ListDocumentsDto } from '../dto/document.dto';
import { User } from '../../auth/entities/user.entity';
import { CloudinaryService } from 'nestjs-cloudinary';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

@Injectable()
export class DocumentManagementService {
  private readonly logger = new Logger(DocumentManagementService.name);

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createDocumentDto: CreateDocumentDto,
    user: User,
    file: any,
  ): Promise<Document> {
    this.logger.log(`User ${user.id} creating document with original name: ${file.originalname}`);
    
    if (!file) {
      throw new BadRequestException('File is required for document creation.');
    }

    let uploadResult: UploadApiResponse;
    try {
      const folder = `wanzo_documents/${user.companyId || user.id}/${createDocumentDto.relatedToEntityType || 'general'}`;
      uploadResult = await this.cloudinaryService.cloudinary.uploader.upload(
        file.path, 
        {
          folder,
          public_id: `${file.originalname.split('.').slice(0, -1).join('.')}_${Date.now()}`,
          resource_type: 'auto',
          filename_override: file.originalname, 
          use_filename: true,
          unique_filename: false // To try and keep original name, but public_id will be unique
        },
      );
      this.logger.log(`File uploaded to Cloudinary: ${uploadResult.secure_url}, public_id: ${uploadResult.public_id}`);
    } catch (error) {
      const typedError = error as UploadApiErrorResponse;
      this.logger.error(`Failed to upload file to Cloudinary: ${typedError.message}`, typedError.stack);
      throw new BadRequestException(`Failed to upload file: ${typedError.message}`);
    }

    const newDocument = this.documentsRepository.create({
      ...createDocumentDto, // Spread DTO first
      userId: user.id,
      companyId: user.companyId, 
      storageUrl: uploadResult.secure_url,  // Utilise storageUrl comme défini dans l'entity
      fileSize: uploadResult.bytes, 
      fileType: uploadResult.format || file.mimetype, 
      fileName: file.originalname, // Explicitly set from original file
      publicId: uploadResult.public_id,
    });

    return this.documentsRepository.save(newDocument);
  }

  async findAll(listDocumentsDto: ListDocumentsDto, user: User): Promise<{ data: Document[]; count: number }> {
    const { page = 1, limit = 10, documentType, relatedToEntityType, relatedToEntityId, tag, searchTerm, sortBy = 'uploadedAt', sortOrder = 'DESC' } = listDocumentsDto;
    this.logger.log(`User ${user.id} (Company: ${user.companyId || 'N/A'}) listing documents with query: ${JSON.stringify(listDocumentsDto)}`);

    const queryBuilder = this.documentsRepository.createQueryBuilder('document');

    queryBuilder.where('document.userId = :userId', { userId: user.id });
    if (user.companyId) {
      queryBuilder.andWhere('document.companyId = :companyId', { companyId: user.companyId });
    } else {
      // If user has no companyId, ensure we only fetch documents without a companyId for that user
      queryBuilder.andWhere('document.companyId IS NULL');
    }

    if (documentType) {
      queryBuilder.andWhere('document.documentType = :documentType', { documentType });
    }
    if (relatedToEntityType) {
      queryBuilder.andWhere('document.relatedToEntityType = :relatedToEntityType', { relatedToEntityType });
    }
    if (relatedToEntityId) {
      queryBuilder.andWhere('document.relatedToEntityId = :relatedToEntityId', { relatedToEntityId });
    }
    if (tag) {
      queryBuilder.andWhere("document.tags LIKE :tag", { tag: `%${tag}%` }); // Assumes tags is simple-array, adjust if it's a proper array type
    }
    if (searchTerm) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where('document.fileName ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
            .orWhere('document.description ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` });
        }),
      );
    }

    queryBuilder.orderBy(`document.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, count] = await queryBuilder.getManyAndCount();
    return { data, count };
  }

  async findOne(id: string, user: User): Promise<Document> {
    this.logger.log(`User ${user.id} (Company: ${user.companyId || 'N/A'}) finding document with id: ${id}`);
    const queryBuilder = this.documentsRepository.createQueryBuilder('document');
    queryBuilder.where('document.id = :id', { id })
                .andWhere('document.userId = :userId', { userId: user.id });
    
    if (user.companyId) {
      queryBuilder.andWhere('document.companyId = :companyId', { companyId: user.companyId });
    } else {
      queryBuilder.andWhere('document.companyId IS NULL');
    }

    const document = await queryBuilder.getOne();

    if (!document) {
      this.logger.warn(`Document with id ${id} not found for user ${user.id} (Company: ${user.companyId || 'N/A'})`);
      throw new NotFoundException(`Document with ID '${id}' not found.`);
    }
    return document;
  }

  async update(
    id: string, 
    updateDocumentDto: UpdateDocumentDto, 
    user: User,
    file?: any,
  ): Promise<Document> {
    this.logger.log(`User ${user.id} (Company: ${user.companyId || 'N/A'}) updating document with id: ${id}`);
    // Pass user object to findOne to ensure companyId check if applicable
    const document = await this.findOne(id, user); 

    if (file) {
      this.logger.log(`New file provided for document ${id}. Original name: ${file.originalname}. Re-uploading.`);
      try {
        if (document.publicId) {
          await this.cloudinaryService.cloudinary.uploader.destroy(document.publicId);
          this.logger.log(`Old file ${document.publicId} deleted from Cloudinary.`);
        }
        const folder = `wanzo_documents/${user.companyId || user.id}/${document.relatedToEntityType || 'general'}`;
        const uploadResult = await this.cloudinaryService.cloudinary.uploader.upload(
          file.path, 
          {
            folder,
            public_id: `${file.originalname.split('.').slice(0, -1).join('.')}_${Date.now()}`,
            resource_type: 'auto',
            filename_override: file.originalname,
            use_filename: true,
            unique_filename: false
          }
        );
        this.logger.log(`New file uploaded to Cloudinary: ${uploadResult.secure_url}, public_id: ${uploadResult.public_id}`);
        document.storageUrl = uploadResult.secure_url;
        document.fileSize = uploadResult.bytes;
        document.fileType = uploadResult.format || file.mimetype;
        document.fileName = file.originalname; 
        document.publicId = uploadResult.public_id;
      } catch (error) {
        const typedError = error as UploadApiErrorResponse;
        this.logger.error(`Failed to re-upload file to Cloudinary: ${typedError.message}`, typedError.stack);
        throw new BadRequestException(`Failed to re-upload file: ${typedError.message}`);
      }
    }

    // Apply DTO changes, but ensure critical fields are not overridden if not present in DTO
    Object.assign(document, updateDocumentDto);
    // Re-assert ownership and company context after DTO assignment
    document.userId = user.id;
    document.companyId = user.companyId; // This ensures companyId is correctly set based on the current user

    return this.documentsRepository.save(document);
  }

  async remove(id: string, user: User): Promise<void> {
    this.logger.log(`User ${user.id} (Company: ${user.companyId || 'N/A'}) removing document with id: ${id}`);
    const document = await this.findOne(id, user); // Ensures user owns the document and it matches company context

    if (document.publicId) {
      try {
        await this.cloudinaryService.cloudinary.uploader.destroy(document.publicId);
        this.logger.log(`File ${document.publicId} deleted from Cloudinary.`);
      } catch (error) {
        const typedError = error as UploadApiErrorResponse;
        this.logger.error(`Failed to delete file ${document.publicId} from Cloudinary: ${typedError.message}`, typedError.stack);
        // Log and proceed, but consider implications for data consistency
      }
    }

    await this.documentsRepository.remove(document);
    this.logger.log(`Document ${id} removed from database.`);
  }
}
