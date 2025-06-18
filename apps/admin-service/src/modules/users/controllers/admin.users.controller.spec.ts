import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from './admin.users.controller';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserDto, CreateUserDto, UpdateUserDto, UserFilterDto, ToggleStatusDto } from '../dtos';
import { UserRole } from '../entities/enums/user-role.enum';
import { UserStatus } from '../entities/enums/user-status.enum';
import { UserType } from '../entities/enums/user-type.enum';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    resetPassword: jest.fn(),
    toggleUserStatus: jest.fn(),
    getUserActivities: jest.fn(),
    getUserSessions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a list of users', async () => {
      const filterDto: UserFilterDto = { page: 1, limit: 10 };
      const users = [
        {
          id: 'user1',
          name: 'User One',
          email: 'user1@example.com',
          role: UserRole.COMPANY_USER,
          userType: UserType.EXTERNAL,
          status: UserStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
      ];
      const result = { users, totalCount: 1, page: 1, totalPages: 1 };
      
      mockUsersService.findAll.mockResolvedValue(result);
      
      expect(await controller.findAll(filterDto)).toBe(result);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(filterDto);
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
      
      const newUser = {
        id: 'new-user-id',
        ...createUserDto,
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString(),
      };
      
      mockUsersService.create.mockResolvedValue(newUser);
      
      expect(await controller.create(createUserDto)).toBe(newUser);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = 'user-id';
      const user = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.COMPANY_USER,
        userType: UserType.EXTERNAL,
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString(),
      };
      
      mockUsersService.findOne.mockResolvedValue(user);
      
      expect(await controller.findOne(userId)).toBe(user);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };
      
      const updatedUser = {
        id: userId,
        name: updateUserDto.name,
        email: 'test@example.com',
        role: UserRole.COMPANY_USER,
        userType: UserType.EXTERNAL,
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString(),
      };
      
      mockUsersService.update.mockResolvedValue(updatedUser);
      
      expect(await controller.update(userId, updateUserDto)).toBe(updatedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(userId, updateUserDto);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const userId = 'user-id';
      
      mockUsersService.remove.mockResolvedValue(undefined);
      
      await controller.remove(userId);
      expect(mockUsersService.remove).toHaveBeenCalledWith(userId);
    });
  });

  describe('resetPassword', () => {
    it('should reset a user password', async () => {
      const userId = 'user-id';
      const result = { message: 'Password reset initiated' };
      
      mockUsersService.resetPassword.mockResolvedValue(result);
      
      expect(await controller.resetPassword(userId)).toBe(result);
      expect(mockUsersService.resetPassword).toHaveBeenCalledWith(userId);
    });
  });
  describe('toggleUserStatus', () => {
    it('should toggle user status', async () => {
      const userId = 'user-id';
      const toggleStatusDto: ToggleStatusDto = { active: false };
      
      const updatedUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.COMPANY_USER,
        userType: UserType.EXTERNAL,
        status: UserStatus.INACTIVE,
        createdAt: new Date().toISOString(),
      };
      
      mockUsersService.toggleUserStatus.mockResolvedValue(updatedUser);
      
      expect(await controller.toggleUserStatus(userId, toggleStatusDto)).toBe(updatedUser);
      expect(mockUsersService.toggleUserStatus).toHaveBeenCalledWith(userId, toggleStatusDto);
    });
  });

  describe('getUserActivities', () => {
    it('should return user activities', async () => {
      const userId = 'user-id';
      const activities = [{ id: 'activity1', userId, action: 'login', createdAt: new Date().toISOString() }];
      
      mockUsersService.getUserActivities.mockResolvedValue(activities);
      
      expect(await controller.getUserActivities(userId)).toBe(activities);
      expect(mockUsersService.getUserActivities).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions', async () => {
      const userId = 'user-id';
      const sessions = [{ id: 'session1', userId, loginAt: new Date().toISOString() }];
      
      mockUsersService.getUserSessions.mockResolvedValue(sessions);
      
      expect(await controller.getUserSessions(userId)).toBe(sessions);
      expect(mockUsersService.getUserSessions).toHaveBeenCalledWith(userId);
    });
  });
});
