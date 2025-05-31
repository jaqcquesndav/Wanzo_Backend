import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '../services/user.service';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserRole } from '../dtos/user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: UserRole.USER,
      permissions: [],
      companyId: 'company-123',
    };

    it('should create a new user successfully', async () => {
      const user = { id: 'user-123', ...createUserDto };
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(user);
      mockRepository.save.mockResolvedValue(user);

      const result = await service.create(createUserDto);

      expect(result).toEqual(user);
      expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        email: createUserDto.email,
        name: createUserDto.name,
        role: createUserDto.role,
      }));
    });

    it('should throw ConflictException if email already exists', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 'existing-user' });

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const user = { id: 'user-123', name: 'Test User' };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findById('user-123');

      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [
        { id: 'user-1', name: 'User 1' },
        { id: 'user-2', name: 'User 2' },
      ];
      mockRepository.findAndCount.mockResolvedValue([users, 2]);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        users,
        total: 2,
        page: 1,
        perPage: 10,
      });
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
      role: UserRole.MANAGER,
    };

    it('should update user successfully', async () => {
      const existingUser = { 
        id: 'user-123', 
        name: 'Original Name',
        role: UserRole.USER,
      };
      const updatedUser = { 
        ...existingUser,
        ...updateUserDto,
      };

      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('user-123', updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateUserDto));
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', updateUserDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const user = { id: 'user-123', name: 'Test User' };
      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.remove.mockResolvedValue(user);

      const result = await service.delete('user-123');

      expect(result).toEqual({
        success: true,
        message: 'User deleted successfully',
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});