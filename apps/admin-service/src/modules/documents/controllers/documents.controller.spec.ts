import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from '../services';
import { UserDto } from '../../users/dtos';
import { DocumentQueryParamsDto, CreateDocumentDto, DocumentDto } from '../dtos';
import { UserRole, UserStatus, UserType } from '../../users/entities/enums';
import { DocumentType, DocumentStatus } from '../entities/document.entity';
import { JwtBlacklistGuard } from '../../auth/guards/jwt-blacklist.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: DocumentsService;

  const mockUser: UserDto = {
    id: 'user-id-123',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.COMPANY_ADMIN,
    status: UserStatus.ACTIVE,
    userType: UserType.EXTERNAL,
    customerAccountId: 'cust-account-id-456',
    createdAt: new Date().toISOString(),
  };
  const mockDocumentsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCompany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
    findAllFolders: jest.fn(),
    findOneFolder: jest.fn(),
    createFolder: jest.fn(),
    updateFolder: jest.fn(),
    deleteFolder: jest.fn(),
    archive: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: mockDocumentsService,
        },
      ],
    })
    .overrideGuard(JwtBlacklistGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<DocumentsController>(DocumentsController);
    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('findAll', () => {
    it('should return a paginated list of documents', async () => {
      const queryParams: DocumentQueryParamsDto = { page: 1, limit: 10 };
      const expectedResult = { 
        data: [] as DocumentDto[], 
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 } 
      };
      mockDocumentsService.findAll.mockResolvedValue({ items: [], totalCount: 0, page: 1, totalPages: 0 });

      const result = await controller.findAll(queryParams);

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(queryParams);
    });
  });

  describe('upload', () => {
    it('should upload a document', async () => {
      const companyId = 'company-id-123';
      const createDto: CreateDocumentDto = { 
        companyId,
        type: DocumentType.RCCM 
      };
      const file = { 
        originalname: 'test.pdf', 
        size: 12345, 
        mimetype: 'application/pdf' 
      } as Express.Multer.File;
      
      const createdDocument = {
        id: 'doc-1',
        fileName: file.originalname,
        fileUrl: `https://storage.wanzo.com/documents/${file.originalname}`,
        type: DocumentType.RCCM,
        status: DocumentStatus.PENDING,
        uploadedAt: new Date()
      };
      
      mockDocumentsService.create.mockResolvedValue(createdDocument);

      const result = await controller.upload(companyId, createDto, file);

      expect(result).toEqual({
        id: createdDocument.id,
        fileName: createdDocument.fileName,
        fileUrl: createdDocument.fileUrl,
        type: createdDocument.type,
        status: createdDocument.status,
        uploadedAt: createdDocument.uploadedAt.toISOString(),
        message: 'Document uploaded successfully'
      });
      
      expect(service.create).toHaveBeenCalledWith(
        createDto,
        file.size,
        expect.stringContaining(file.originalname),
        expect.any(String),
        file.mimetype
      );
    });
  });

  describe('findByCompany', () => {
    it('should return documents for a company', async () => {
      const companyId = 'company-id-123';
      const queryParams: DocumentQueryParamsDto = { page: 1, limit: 10 };
      const mockDocuments = [
        { 
          id: 'doc-1', 
          companyId, 
          type: DocumentType.RCCM, 
          fileName: 'test1.pdf',
          fileUrl: 'https://example.com/test1.pdf',
          status: DocumentStatus.PENDING,
          uploadedAt: new Date()
        },
        { 
          id: 'doc-2', 
          companyId, 
          type: DocumentType.NATIONAL_ID, 
          fileName: 'test2.pdf',
          fileUrl: 'https://example.com/test2.pdf',
          status: DocumentStatus.VERIFIED,
          uploadedAt: new Date()
        }
      ];

      mockDocumentsService.findByCompany.mockResolvedValue({ 
        items: mockDocuments,
        totalCount: 2,
        page: 1, 
        totalPages: 1 
      });

      const result = await controller.findByCompany(companyId, queryParams);

      expect(result).toEqual(mockDocuments);
      expect(service.findByCompany).toHaveBeenCalledWith(companyId, queryParams);
    });
  });

});
