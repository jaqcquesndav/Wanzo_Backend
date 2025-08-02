import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { UserSession, UserActivity, RolePermission } from '../entities/user-related.entity';
import { EventsService } from '../../events/events.service';
import { UserRole } from '../entities/enums/user-role.enum';
import { UserStatus } from '../entities/enums/user-status.enum';
import { UserType } from '../entities/enums/user-type.enum';
import { CreateUserDto, UpdateUserDto, ToggleStatusDto } from '../dtos';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => 'hashed_password'),
  compare: jest.fn(() => true),
}));

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepository = <T = any>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),    getOne: jest.fn().mockResolvedValue(undefined),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getCount: jest.fn().mockResolvedValue(1),
  })),
  count: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;
  let sessionRepository: MockRepository<UserSession>;
  let activityRepository: MockRepository<UserActivity>;
  let rolePermissionRepository: MockRepository<RolePermission>;
  let eventsService: Partial<EventsService>;

  beforeEach(async () => {
    userRepository = createMockRepository();
    sessionRepository = createMockRepository();
    activityRepository = createMockRepository();
    rolePermissionRepository = createMockRepository();
    
    eventsService = {
      emit: jest.fn(),
      publishUserCreated: jest.fn(),
      publishUserUpdated: jest.fn(),
      publishUserDeleted: jest.fn(),
      publishUserStatusChanged: jest.fn(),
      publishUserRoleChanged: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(UserSession), useValue: sessionRepository },
        { provide: getRepositoryToken(UserActivity), useValue: activityRepository },
        { provide: getRepositoryToken(RolePermission), useValue: rolePermissionRepository },
        { provide: EventsService, useValue: eventsService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.COMPANY_USER,
        userType: UserType.EXTERNAL,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
      };
      
      userRepository.findOne.mockResolvedValue(mockUser);
      
      const result = await service.findOne(userId);
      
      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      
      userRepository.findOne.mockResolvedValue(null);
      
      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });
  });
  describe('findAll', () => {
    it('should return users with pagination', async () => {
      const filterDto = { page: 1, limit: 10 };
      const mockUsers = [
        {
          id: 'user1',
          name: 'User One',
          email: 'user1@example.com',
          role: UserRole.COMPANY_USER,
          userType: UserType.EXTERNAL,
          status: UserStatus.ACTIVE,
          createdAt: new Date(),
        },
      ];
      
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUsers),
        getOne: jest.fn().mockResolvedValue(undefined),
        getManyAndCount: jest.fn().mockResolvedValue([mockUsers, 1]),
        getCount: jest.fn().mockResolvedValue(1),
      };
      
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      
      const result = await service.findAll(filterDto);
      
      expect(result.items.length).toBe(1);
      expect(result.totalCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(userRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: UserRole.COMPANY_USER,
        userType: UserType.EXTERNAL,
      };
      
      userRepository.findOne.mockResolvedValue(null); // No existing user with same email
      
      const newUser = {
        id: 'new-user-id',
        ...createUserDto,
        password: 'hashed_password', // Hashed by bcrypt
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
      };
      
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);
      
      const result = await service.create(createUserDto);
      
      expect(result).toMatchObject({
        id: 'new-user-id',
        name: createUserDto.name,
        email: createUserDto.email,
        role: createUserDto.role,
        userType: createUserDto.userType,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(eventsService.publishUserCreated).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
        role: UserRole.COMPANY_USER,
        userType: UserType.EXTERNAL,
      };
      
      // Mock existing user with same email
      userRepository.findOne.mockResolvedValue({
        id: 'existing-id',
        email: createUserDto.email,
      });
      
      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };
      
      const existingUser = {
        id: userId,
        name: 'Original Name',
        email: 'test@example.com',
        role: UserRole.COMPANY_USER,
        userType: UserType.EXTERNAL,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
      };
      
      const updatedUser = {
        ...existingUser,
        name: updateUserDto.name,
      };
      
      userRepository.findOne.mockResolvedValue(existingUser);
      userRepository.save.mockResolvedValue(updatedUser);
      
      const result = await service.update(userId, updateUserDto);
      
      expect(result.name).toBe(updateUserDto.name);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.save).toHaveBeenCalled();
      expect(eventsService.publishUserUpdated).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };
      
      userRepository.findOne.mockResolvedValue(null);
      
      await expect(service.update(userId, updateUserDto)).rejects.toThrow(NotFoundException);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });
  describe('remove', () => {
    it('should remove a user', async () => {
      const userId = 'user-id';      const existingUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.COMPANY_USER,
        userType: UserType.INTERNAL,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
      };
      
      userRepository.findOne.mockResolvedValue(existingUser);
      userRepository.remove.mockResolvedValue(existingUser);
      
      await service.remove(userId);
      
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.remove).toHaveBeenCalledWith(existingUser);
      expect(eventsService.publishUserDeleted).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      
      userRepository.findOne.mockResolvedValue(null);
      
      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.remove).not.toHaveBeenCalled();
    });
  });  describe('toggleUserStatus', () => {
    it('should toggle user status', async () => {
      const userId = 'user-id';
      const toggleStatusDto: ToggleStatusDto = { active: false };
      
      const existingUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        status: UserStatus.ACTIVE,
        userType: UserType.INTERNAL,
        role: UserRole.COMPANY_USER,
        createdAt: new Date()
      };
      
      const updatedUser = {
        ...existingUser,
        status: UserStatus.INACTIVE,
      };
      
      userRepository.findOne.mockResolvedValue(existingUser);
      userRepository.save.mockResolvedValue(updatedUser);
      
      const result = await service.toggleUserStatus(userId, toggleStatusDto);
      
      expect(result.status).toBe(UserStatus.INACTIVE);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.save).toHaveBeenCalled();
      expect(eventsService.publishUserStatusChanged).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      const toggleStatusDto: ToggleStatusDto = { active: false };
      
      userRepository.findOne.mockResolvedValue(null);
      
      await expect(service.toggleUserStatus(userId, toggleStatusDto)).rejects.toThrow(NotFoundException);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });  describe('changePassword', () => {
    it('should change user password', async () => {
      const userId = 'user-id';
      const currentPassword = 'oldPassword';
      const newPassword = 'newPassword';
      
      const existingUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_old_password',
        role: UserRole.COMPANY_USER,
        userType: UserType.INTERNAL,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
      };
      
      const updatedUser = {
        ...existingUser,
        password: 'hashed_password', // New hashed password
      };
      
      userRepository.findOne.mockResolvedValue(existingUser);
      userRepository.save.mockResolvedValue(updatedUser);
      
      await service.changePassword(userId, currentPassword, newPassword);
      
      // Make sure we're expecting the right parameters in the test
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, 'hashed_old_password');
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      const currentPassword = 'oldPassword';
      const newPassword = 'newPassword';
      
      userRepository.findOne.mockResolvedValue(null);
      
      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toThrow(NotFoundException);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      const userId = 'user-id';
      const currentPassword = 'wrongPassword';
      const newPassword = 'newPassword';
      
      const existingUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_old_password',
      };
      
      userRepository.findOne.mockResolvedValue(existingUser);
      
      // Mock bcrypt.compare to return false (wrong password)
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      
      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toThrow(BadRequestException);
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, existingUser.password);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });
});
