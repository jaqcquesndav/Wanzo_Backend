import { Test, TestingModule } from '@nestjs/testing';
import { AdhaContextService } from './adha-context.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdhaContextSource } from '../entities/adha-context.entity';
import { Repository } from 'typeorm';

const mockAdhaContextRepository = {
  createQueryBuilder: jest.fn(() => ({
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(1),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([{ id: '1', name: 'test' }]),
  })),
};

describe('AdhaContextService', () => {
  let service: AdhaContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdhaContextService,
        {
          provide: getRepositoryToken(AdhaContextSource),
          useValue: mockAdhaContextRepository,
        },
      ],
    }).compile();

    service = module.get<AdhaContextService>(AdhaContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of adha contexts with pagination', async () => {
      const query = { page: 1, pageSize: 10 };
      
      const result = await service.findAll(query);

      expect(result.data).toEqual([{ id: '1', name: 'test' }]);
      expect(result.pagination.totalItems).toBe(1);
      expect(mockAdhaContextRepository.createQueryBuilder).toHaveBeenCalledWith('source');
    });
  });
});
