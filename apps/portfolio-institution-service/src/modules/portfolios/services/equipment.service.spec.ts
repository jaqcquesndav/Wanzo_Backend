import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EquipmentService } from './equipment.service';
import { Equipment } from '../entities/equipment.entity';
import { CreateEquipmentDto } from '../dtos/equipment.dto';
import { NotFoundException } from '@nestjs/common';

describe('EquipmentService', () => {
  let service: EquipmentService;

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
        EquipmentService,
        {
          provide: getRepositoryToken(Equipment),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createEquipmentDto: CreateEquipmentDto = {
      portfolioId: 'portfolio-123',
      name: 'Test Equipment',
      category: 'Heavy Machinery',
      price: 50000,
      specifications: {
        dimensions: '200x150x100',
        power: '500HP',
        weight: '2000kg',
        fuel: 'Diesel',
      },
      condition: 'new',
      maintenanceIncluded: true,
      insuranceRequired: true,
      imageUrl: 'https://example.com/image.jpg',
    };

    it('should create equipment successfully', async () => {
      const equipment = { id: 'equipment-123', ...createEquipmentDto };

      mockRepository.create.mockReturnValue(equipment);
      mockRepository.save.mockResolvedValue(equipment);

      const result = await service.create(createEquipmentDto);

      expect(result).toEqual(equipment);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createEquipmentDto.name,
          category: createEquipmentDto.category,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated equipment', async () => {
      const equipment = [
        { id: 'equipment-1', name: 'Equipment 1' },
        { id: 'equipment-2', name: 'Equipment 2' },
      ];

      mockRepository.findAndCount.mockResolvedValue([equipment, 2]);

      const result = await service.findAll({}, 1, 10);

      expect(result).toEqual({
        equipment,
        total: 2,
        page: 1,
        perPage: 10,
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        portfolioId: 'portfolio-123',
        category: 'Heavy Machinery',
        condition: 'new',
        availability: true,
      };

      await service.findAll(filters, 1, 10);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining(filters),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return equipment if found', async () => {
      const equipment = { id: 'equipment-123', name: 'Test Equipment' };
      mockRepository.findOne.mockResolvedValue(equipment);

      const result = await service.findById('equipment-123');

      expect(result).toEqual(equipment);
    });

    it('should throw NotFoundException if equipment not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update equipment successfully', async () => {
      const equipment = {
        id: 'equipment-123',
        name: 'Original Name',
        price: 50000,
      };

      const updateDto = {
        name: 'Updated Name',
        price: 55000,
      };

      mockRepository.findOne.mockResolvedValue(equipment);
      mockRepository.save.mockResolvedValue({ ...equipment, ...updateDto });

      const result = await service.update('equipment-123', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(result.price).toBe(55000);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      );
    });
  });

  describe('delete', () => {
    it('should deactivate equipment successfully', async () => {
      const equipment = {
        id: 'equipment-123',
        name: 'Test Equipment',
        availability: true,
      };

      mockRepository.findOne.mockResolvedValue(equipment);
      mockRepository.save.mockResolvedValue({ ...equipment, availability: false });

      const result = await service.delete('equipment-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Equipment deactivated successfully');
    });
  });
});