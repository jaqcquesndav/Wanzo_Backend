import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentService } from '../services/document.service';
import { Document, DocumentType, DocumentStatus } from '../entities/document.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventsService } from '../../events/events.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock des modules fs et path
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((a, b) => `${a}/${b}`),
  extname: jest.fn((filename) => '.pdf'),
  basename: jest.fn((filename, ext) => 'testfile'),
}));

// Mock pour crypto.randomBytes
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'random123'),
  })),
}));

describe('DocumentService', () => {
  let service: DocumentService;
  let repository: Repository<Document>;
  let eventsService: EventsService;

  // Données de test
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

  const mockFile = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('test file content'),
    size: 1024,
  } as Express.Multer.File;

  // Setup
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: getRepositoryToken(Document),
          useValue: {
            create: jest.fn().mockReturnValue(mockDocument),
            save: jest.fn().mockResolvedValue(mockDocument),
            findOne: jest.fn().mockResolvedValue(mockDocument),
            remove: jest.fn().mockResolvedValue(undefined),
            createQueryBuilder: jest.fn(() => ({
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockDocument]),
            })),
          },
        },
        {
          provide: EventsService,
          useValue: {
            publishDocumentUploaded: jest.fn().mockResolvedValue(undefined),
            publishDocumentUpdated: jest.fn().mockResolvedValue(undefined),
            publishDocumentStatusChanged: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    repository = module.get<Repository<Document>>(getRepositoryToken(Document));
    eventsService = module.get<EventsService>(EventsService);

    // Configurer les mocks par défaut
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // Mock pour générer un nom de fichier unique
    jest.spyOn(Date.prototype, 'getTime').mockReturnValue(123456789);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a document successfully', async () => {
      const createDocumentDto = {
        name: 'Test Document',
        type: DocumentType.CONTRACT,
        description: 'Test description',
        funding_request_id: '1',
        metadata: {
          tags: ['test'],
        },
      };

      const result = await service.create(mockFile, createDocumentDto, 'user1');

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(eventsService.publishDocumentUploaded).toHaveBeenCalled();
      expect(result).toEqual(mockDocument);
    });

    it('should throw BadRequestException if file is missing', async () => {
      const createDocumentDto = {
        name: 'Test Document',
        type: DocumentType.CONTRACT,
        description: 'Test description',
      };

      await expect(service.create(undefined as any, createDocumentDto, 'user1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return an array of documents', async () => {
      const filters = { type: DocumentType.CONTRACT };
      
      const result = await service.findAll(filters);
      
      expect(repository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual([mockDocument]);
    });
  });

  describe('findOne', () => {
    it('should return a document by id', async () => {
      const result = await service.findOne('1');
      
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockDocument);
    });

    it('should throw NotFoundException if document not found', async () => {
      (repository.findOne as jest.Mock).mockResolvedValueOnce(null);
      
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a document', async () => {
      const updateDocumentDto = {
        description: 'Updated description',
        metadata: {
          tags: ['updated'],
        },
      };
      
      const result = await service.update('1', updateDocumentDto);
      
      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(eventsService.publishDocumentUpdated).toHaveBeenCalled();
      expect(result).toEqual(mockDocument);
    });
  });

  describe('replaceFile', () => {
    it('should replace a document file', async () => {
      const result = await service.replaceFile('1', mockFile, 'user1');
      
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(eventsService.publishDocumentUpdated).toHaveBeenCalled();
      expect(result).toEqual(mockDocument);
    });
  });

  describe('archive', () => {
    it('should archive a document', async () => {
      const result = await service.archive('1', 'user1');
      
      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(eventsService.publishDocumentStatusChanged).toHaveBeenCalled();
      expect(result.status).toEqual(DocumentStatus.ARCHIVED);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a document', async () => {
      const result = await service.softDelete('1', 'user1');
      
      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(eventsService.publishDocumentStatusChanged).toHaveBeenCalled();
      expect(result.status).toEqual(DocumentStatus.DELETED);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete a document', async () => {
      await service.hardDelete('1', 'user1');
      
      expect(repository.findOne).toHaveBeenCalled();
      expect(eventsService.publishDocumentStatusChanged).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(repository.remove).toHaveBeenCalled();
    });
  });

  describe('getDocumentContent', () => {
    it('should return the document content', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValueOnce(Buffer.from('file content'));
      
      const result = await service.getDocumentContent('1');
      
      expect(repository.findOne).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(result).toHaveProperty('buffer');
      expect(result).toHaveProperty('document');
    });

    it('should throw NotFoundException if file path is missing', async () => {
      const docWithoutFile = { ...mockDocument, file_path: null };
      (repository.findOne as jest.Mock).mockResolvedValueOnce(docWithoutFile);
      
      await expect(service.getDocumentContent('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if physical file is missing', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      
      await expect(service.getDocumentContent('1')).rejects.toThrow(NotFoundException);
    });
  });
});
