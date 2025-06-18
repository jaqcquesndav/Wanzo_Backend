import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserDto, UpdateUserDto } from '../dtos';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { UserRole } from '../entities/enums/user-role.enum';
import { UserStatus } from '../entities/enums/user-status.enum';
import { UserType } from '../entities/enums/user-type.enum';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('getProfile', () => {    it('should return user profile', async () => {
      const user: UserDto = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.COMPANY_USER,
        userType: UserType.EXTERNAL,
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString(),
      };
      
      const expectedProfile = { ...user };
      mockUsersService.getProfile.mockResolvedValue(expectedProfile);

      const result = await controller.getProfile(user);
      
      expect(result).toEqual(expectedProfile);
      expect(mockUsersService.getProfile).toHaveBeenCalledWith(user.id);
    });
  });
  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const user: UserDto = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.COMPANY_USER,
        userType: UserType.EXTERNAL,
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString(),
      };
      
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        phoneNumber: '1234567890',
      };
      
      const updatedUser = {
        ...user,
        name: updateUserDto.name,
        phoneNumber: updateUserDto.phoneNumber,
      };
      
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(user, updateUserDto);
      
      expect(result).toEqual(updatedUser);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(user.id, updateUserDto);
    });
  });

  describe('changePassword', () => {    it('should change user password', async () => {
      const user: UserDto = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.COMPANY_USER,
        userType: UserType.EXTERNAL,
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString(),
      };
      
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword',
        confirmPassword: 'newPassword',
      };
      
      mockUsersService.changePassword.mockResolvedValue(undefined);

      const result = await controller.changePassword(user, changePasswordDto);
      
      expect(result).toEqual({ message: 'Password changed successfully.' });
      expect(mockUsersService.changePassword).toHaveBeenCalledWith(
        user.id,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );
    });
  });
});
