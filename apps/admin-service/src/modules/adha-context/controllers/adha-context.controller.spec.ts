import { Test, TestingModule } from '@nestjs/testing';
import { AdhaContextController } from './adha-context.controller';
import { AdhaContextService } from '../services/adha-context.service';
import { AdhaContextQueryDto } from '../dtos/adha-context.dto';
import { AdhaContextSource, AdhaContextType, ZoneCibleType } from '../entities/adha-context.entity';

const mockAdhaContextService = {
  findAll: jest.fn(),
};

describe('AdhaContextController', () => {
  let controller: AdhaContextController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdhaContextController],
      providers: [
        {
          provide: AdhaContextService,
          useValue: mockAdhaContextService,
        },
      ],
    }).compile();

    controller = module.get<AdhaContextController>(AdhaContextController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call the service, format the data and return the result', async () => {
      const query = new AdhaContextQueryDto();
      const now = new Date();
      const source: AdhaContextSource = {
        id: '1',
        titre: 'Test',
        description: 'Test desc',
        type: AdhaContextType.AUTRE,
        domaine: ['test'],
        zoneCible: [{ type: ZoneCibleType.PAYS, value: 'France' }],
        niveau: 'National',
        canExpire: false,
        dateDebut: now,
        dateFin: now,
        url: 'http://test.com',
        downloadUrl: 'http://download.com',
        coverImageUrl: 'http://image.com',
        tags: ['tag1'],
        active: true,
        createdAt: now,
        updatedAt: now,
      };
      const serviceResult = { data: [source], pagination: { totalItems: 1 } };
      mockAdhaContextService.findAll.mockResolvedValue(serviceResult);

      const expectedResult = {
        data: [
          {
            ...source,
            dateDebut: now.toISOString(),
            dateFin: now.toISOString(),
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
        ],
        pagination: { totalItems: 1 },
      };

      expect(await controller.findAll(query)).toEqual(expectedResult);
      expect(mockAdhaContextService.findAll).toHaveBeenCalledWith(query);
    });
  });
});
