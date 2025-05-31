import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProspectService } from './prospect.service';
import { Prospect, ProspectStatus, CompanySize, CompanySector } from '../entities/prospect.entity';
import { ProspectDocument } from '../entities/prospect-document.entity';
import { CreateProspectDto } from '../dtos/prospect.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ProspectService', () => {
  let service: ProspectService;

  const mockProspectRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockDocumentRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProspectService,
        {
          provide: getRepositoryToken(Prospect),
          useValue: mockProspectRepository,
        },
        {
          provide: getRepositoryToken(ProspectDocument),
          useValue: mockDocumentRepository,
        },
      ],
    }).compile();

    service = module.get<ProspectService>(ProspectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProspectDto: CreateProspectDto = {
      name: 'Test Company',
      size: CompanySize.SMALL,
      sector: CompanySector.TECHNOLOGY,
      rccm: 'RCCM123',
      idnat: 'IDNAT123',
      nif: 'NIF123',
      address: '123 Test St',
      phone: '+1234567890',
      email: 'test@company.com',
      website: 'https://test.com',
      legalRepresentative: 'John Doe',
      annualRevenue: 1000000,
      employeeCount: 50,
      description: 'Test company description',
      financialData: {
        keyMetrics: {
          currentRatio: 1.5,
          quickRatio: 1.2,
          debtToEquity: 0.8,
        },
        historicalPerformance: [
          {
            year: 2023,
            revenue: 900000,
            profit: 100000,
            assets: 500000,
            liabilities: 300000,
          },
        ],
      },
    };

    it('should create a prospect successfully', async () => {
      const institutionId = 'inst-123';
      const userId = 'user-123';
      const prospect = { id: 'prospect-123', ...createProspectDto };

      mockProspectRepository.create.mockReturnValue(prospect);
      mockProspectRepository.save.mockResolvedValue(prospect);

      const result = await service.create(createProspectDto, institutionId, userId);

      expect(result).toEqual(prospect);
      expect(mockProspectRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createProspectDto.name,
          institutionId,
          createdBy: userId,
          status: ProspectStatus.NEW,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated prospects', async () => {
      const prospects = [
        { id: 'prospect-1', name: 'Company 1' },
        { id: 'prospect-2', name: 'Company 2' },
      ];

      mockProspectRepository.findAndCount.mockResolvedValue([prospects, 2]);

      const result = await service.findAll({}, 1, 10);

      expect(result).toEqual({
        prospects,
        total: 2,
        page: 1,
        perPage: 10,
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        size: CompanySize.SMALL,
        sector: CompanySector.TECHNOLOGY,
        status: ProspectStatus.NEW,
        minRevenue: 1000000,
      };

      await service.findAll(filters, 1, 10);

      expect(mockProspectRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          relations: ['analyses', 'documents'],
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a prospect if found', async () => {
      const prospect = {
        id: 'prospect-123',
        name: 'Test Company',
        analyses: [],
        documents: [],
      };

      mockProspectRepository.findOne.mockResolvedValue(prospect);

      const result = await service.findById('prospect-123');

      expect(result).toEqual(prospect);
    });

    it('should throw NotFoundException if prospect not found', async () => {
      mockProspectRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update prospect successfully', async () => {
      const prospect = {
        id: 'prospect-123',
        name: 'Original Name',
        status: ProspectStatus.NEW,
      };

      const updateDto = {
        name: 'Updated Name',
        status: ProspectStatus.IN_ANALYSIS,
      };

      mockProspectRepository.findOne.mockResolvedValue(prospect);
      mockProspectRepository.save.mockResolvedValue({ ...prospect, ...updateDto });

      const result = await service.update('prospect-123', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(result.status).toBe(ProspectStatus.IN_ANALYSIS);
    });

    it('should validate status transitions', async () => {
      const prospect = {
        id: 'prospect-123',
        status: ProspectStatus.QUALIFIED,
      };

      mockProspectRepository.findOne.mockResolvedValue(prospect);

      await expect(
        service.update('prospect-123', { status: ProspectStatus.NEW }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addDocument', () => {
    it('should add document to prospect', async () => {
      const prospect = { id: 'prospect-123', name: 'Test Company' };
      const document = {
        name: 'Test Document',
        type: 'financial_statement',
        cloudinaryUrl: 'https://example.com/doc.pdf',
      };
      const userId = 'user-123';

      mockProspectRepository.findOne.mockResolvedValue(prospect);
      mockDocumentRepository.create.mockReturnValue({ ...document, id: 'doc-123' });
      mockDocumentRepository.save.mockResolvedValue({ ...document, id: 'doc-123' });

      const result = await service.addDocument('prospect-123', document, userId);

      expect(result.name).toBe('Test Document');
      expect(mockDocumentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          prospectId: prospect.id,
          createdBy: userId,
        }),
      );
    });
  });

  describe('addContactHistory', () => {
    it('should add contact history entry', async () => {
      const prospect = {
        id: 'prospect-123',
        name: 'Test Company',
        contactHistory: [],
      };

      const contact = {
        type: 'meeting',
        notes: 'Initial meeting',
        outcome: 'positive',
        nextSteps: 'Schedule follow-up',
      };

      mockProspectRepository.findOne.mockResolvedValue(prospect);
      mockProspectRepository.save.mockImplementation(p => p);

      const result = await service.addContactHistory('prospect-123', contact);

      expect(result.contactHistory).toHaveLength(1);
      expect(result.contactHistory[0]).toMatchObject({
        ...contact,
        date: expect.any(Date),
      });
    });
  });
});