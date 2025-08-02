import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentsService } from './documents.service';
import { EventsService } from '../../events/events.service';
import { Document, DocumentStatus, DocumentType } from '../entities/document.entity';
import { DocumentFolder } from '../entities/document-folder.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentDto } from '../dtos';

// Import DocumentEventTopics from shared events
import { DocumentEventTopics } from '@wanzo/shared/events/kafka-config';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getCount: jest.fn(),
  })),
});

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentRepository: MockRepository<Document>;
  let folderRepository: MockRepository<DocumentFolder>;
  let eventsService: EventsService;

  const mockEventsService = {
    emit: jest.fn(),
  };  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: getRepositoryToken(Document), useFactory: createMockRepository },
        { provide: getRepositoryToken(DocumentFolder), useFactory: createMockRepository },
        { provide: EventsService, useValue: mockEventsService },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    documentRepository = module.get(getRepositoryToken(Document));
    folderRepository = module.get(getRepositoryToken(DocumentFolder));
    eventsService = module.get<EventsService>(EventsService);
      // Mock the private mapToDto method for all scenarios
    jest.spyOn(service as any, 'mapToDto').mockImplementation((doc: any) => {
      if (Array.isArray(doc)) {
        return doc.map(d => ({
          id: d.id,
          companyId: d.companyId,
          type: d.type,
          fileName: d.fileName || 'Unnamed Document',
          fileUrl: d.fileUrl || 'https://example.com/default.pdf',
          mimeType: d.mimeType || 'application/pdf',
          fileSize: d.fileSize || 0,
          status: d.status || DocumentStatus.PENDING,
          uploadedAt: d.uploadedAt || new Date()
        }));
      }
      return {
        id: doc.id,
        companyId: doc.companyId,
        type: doc.type,
        fileName: doc.fileName || 'Unnamed Document',
        fileUrl: doc.fileUrl || 'https://example.com/default.pdf',
        mimeType: doc.mimeType || 'application/pdf',
        fileSize: doc.fileSize || 0,
        status: doc.status || DocumentStatus.PENDING,
        uploadedAt: doc.uploadedAt || new Date()
      };
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });  describe('findAll', () => {
    it('should return paginated documents', async () => {
      const mockDocuments = [
        { id: 'doc-1', type: DocumentType.RCCM, status: DocumentStatus.VERIFIED, fileName: 'test.pdf' },
        { id: 'doc-2', type: DocumentType.NATIONAL_ID, status: DocumentStatus.PENDING, fileName: 'id.pdf' },
      ];

      // Setup the query builder mock to return our test data
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockDocuments),
        getCount: jest.fn().mockResolvedValue(2),
      };

      (documentRepository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      // Override the mapToDto mock for array mapping in findAll
      (service as any).mapToDto = jest.fn().mockImplementation((doc) => {
        return {
          id: doc.id,
          type: doc.type,
          status: doc.status,
          fileName: doc.fileName,
          uploadedAt: new Date(),
          fileUrl: 'https://example.com/test.pdf',
          mimeType: 'application/pdf',
          fileSize: 1000,
          companyId: 'company-1'
        };
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items.length).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.page).toBe(1);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply filters when provided', async () => {
      // Setup the query builder mock to capture filter calls
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
      };

      (documentRepository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      // Override the mapToDto mock for array mapping in findAll
      (service as any).mapToDto = jest.fn().mockImplementation((doc) => {
        return {
          id: doc.id || 'mock-id',
          type: doc.type || DocumentType.RCCM,
          status: doc.status || DocumentStatus.PENDING,
          fileName: doc.fileName || 'mock.pdf',
          uploadedAt: new Date(),
          fileUrl: 'https://example.com/test.pdf',
          mimeType: 'application/pdf',
          fileSize: 1000,
          companyId: 'company-1'
        };
      });

      await service.findAll({ 
        page: 1, 
        limit: 10, 
        type: DocumentType.RCCM, 
        status: DocumentStatus.VERIFIED,
        search: 'test'
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('doc.type = :type', { type: DocumentType.RCCM });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('doc.status = :status', { status: DocumentStatus.VERIFIED });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('doc.fileName LIKE :search', { search: '%test%' });
    });
  });

  describe('findOne', () => {
    it('should return a document if it exists', async () => {
      const mockDocument = { 
        id: 'doc-1', 
        type: DocumentType.RCCM, 
        status: DocumentStatus.VERIFIED, 
        fileName: 'test.pdf',
        uploadedAt: new Date(),
        updatedAt: new Date(),
        fileUrl: 'https://example.com/test.pdf',
        fileSize: 12345,
        mimeType: 'application/pdf',
        companyId: 'company-1'
      };
      documentRepository.findOneBy.mockResolvedValue(mockDocument);

      const result = await service.findOne('doc-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('doc-1');
      expect(documentRepository.findOneBy).toHaveBeenCalledWith({ id: 'doc-1' });
    });

    it('should throw NotFoundException if document does not exist', async () => {
      documentRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });  describe('create', () => {
    it('should create a document successfully', async () => {
      const createDocumentDto = {
        companyId: 'company-1',
        type: DocumentType.RCCM
      };
      const fileSize = 12345;
      const fileUrl = 'https://example.com/test.pdf';
      const userId = 'user-1';
      const mimeType = 'application/pdf';
      const fileName = 'test.pdf';

      const mockDocument = {
        id: 'doc-1',
        companyId: createDocumentDto.companyId,
        type: createDocumentDto.type,
        fileName: fileName,
        fileUrl,
        fileSize,
        mimeType,
        status: DocumentStatus.PENDING,
        uploadedAt: new Date(),
        updatedAt: new Date()
      };

      documentRepository.create.mockReturnValue(mockDocument);
      documentRepository.save.mockResolvedValue(mockDocument);
      
      const result = await service.create(createDocumentDto, fileSize, fileUrl, userId, mimeType, fileName);

      expect(result).toBeDefined();
      expect(result.id).toBe('doc-1');
      expect(result.status).toBe(DocumentStatus.PENDING);
      expect(documentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        companyId: createDocumentDto.companyId,
        type: createDocumentDto.type,
        fileName: fileName
      }));
      // Note: Events are temporarily disabled
      // expect(mockEventsService.emit).toHaveBeenCalledWith(
      //   DocumentEventTopics.DOCUMENT_UPLOADED,
      //   expect.objectContaining({
      //     documentId: 'doc-1',
      //     fileName: 'test.pdf'
      //   })
      // );
    });

    it('should throw BadRequestException on error', async () => {
      const createDocumentDto = {
        companyId: 'company-1',
        type: DocumentType.RCCM
      };
      
      documentRepository.create.mockImplementation(() => { 
        throw new Error('DB Error'); 
      });

      await expect(service.create(
        createDocumentDto,
        123,
        'https://example.com/file.pdf',
        'user-id',
        'application/pdf',
        'test.pdf'
      )).rejects.toThrow(BadRequestException);
    });
  });
});
