import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { TokenBlacklist } from '../entities/token-blacklist.entity';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Partial<Repository<User>>;
  let tokenBlacklistRepository: Partial<Repository<TokenBlacklist>>;
  let jwtService: JwtService;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    tokenBlacklistRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(TokenBlacklist),
          useValue: tokenBlacklistRepository,
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'AUTH0_DOMAIN') return 'https://example.auth0.com';
              if (key === 'AUTH0_AUDIENCE') return 'https://api.example.com';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUserById', () => {
    it('should return user when found', async () => {
      const userId = 'user-id';
      const mockUser = { id: userId, email: 'user@example.com' } as User;
      
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      
      const result = await service.validateUserById(userId);
      
      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });
    
    it('should return null when user not found', async () => {
      const userId = 'non-existent-id';
      
      userRepository.findOne = jest.fn().mockResolvedValue(null);
      
      const result = await service.validateUserById(userId);
      
      expect(result).toBeNull();
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });
  });

  describe('getUserByAuth0Id', () => {
    it('should return user when found', async () => {
      const auth0Id = 'auth0|123456';
      const mockUser = { id: 'user-id', auth0Id, email: 'user@example.com' } as User;
      
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      
      const result = await service.getUserByAuth0Id(auth0Id);
      
      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { auth0Id } });
    });
    
    it('should return null when user not found', async () => {
      const auth0Id = 'auth0|non-existent';
      
      userRepository.findOne = jest.fn().mockResolvedValue(null);
      
      const result = await service.getUserByAuth0Id(auth0Id);
      
      expect(result).toBeNull();
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { auth0Id } });
    });
  });

  describe('validateToken', () => {
    it('should reject blacklisted token', async () => {
      const token = 'blacklisted-token';
      
      tokenBlacklistRepository.findOne = jest.fn().mockResolvedValue({ id: 'blacklist-id', token });
      
      const result = await service.validateToken(token);
      
      expect(result).toEqual({ isValid: false, error: 'Token révoqué' });
      expect(tokenBlacklistRepository.findOne).toHaveBeenCalledWith({ where: { token } });
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile when found', async () => {
      const userId = 'user-id';
      const mockUser = { 
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: UserRole.ADMIN,
        profilePicture: 'https://example.com/profile.jpg',
        organizationId: 'org-id',
        permissions: ['read:accounts', 'write:accounts'],
        createdAt: new Date(),
        updatedAt: new Date()
      } as User;
      
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      
      const result = await service.getUserProfile(userId);
      
      expect(result).toEqual({
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: UserRole.ADMIN,
        profilePicture: 'https://example.com/profile.jpg',
        organizationId: 'org-id',
        permissions: ['read:accounts', 'write:accounts'],
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });
    
    it('should throw NotFoundException when user not found', async () => {
      const userId = 'non-existent-id';
      
      userRepository.findOne = jest.fn().mockResolvedValue(null);
      
      await expect(service.getUserProfile(userId)).rejects.toThrow(
        new NotFoundException(`Utilisateur avec ID ${userId} non trouvé`)
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const userId = 'user-id';
      const updateData = {
        firstName: 'Updated',
        lastName: 'User',
        phoneNumber: '+123456789'
      };
      
      const existingUser = { 
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+987654321'
      } as User;
      
      const updatedUser = { 
        ...existingUser,
        ...updateData
      };
      
      userRepository.findOne = jest.fn().mockResolvedValue(existingUser);
      userRepository.save = jest.fn().mockResolvedValue(updatedUser);
      
      // Mock getUserProfile
      jest.spyOn(service, 'getUserProfile').mockResolvedValue({
        id: userId,
        firstName: 'Updated',
        lastName: 'User',
        email: 'john.doe@example.com',
        phoneNumber: '+123456789'
      });
      
      const result = await service.updateUserProfile(userId, updateData);
      
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: userId,
        firstName: 'Updated',
        lastName: 'User',
        phoneNumber: '+123456789'
      }));
      expect(service.getUserProfile).toHaveBeenCalledWith(userId);
    });
    
    it('should throw NotFoundException when user not found', async () => {
      const userId = 'non-existent-id';
      const updateData = { firstName: 'Updated' };
      
      userRepository.findOne = jest.fn().mockResolvedValue(null);
      
      await expect(service.updateUserProfile(userId, updateData)).rejects.toThrow(
        new NotFoundException(`Utilisateur avec ID ${userId} non trouvé`)
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('invalidateSession', () => {
    it('should add token to blacklist', async () => {
      const token = 'valid-token';
      const blacklistEntry = { id: 'blacklist-id', token, invalidatedAt: expect.any(Date) };
      
      tokenBlacklistRepository.create = jest.fn().mockReturnValue(blacklistEntry);
      tokenBlacklistRepository.save = jest.fn().mockResolvedValue(blacklistEntry);
      
      await service.invalidateSession(token);
      
      expect(tokenBlacklistRepository.create).toHaveBeenCalledWith({
        token,
        invalidatedAt: expect.any(Date)
      });
      expect(tokenBlacklistRepository.save).toHaveBeenCalledWith(blacklistEntry);
    });
  });
});
