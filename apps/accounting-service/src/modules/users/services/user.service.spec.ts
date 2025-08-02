import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserQueryDto, InviteUserDto } from '../dtos/user.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

const createMockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  })),
});

describe('UserService', () => {
  let service: UserService;
  let userRepository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    userRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ACCOUNTANT,
        organizationId: 'org-1',
        permissions: ['view_journals']
      };

      const mockUser = {
        id: 'user-1',
        ...createUserDto,
        status: UserStatus.ACTIVE
      };

      userRepository.findOne.mockResolvedValue(null); // No existing user
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email }
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        status: UserStatus.ACTIVE
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ACCOUNTANT,
        organizationId: 'org-1'
      };

      userRepository.findOne.mockResolvedValue({ id: 'existing-user' });

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users with filters', async () => {
      const organizationId = 'org-1';
      const query: UserQueryDto = {
        page: 1,
        pageSize: 10,
        role: UserRole.ACCOUNTANT,
        status: UserStatus.ACTIVE
      };

      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com', role: UserRole.ACCOUNTANT },
        { id: 'user-2', email: 'user2@example.com', role: UserRole.ACCOUNTANT }
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockUsers, 2])
      };

      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(organizationId, query);

      expect(result.users).toEqual(mockUsers);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return a user by id and organizationId', async () => {
      const userId = 'user-1';
      const organizationId = 'org-1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        organizationId
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(userId, organizationId);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, organizationId }
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = 'user-1';
      const organizationId = 'org-1';
      const updateDto: UpdateUserDto = {
        firstName: 'Updated Name',
        role: UserRole.ADMIN
      };

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        organizationId,
        firstName: 'Old Name'
      };

      const updatedUser = { ...mockUser, ...updateDto };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(userId, organizationId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('inviteUser', () => {
    it('should invite a new user', async () => {
      const organizationId = 'org-1';
      const inviteDto: InviteUserDto = {
        email: 'invite@example.com',
        firstName: 'Invited',
        lastName: 'User',
        role: UserRole.VIEWER
      };
      const invitedBy = 'admin-user';

      const mockInvitedUser = {
        id: 'invited-user',
        ...inviteDto,
        organizationId,
        status: UserStatus.PENDING,
        invitedBy,
        invitedAt: new Date()
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockInvitedUser);
      userRepository.save.mockResolvedValue(mockInvitedUser);

      const result = await service.inviteUser(organizationId, inviteDto, invitedBy);

      expect(result).toEqual(mockInvitedUser);
      expect(result.status).toBe(UserStatus.PENDING);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate a user', async () => {
      const userId = 'user-1';
      const organizationId = 'org-1';
      const mockUser = {
        id: userId,
        status: UserStatus.ACTIVE,
        organizationId
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        status: UserStatus.INACTIVE
      });

      const result = await service.deactivateUser(userId, organizationId);

      expect(result.status).toBe(UserStatus.INACTIVE);
    });
  });

  describe('reinviteUser', () => {
    it('should reinvite a pending user', async () => {
      const userId = 'user-1';
      const organizationId = 'org-1';
      const invitedBy = 'admin-user';
      const mockUser = {
        id: userId,
        email: 'pending@example.com',
        status: UserStatus.PENDING,
        organizationId
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ affected: 1 });

      await service.reinviteUser(userId, organizationId, invitedBy);

      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        invitedBy,
        invitedAt: expect.any(Date)
      });
    });

    it('should throw ConflictException for non-pending users', async () => {
      const mockUser = {
        id: 'user-1',
        status: UserStatus.ACTIVE,
        organizationId: 'org-1'
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.reinviteUser('user-1', 'org-1', 'admin')
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getAvailablePermissions', () => {
    it('should return predefined permissions', async () => {
      const permissions = await service.getAvailablePermissions();

      expect(permissions).toHaveLength(6);
      expect(permissions[0]).toEqual({
        code: "view_journals",
        name: "Consulter les journaux",
        category: "journals"
      });
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const organizationId = 'org-1';
      
      userRepository.count
        .mockResolvedValueOnce(10) // total users
        .mockResolvedValueOnce(7)  // active users
        .mockResolvedValueOnce(2)  // pending users
        .mockResolvedValueOnce(1); // inactive users

      const result = await service.getUserStats(organizationId);

      expect(result).toEqual({
        totalUsers: 10,
        activeUsers: 7,
        pendingUsers: 2,
        inactiveUsers: 1
      });
    });
  });
});
