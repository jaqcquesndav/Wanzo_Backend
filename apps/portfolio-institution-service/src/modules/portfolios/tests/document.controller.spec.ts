import { Test, TestingModule } from '@nestjs/testing';
import { DocumentController } from '../controllers/document.controller';
import { DocumentService } from '../services/document.service';
import { DocumentType, DocumentStatus } from '../entities/document.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DocumentController', () => {
  let controller: DocumentController;
  let service: DocumentService;

  // Mock document
  const mockDocument = {
    id: '1',
    name: 'Test Document',
    type: DocumentType.CONTRACT,
    status: DocumentStatus.ACTIVE,
    description: 'Test description',
    file_path: 'test-file.pdf',
    file_size: 1024,
    mime_type: 'application/pdf',
    funding_request_id: '1',
    version: 1,
    metadata: {
      tags: ['test', 'document'],
      upload_date: new Date(),
    },
    created_at: new Date(),
    updated_at: new Date(),
  };

  // Mock file
  const mockFile = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('test file content'),
    size: 1024,
  } as Express.Multer.File;

  // Mock response
  const mockResponse = {
    set: jest.fn().mockReturnThis(),
    end: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        {
          provide: DocumentService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockDocument),
            findAll: jest.fn().mockResolvedValue([mockDocument]),
            findOne: jest.fn().mockResolvedValue(mockDocument),
            update: jest.fn().mockResolvedValue(mockDocument),
            replaceFile: jest.fn().mockResolvedValue(mockDocument),
            archive: jest.fn().mockResolvedValue(mockDocument),
            softDelete: jest.fn().mockResolvedValue(mockDocument),
            hardDelete: jest.fn().mockResolvedValue(undefined),
            getDocumentContent: jest.fn().mockResolvedValue({
              buffer: Buffer.from('file content'),
              document: mockDocument,
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<DocumentController>(DocumentController);
    service = module.get<DocumentService>(DocumentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a document', async () => {
      const createDocumentDto = {
        name: 'Test Document',
        type: DocumentType.CONTRACT,
        description: 'Test description',
        funding_request_id: '1',
        metadata: {
          tags: ['test'],
        },
      };

      const req = { user: { id: 'user1' } };

      const result = await controller.create(mockFile, createDocumentDto, req);

      expect(service.create).toHaveBeenCalledWith(mockFile, createDocumentDto, 'user1');
      expect(result).toEqual(mockDocument);
    });

    it('should throw BadRequestException if file is missing', async () => {
      const createDocumentDto = {
        name: 'Test Document',
        type: DocumentType.CONTRACT,
        description: 'Test description',
      };

      const req = { user: { id: 'user1' } };

      await expect(controller.create(undefined as any, createDocumentDto, req)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return an array of documents', async () => {
      const filters = { type: DocumentType.CONTRACT };
      
      const result = await controller.findAll(filters);
      
      expect(service.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual([mockDocument]);
    });
  });

  describe('findOne', () => {
    it('should return a document', async () => {
      const result = await controller.findOne('1');
      
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockDocument);
    });
  });

  describe('download', () => {
    it('should download a document', async () => {
      await controller.download('1', mockResponse as any);
      
      expect(service.getDocumentContent).toHaveBeenCalledWith('1');
      expect(mockResponse.set).toHaveBeenCalled();
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a document', async () => {
      const updateDocumentDto = {
        description: 'Updated description',
      };
      
      const result = await controller.update('1', updateDocumentDto);
      
      expect(service.update).toHaveBeenCalledWith('1', updateDocumentDto);
      expect(result).toEqual(mockDocument);
    });
  });

  describe('replaceFile', () => {
    it('should replace a document file', async () => {
      const req = { user: { id: 'user1' } };
      
      const result = await controller.replaceFile('1', mockFile, req);
      
      expect(service.replaceFile).toHaveBeenCalledWith('1', mockFile, 'user1');
      expect(result).toEqual(mockDocument);
    });

    it('should throw BadRequestException if file is missing', async () => {
      const req = { user: { id: 'user1' } };
      
      await expect(controller.replaceFile('1', undefined as any, req)).rejects.toThrow(BadRequestException);
    });
  });

  describe('archive', () => {
    it('should archive a document', async () => {
      const req = { user: { id: 'user1' } };
      const result = await controller.archive('1', req);
      
      expect(service.archive).toHaveBeenCalledWith('1', 'user1');
      expect(result).toEqual(mockDocument);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a document', async () => {
      const req = { user: { id: 'user1' } };
      const result = await controller.softDelete('1', req);
      
      expect(service.softDelete).toHaveBeenCalledWith('1', 'user1');
      expect(result).toEqual(mockDocument);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete a document', async () => {
      const req = { user: { id: 'user1' } };
      await controller.hardDelete('1', mockResponse as any, req);
      
      expect(service.hardDelete).toHaveBeenCalledWith('1', 'user1');
      expect(mockResponse.status).toHaveBeenCalled();
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });
});
