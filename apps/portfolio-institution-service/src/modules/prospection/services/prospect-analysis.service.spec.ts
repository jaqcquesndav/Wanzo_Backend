import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProspectAnalysisService } from './prospect-analysis.service';
import { ProspectAnalysis, AnalysisType, AnalysisStatus } from '../entities/prospect-analysis.entity';
import { CreateAnalysisDto } from '../dtos/prospect-analysis.dto';
import { NotFoundException } from '@nestjs/common';

describe('ProspectAnalysisService', () => {
  let service: ProspectAnalysisService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProspectAnalysisService,
        {
          provide: getRepositoryToken(ProspectAnalysis),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProspectAnalysisService>(ProspectAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createAnalysisDto: CreateAnalysisDto = {
      type: AnalysisType.FINANCIAL,
      criteria: [
        {
          category: 'profitability',
          weight: 0.4,
          score: 8,
          notes: 'Good profit margins',
        },
      ],
      overallScore: 8.5,
      summary: 'Strong financial position',
      strengths: ['Good profitability', 'Strong cash flow'],
      weaknesses: ['High debt levels'],
      opportunities: ['Market expansion'],
      threats: ['Increasing competition'],
      recommendations: [
        {
          category: 'financial',
          description: 'Reduce debt',
          priority: 'high',
          timeline: '6 months',
        },
      ],
    };

    it('should create an analysis successfully', async () => {
      const prospectId = 'prospect-123';
      const userId = 'user-123';
      const analysis = { id: 'analysis-123', ...createAnalysisDto };

      mockRepository.create.mockReturnValue(analysis);
      mockRepository.save.mockResolvedValue(analysis);

      const result = await service.create(prospectId, createAnalysisDto, userId);

      expect(result).toEqual(analysis);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          prospectId,
          analyzedBy: userId,
          status: AnalysisStatus.IN_PROGRESS,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated analyses', async () => {
      const analyses = [
        { id: 'analysis-1', type: AnalysisType.FINANCIAL },
        { id: 'analysis-2', type: AnalysisType.MARKET },
      ];

      mockRepository.findAndCount.mockResolvedValue([analyses, 2]);

      const result = await service.findAll({}, 1, 10);

      expect(result).toEqual({
        analyses,
        total: 2,
        page: 1,
        perPage: 10,
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        type: AnalysisType.FINANCIAL,
        status: AnalysisStatus.IN_PROGRESS,
        minScore: 7,
      };

      await service.findAll(filters, 1, 10);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          relations: ['prospect'],
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return an analysis if found', async () => {
      const analysis = {
        id: 'analysis-123',
        type: AnalysisType.FINANCIAL,
        prospect: { id: 'prospect-123' },
      };

      mockRepository.findOne.mockResolvedValue(analysis);

      const result = await service.findById('analysis-123');

      expect(result).toEqual(analysis);
    });

    it('should throw NotFoundException if analysis not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update analysis successfully', async () => {
      const analysis = {
        id: 'analysis-123',
        status: AnalysisStatus.IN_PROGRESS,
      };

      const updateDto = {
        status: AnalysisStatus.COMPLETED,
        overallScore: 9,
      };

      mockRepository.findOne.mockResolvedValue(analysis);
      mockRepository.save.mockResolvedValue({ ...analysis, ...updateDto });

      const result = await service.update('analysis-123', updateDto, 'reviewer-123');

      expect(result.status).toBe(AnalysisStatus.COMPLETED);
      expect(result.reviewedBy).toBe('reviewer-123');
    });
  });

  describe('findByProspect', () => {
    it('should return all analyses for a prospect', async () => {
      const analyses = [
        { id: 'analysis-1', type: AnalysisType.FINANCIAL },
        { id: 'analysis-2', type: AnalysisType.MARKET },
      ];

      mockRepository.find.mockResolvedValue(analyses);

      const result = await service.findByProspect('prospect-123');

      expect(result).toEqual(analyses);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { prospectId: 'prospect-123' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getLatestAnalysis', () => {
    it('should return the latest analysis for a prospect', async () => {
      const analysis = {
        id: 'analysis-123',
        type: AnalysisType.FINANCIAL,
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(analysis);

      const result = await service.getLatestAnalysis('prospect-123');

      expect(result).toEqual(analysis);
    });
  });

  describe('calculateAggregateScore', () => {
    it('should calculate weighted average score', async () => {
      const analyses = [
        {
          type: AnalysisType.FINANCIAL,
          overallScore: 8,
        },
        {
          type: AnalysisType.MARKET,
          overallScore: 7,
        },
      ];

      mockRepository.find.mockResolvedValue(analyses);

      const result = await service.calculateAggregateScore('prospect-123');

      // Financial (0.4) * 8 + Market (0.3) * 7 = 3.2 + 2.1 = 5.3
      expect(result).toBeCloseTo(7.5, 1);
    });

    it('should return 0 if no analyses found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.calculateAggregateScore('prospect-123');

      expect(result).toBe(0);
    });
  });
});