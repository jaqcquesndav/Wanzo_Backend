import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../../services/user.service';
import { SyncUserDto } from '../../dto/sync-user.dto';
import {
  UpdateUserDto,
  UserResponseDto,
  UploadIdentityDocumentDto,
  UserPreferencesDto,
  ApiResponseDto
} from '../../dto/user.dto';
import {
  UserRole,
  UserType,
  IdStatus,
  IdType,
} from '../../entities/user.entity';
import { jest } from '@jest/globals';
import { MulterFile } from '../../../cloudinary/cloudinary.service';

const mockUserService = () => ({
  syncUser: jest.fn(),
  findByAuth0Id: jest.fn(),
  update: jest.fn(),
  changeUserType: jest.fn(),
  uploadIdentityDocument: jest.fn(),
  updateUserPreferences: jest.fn(),
  remove: jest.fn(),
});

const mockUserResponse: UserResponseDto = {
  id: 'user-id',
  email: 'test@example.com',
  emailVerified: true,
  name: 'Test User',
  phone: '1234567890',
  phoneVerified: false,
  userType: UserType.CUSTOMER,
  role: UserRole.USER,
  isCompanyOwner: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  idStatus: IdStatus.PENDING,
  settings: {
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    preferences: {
      language: 'en',
    },
  },
};

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useFactory: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService) as jest.Mocked<UserService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('syncUser', () => {
    it('should sync a user and return user data', async () => {
      const syncUserDto: SyncUserDto = {
        auth0Id: 'auth0|12345',
        email: 'test@example.com',
        name: 'Test User',
      };
      const req = { user: { sub: 'auth0|12345' } };

      userService.syncUser.mockResolvedValue(mockUserResponse);

      const result: ApiResponseDto<UserResponseDto> = await controller.syncUser(
        syncUserDto,
        req,
      );

      expect(userService.syncUser).toHaveBeenCalledWith(syncUserDto);
      expect(result.data.id).toEqual(mockUserResponse.id);
      expect(result.success).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it("should return the current user's data", async () => {
      const req = { user: { sub: 'auth0|12345' } };
      userService.findByAuth0Id.mockResolvedValue(mockUserResponse);

      const result = await controller.getCurrentUser(req);

      expect(userService.findByAuth0Id).toHaveBeenCalledWith(req.user.sub);
      expect(result.data.id).toEqual(mockUserResponse.id);
    });
  });

  describe('updateCurrentUser', () => {
    it("should update the current user's data", async () => {
      const req = { user: { sub: 'auth0|12345' } };
      const updateUserDto: UpdateUserDto = { name: 'Updated Name' };
      const updatedUser = { ...mockUserResponse, ...updateUserDto };

      userService.findByAuth0Id.mockResolvedValue(mockUserResponse);
      userService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateCurrentUser(updateUserDto, req);

      expect(userService.update).toHaveBeenCalledWith(
        mockUserResponse.id,
        updateUserDto,
      );
      expect(result.data.name).toEqual(updatedUser.name);
    });
  });

  describe('changeUserType', () => {
    it('should update the user type', async () => {
      const req = { user: { sub: 'auth0|12345' } };
      const body = { userType: UserType.SME };
      const updatedUser = {
        id: mockUserResponse.id,
        userType: UserType.SME,
      };

      userService.findByAuth0Id.mockResolvedValue(mockUserResponse);
      userService.changeUserType.mockResolvedValue(updatedUser as any);

      const result = await controller.changeUserType(body, req);

      expect(userService.changeUserType).toHaveBeenCalledWith(
        mockUserResponse.id,
        body.userType,
      );
      expect(result.data.userType).toEqual(updatedUser.userType);
    });
  });

  describe('uploadIdentityDocument', () => {
    it('should upload an identity document', async () => {
      const req = { user: { sub: 'auth0|12345' } };
      const file: MulterFile = {
        fieldname: 'file',
        originalname: 'id.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 4,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };
      const dto: UploadIdentityDocumentDto = {
        idType: IdType.PASSPORT,
      };
      const updatedResult = { 
        idStatus: IdStatus.PENDING, 
        documentUrl: 'http://example.com/doc.jpg', 
        idType: IdType.PASSPORT,
        url: 'http://example.com/doc.jpg'
      };

      userService.findByAuth0Id.mockResolvedValue(mockUserResponse);
      userService.uploadIdentityDocument.mockResolvedValue(updatedResult);

      const result = await controller.uploadIdentityDocument(dto, file, req);

      expect(userService.uploadIdentityDocument).toHaveBeenCalledWith(
        mockUserResponse.id,
        file,
        dto.idType,
      );
      expect(result.data.url).toEqual(updatedResult.url);
      expect(result.data.documentType).toEqual(updatedResult.idType);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const req = { user: { sub: 'auth0|12345' } };
      const dto: UserPreferencesDto = {
        notifications: { email: false, sms: true, push: false },
        language: 'fr'
      };
      const updatedUser = {
        ...mockUserResponse,
        settings: { ...mockUserResponse.settings, preferences: { language: 'fr' } },
      };

      userService.findByAuth0Id.mockResolvedValue(mockUserResponse);
      userService.updateUserPreferences.mockResolvedValue(updatedUser);

      const result = await controller.updatePreferences(dto, req);

      expect(userService.updateUserPreferences).toHaveBeenCalledWith(
        mockUserResponse.id,
        dto,
      );
      expect(result.data.settings.preferences.language).toEqual(updatedUser.settings.preferences.language);
    });
  });
});
