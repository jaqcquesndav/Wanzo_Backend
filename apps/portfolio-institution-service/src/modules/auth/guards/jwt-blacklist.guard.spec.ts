import { Test, TestingModule } from '@nestjs/testing';
import { JwtBlacklistGuard } from './jwt-blacklist.guard';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('JwtBlacklistGuard', () => {
  let guard: JwtBlacklistGuard;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtBlacklistGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    guard = module.get<JwtBlacklistGuard>(JwtBlacklistGuard);

    jest.spyOn(guard['logger'], 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const mockGetRequestFn = jest.fn(); // Define the mock function for getRequest

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: mockGetRequestFn, // Use the dedicated mock function here
      }),
    } as unknown as ExecutionContext;

    const mockRequest: { headers: { authorization?: string }; user?: any } = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };

    const validPayload = {
      sub: 'user-123',
      jti: 'token-jti-123',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    };

    beforeEach(() => {
      mockGetRequestFn.mockReturnValue(mockRequest); // Setup using the dedicated mock function
      mockConfigService.get.mockReturnValue('http://auth-service:3000');
    });

    it('should activate for valid token that is not blacklisted', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(validPayload);
      
      const axiosResponse: AxiosResponse = {
        data: { blacklisted: false },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };
      
      mockHttpService.post.mockReturnValue(of(axiosResponse));

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://auth-service:3000/auth/token/check-blacklist',
        { jti: validPayload.jti, userId: validPayload.sub }
      );
      expect(mockRequest.user).toEqual(validPayload);
    });

    it('should throw UnauthorizedException when token is blacklisted', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(validPayload);
      
      const axiosResponse: AxiosResponse = {
        data: { blacklisted: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };
      
      mockHttpService.post.mockReturnValue(of(axiosResponse));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Token has been revoked')
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://auth-service:3000/auth/token/check-blacklist',
        { jti: validPayload.jti, userId: validPayload.sub }
      );
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      mockRequest.headers.authorization = undefined;

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('No token provided')
      );
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
      expect(mockHttpService.post).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Invalid token')
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
      expect(mockHttpService.post).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when blacklist check fails', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(validPayload);
      
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Invalid token')
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://auth-service:3000/auth/token/check-blacklist',
        { jti: validPayload.jti, userId: validPayload.sub }
      );
      expect(guard['logger'].error).toHaveBeenCalled();
    });

    it('should extract token from Authorization header correctly', async () => {
      mockRequest.headers.authorization = 'Bearer custom-token';
      mockJwtService.verifyAsync.mockResolvedValue(validPayload);
      
      const axiosResponse: AxiosResponse = {
        data: { blacklisted: false },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };
      
      mockHttpService.post.mockReturnValue(of(axiosResponse));

      await guard.canActivate(mockExecutionContext);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('custom-token');
    });

    it('should handle token without jti by using "unknown"', async () => {
      const payloadWithoutJti = { ...validPayload, jti: undefined };
      mockJwtService.verifyAsync.mockResolvedValue(payloadWithoutJti);
      
      const axiosResponse: AxiosResponse = {
        data: { blacklisted: false },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };
      
      mockHttpService.post.mockReturnValue(of(axiosResponse));

      await guard.canActivate(mockExecutionContext);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://auth-service:3000/auth/token/check-blacklist',
        { jti: 'unknown', userId: validPayload.sub }
      );
    });
  });
});
