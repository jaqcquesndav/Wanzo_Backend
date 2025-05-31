import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InstitutionUserService } from './institution-user.service';
import { InstitutionUser, UserRole } from '../entities/institution-user.entity';
import { CreateInstitutionUserDto } from '../dtos/institution-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('InstitutionUserService', () => {
  let service: InstitutionUserService;

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
        InstitutionUserService,
        {
          provide: getRepositoryToken(InstitutionUser),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InstitutionUserService>(InstitutionUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateInstitutionUserDto = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      role: UserRole.ANALYST,
      permissions: [
        {
          application: 'portfolios',
          access: 'read',
        },
      ],
    };

    it('should create a user successfully', async () => {
      const institutionId = 'inst-123';
      const createdBy = 'user-123';
      const user = { id: 'user-123', ...createUserDto };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(user);
      mockRepository.save.mockResolvedValue(user);

      const result = await service.create(institutionId, createUserDto, createdBy);

      expect(result).toEqual(user);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createUserDto.name,
          email: createUserDto.email,
          institutionId,
          createdBy,
        }),
      );
    });

    it('should throw ConflictException if email exists', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.create('inst-123', createUserDto, 'user-123'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [
        { id: 'user-1', name: 'User 1' },
        { id: 'user-2', name: 'User 2' },
      ];

      mockRepository.findAndCount.mockResolvedValue([users, 2]);

      const result = await service.findAll('inst-123', 1, 10);

      expect(result).toEqual({
        users,
        total: 2,
        page: 1,
        perPage: 10,
      });
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const user = { id: 'user-123', name: 'John Doe' };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findById('user-123');

      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const user = {
        id: 'user-123',
        name: 'Original Name',
        role: UserRole.ANALYST,
      };

      const updateDto = {
        name: 'Updated Name',
        role: UserRole.MANAGER,
      };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockResolvedValue({ ...user, ...updateDto });

      const result = await service.update('user-123', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(result.role).toBe(UserRole.MANAGER);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      );
    });
  });

  describe('delete', () => {
    it('should deactivate user successfully', async () => {
      const user = {
        id: 'user-123',
        name: 'John Doe',
        active: true,
      };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockResolvedValue({ ...user, active: false });

      const result = await service.delete('user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('User deactivated successfully');
    });
  });

  describe('2FA management', () => {
    it('should enable 2FA', async () => {
      const user = {
        id: 'user-123',
        twoFactorEnabled: false,
      };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockResolvedValue({
        ...user,
        twoFactorEnabled: true,
        twoFactorSecret: 'secret123',
      });

      const result = await service.enable2FA('user-123', 'secret123');

      expect(result.twoFactorEnabled).toBe(true);
      expect(result.twoFactorSecret).toBe('secret123');
    });

    it('should disable 2FA', async () => {
      const user = {
        id: 'user-123',
        twoFactorEnabled: true,
        twoFactorSecret: 'secret123',
      };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockResolvedValue({
        ...user,
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
      });

      const result = await service.disable2FA('user-123');

      expect(result.twoFactorEnabled).toBe(false);
      expect(result.twoFactorSecret).toBeUndefined();
    });
  });
});