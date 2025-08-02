import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto, InviteUserDto } from '../dtos/user.dto';
import { UserRole, UserStatus } from '../entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

const mockUserService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  inviteUser: jest.fn(),
  deactivateUser: jest.fn(),
  reinviteUser: jest.fn(),
  getAvailablePermissions: jest.fn(),
  getUserStats: jest.fn(),
};

const mockRequest = {
  user: {
    sub: 'user-123',
    organizationId: 'org-456'
  }
};

describe('UserController', () => {
  let controller: UserController;
  let userService: typeof mockUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ACCOUNTANT,
        organizationId: 'org-456',
        permissions: ['view_journals']
      };

      const mockUser = {
        id: 'user-123',
        ...createUserDto,
        status: UserStatus.ACTIVE
      };

      userService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto, mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(userService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should handle creation errors', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ACCOUNTANT,
        organizationId: 'org-456'
      };

      userService.create.mockRejectedValue(new Error('Email already exists'));

      const result = await controller.create(createUserDto, mockRequest as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
    });
  });

  describe('invite', () => {
    it('should invite a new user', async () => {
      const inviteUserDto: InviteUserDto = {
        email: 'invite@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.VIEWER
      };

      const mockInvitedUser = {
        id: 'user-456',
        ...inviteUserDto,
        organizationId: 'org-456',
        status: UserStatus.PENDING
      };

      userService.inviteUser.mockResolvedValue(mockInvitedUser);

      const result = await controller.invite(inviteUserDto, mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvitedUser);
      expect(userService.inviteUser).toHaveBeenCalledWith(
        'org-456',
        inviteUserDto,
        'user-123'
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const query: UserQueryDto = {
        page: 1,
        pageSize: 20,
        role: UserRole.ACCOUNTANT
      };

      const mockResult = {
        users: [
          { id: 'user-1', email: 'user1@example.com', role: UserRole.ACCOUNTANT },
          { id: 'user-2', email: 'user2@example.com', role: UserRole.ACCOUNTANT }
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 2,
          totalPages: 1
        }
      };

      userService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query, mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(userService.findAll).toHaveBeenCalledWith('org-456', query);
    });
  });

  describe('findOne', () => {
    it('should return a specific user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      userService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-123', mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(userService.findOne).toHaveBeenCalledWith('user-123', 'org-456');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated Name',
        role: UserRole.ADMIN
      };

      const mockUpdatedUser = {
        id: 'user-123',
        firstName: 'Updated Name',
        role: UserRole.ADMIN
      };

      userService.update.mockResolvedValue(mockUpdatedUser);

      const result = await controller.update('user-123', updateUserDto, mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedUser);
      expect(userService.update).toHaveBeenCalledWith('user-123', 'org-456', updateUserDto);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a user', async () => {
      const mockDeactivatedUser = {
        id: 'user-123',
        status: UserStatus.INACTIVE
      };

      userService.deactivateUser.mockResolvedValue(mockDeactivatedUser);

      const result = await controller.deactivate('user-123', mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Utilisateur désactivé avec succès');
      expect(userService.deactivateUser).toHaveBeenCalledWith('user-123', 'org-456');
    });
  });

  describe('reinvite', () => {
    it('should reinvite a user', async () => {
      userService.reinviteUser.mockResolvedValue(undefined);

      const result = await controller.reinvite('user-123', mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Invitation renvoyée avec succès');
      expect(userService.reinviteUser).toHaveBeenCalledWith('user-123', 'org-456', 'user-123');
    });
  });

  describe('getPermissions', () => {
    it('should return available permissions', async () => {
      const mockPermissions = [
        {
          code: 'view_journals',
          name: 'Consulter les journaux',
          category: 'journals'
        },
        {
          code: 'create_entries',
          name: 'Créer des écritures',
          category: 'journals'
        }
      ];

      userService.getAvailablePermissions.mockResolvedValue(mockPermissions);

      const result = await controller.getPermissions();

      expect(result.success).toBe(true);
      expect(result.data?.permissions).toEqual(mockPermissions);
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        totalUsers: 10,
        activeUsers: 8,
        pendingUsers: 1,
        inactiveUsers: 1
      };

      userService.getUserStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(mockRequest as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
      expect(userService.getUserStats).toHaveBeenCalledWith('org-456');
    });
  });
});
