import { Test, TestingModule } from '@nestjs/testing';
import { TokenBlacklistService } from './token-blacklist.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { TokenBlacklist } from '@wanzo/shared/security/token-blacklist.entity';
import { TokenBlacklistDto } from '@wanzo/shared/security/token-blacklist.dto';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let repository: Repository<TokenBlacklist>;

  const mockTokenBlacklistRepository = {
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: getRepositoryToken(TokenBlacklist),
          useValue: mockTokenBlacklistRepository,
        },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
    repository = module.get<Repository<TokenBlacklist>>(
      getRepositoryToken(TokenBlacklist),
    );
    
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToBlacklist', () => {
    it('should add a token to the blacklist', async () => {
      const tokenData: TokenBlacklistDto = {
        jti: 'test-jti',
        userId: 'user-123',
        expiresAt: new Date(),
        reason: 'Logout',
      };

      const blacklistEntry = { id: 'entry-1', ...tokenData };
      mockTokenBlacklistRepository.create.mockReturnValue(blacklistEntry);
      mockTokenBlacklistRepository.save.mockResolvedValue(blacklistEntry);

      const result = await service.addToBlacklist(tokenData);

      expect(mockTokenBlacklistRepository.create).toHaveBeenCalledWith(tokenData);
      expect(mockTokenBlacklistRepository.save).toHaveBeenCalledWith(blacklistEntry);
      expect(result).toEqual(blacklistEntry);
    });
  });

  describe('addUserTokensToBlacklist', () => {
    it('should add all user tokens to blacklist with default reason', async () => {
      const userId = 'user-123';
      const entryWithDefaultReason = {
        userId,
        jti: 'all-tokens',
        expiresAt: expect.any(Date),
        reason: 'User status changed',
      };

      mockTokenBlacklistRepository.create.mockReturnValue(entryWithDefaultReason);
      mockTokenBlacklistRepository.save.mockResolvedValue(entryWithDefaultReason);

      await service.addUserTokensToBlacklist(userId);

      expect(mockTokenBlacklistRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          jti: 'all-tokens',
          reason: 'User status changed',
        })
      );
      expect(mockTokenBlacklistRepository.save).toHaveBeenCalledWith(entryWithDefaultReason);
      expect(service['logger'].log).toHaveBeenCalledWith(
        `Adding all tokens for user ${userId} to blacklist. Reason: undefined`
      );
    });

    it('should add all user tokens to blacklist with custom reason', async () => {
      const userId = 'user-123';
      const customReason = 'Account compromised';
      const entryWithCustomReason = {
        userId,
        jti: 'all-tokens',
        expiresAt: expect.any(Date),
        reason: customReason,
      };

      mockTokenBlacklistRepository.create.mockReturnValue(entryWithCustomReason);
      mockTokenBlacklistRepository.save.mockResolvedValue(entryWithCustomReason);

      await service.addUserTokensToBlacklist(userId, customReason);

      expect(mockTokenBlacklistRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          jti: 'all-tokens',
          reason: customReason,
        })
      );
      expect(mockTokenBlacklistRepository.save).toHaveBeenCalledWith(entryWithCustomReason);
      expect(service['logger'].log).toHaveBeenCalledWith(
        `Adding all tokens for user ${userId} to blacklist. Reason: ${customReason}`
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true if token is explicitly blacklisted', async () => {
      const jti = 'test-jti';
      const userId = 'user-123';
      
      mockTokenBlacklistRepository.count.mockResolvedValue(1);

      const result = await service.isTokenBlacklisted(jti, userId);

      expect(mockTokenBlacklistRepository.count).toHaveBeenCalledWith({
        where: [
          { jti, userId },
          { jti: 'all-tokens', userId }
        ]
      });
      expect(result).toBe(true);
    });

    it('should return true if all user tokens are blacklisted', async () => {
      const jti = 'different-jti';
      const userId = 'user-123';
      
      mockTokenBlacklistRepository.count.mockResolvedValue(1); // 'all-tokens' entry exists

      const result = await service.isTokenBlacklisted(jti, userId);

      expect(mockTokenBlacklistRepository.count).toHaveBeenCalledWith({
        where: [
          { jti, userId },
          { jti: 'all-tokens', userId }
        ]
      });
      expect(result).toBe(true);
    });

    it('should return false if token is not blacklisted', async () => {
      const jti = 'valid-jti';
      const userId = 'user-123';
      
      mockTokenBlacklistRepository.count.mockResolvedValue(0);

      const result = await service.isTokenBlacklisted(jti, userId);

      expect(mockTokenBlacklistRepository.count).toHaveBeenCalledWith({
        where: [
          { jti, userId },
          { jti: 'all-tokens', userId }
        ]
      });
      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired blacklisted tokens', async () => {
      const deleteResult = { affected: 5 };
      mockTokenBlacklistRepository.delete.mockResolvedValue(deleteResult);

      await service.cleanupExpiredTokens();

      expect(mockTokenBlacklistRepository.delete).toHaveBeenCalledWith({
        expiresAt: expect.any(LessThanOrEqual),
      });
      expect(service['logger'].log).toHaveBeenCalledWith('Cleaning up expired blacklisted tokens');
      expect(service['logger'].log).toHaveBeenCalledWith('Removed 5 expired blacklisted tokens');
    });

    it('should handle case with no expired tokens', async () => {
      const deleteResult = { affected: 0 };
      mockTokenBlacklistRepository.delete.mockResolvedValue(deleteResult);

      await service.cleanupExpiredTokens();

      expect(mockTokenBlacklistRepository.delete).toHaveBeenCalledWith({
        expiresAt: expect.any(LessThanOrEqual),
      });
      expect(service['logger'].log).toHaveBeenCalledWith('Removed 0 expired blacklisted tokens');
    });
  });
});
