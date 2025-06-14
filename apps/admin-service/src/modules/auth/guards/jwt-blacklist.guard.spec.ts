import { Test, TestingModule } from '@nestjs/testing';
import { JwtBlacklistGuard } from './jwt-blacklist.guard';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { JwtService } from '@nestjs/jwt'; // Import JwtService

describe('JwtBlacklistGuard', () => {
  let guard: JwtBlacklistGuard;
  let httpService: HttpService;
  let configService: ConfigService;
  let jwtService: JwtService; // Declare JwtService

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          authorization: 'Bearer test-token',
        },
      }),
    }),
  } as unknown as ExecutionContext;

  const mockExecutionContextNoToken = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
      }),
    }),
  } as unknown as ExecutionContext;

  const mockJwtService = { // Mock JwtService
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('http://localhost:3000/auth'); // Mock auth service URL

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtBlacklistGuard,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        { // Add JwtService provider
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    guard = module.get<JwtBlacklistGuard>(JwtBlacklistGuard);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService); // Get JwtService instance

    // Ensure mockJwtService.verifyAsync returns a payload with 'sub'
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-id', jti: 'token-id' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if token is not blacklisted', async () => {
    // mockJwtService.verifyAsync is already set up in beforeEach
    mockHttpService.post.mockReturnValue(
      of({ data: { isBlacklisted: false } } as AxiosResponse<any>),
    );
    const canActivate = await guard.canActivate(mockExecutionContext);
    expect(canActivate).toBe(true);
    expect(mockHttpService.post).toHaveBeenCalledWith(
      'http://localhost:3000/auth/token/check-blacklist',
      { jti: 'token-id', userId: 'user-id' }, // Now userId should be 'user-id'
    );
  });

  it('should deny access if token is blacklisted', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-id', jti: 'token-id' });
    mockHttpService.post.mockReturnValue(
      of({ data: { blacklisted: true } } as AxiosResponse<any>), // Changed from isBlacklisted
    );
    // The guard should throw 'Token has been revoked' directly
    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      new UnauthorizedException('Token has been revoked'),
    );
    expect(mockHttpService.post).toHaveBeenCalledWith(
      'http://localhost:3000/auth/token/check-blacklist',
      { jti: 'token-id', userId: 'user-id' }, // Now userId should be 'user-id'
    );
  });

  it('should deny access if auth service call fails', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-id', jti: 'token-id' });
    mockHttpService.post.mockReturnValue(
      throwError(() => new Error('Auth service error')),
    );
    // checkTokenBlacklist's outer catch block throws 'Token validation failed'
    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      new UnauthorizedException('Token validation failed'), // Changed from 'Error validating token with blacklist service'
    );
  });

  it('should deny access if no token is provided', async () => {
    await expect(guard.canActivate(mockExecutionContextNoToken)).rejects.toThrow(
      new UnauthorizedException('No token provided'),
    );
  });

  it('should deny access if authorization header is malformed', async () => {
    const mockExecutionContextMalformedHeader = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Malformed test-token',
          },
        }),
      }),
    } as unknown as ExecutionContext;
    // When the token is malformed (e.g. no 'Bearer ' prefix), extractTokenFromHeader returns undefined.
    // Then the guard throws 'No token provided'.
    await expect(guard.canActivate(mockExecutionContextMalformedHeader)).rejects.toThrow(
      new UnauthorizedException('No token provided'),
    );
  });
  
  it('should throw UnauthorizedException when token is invalid', async () => {
    mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid signature'));
    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      new UnauthorizedException('Invalid token'),
    );
  });

  it('should throw UnauthorizedException when AUTH_SERVICE_URL is not configured', async () => {
    mockConfigService.get.mockReturnValue(null);
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-id', jti: 'token-id' });
    // checkTokenBlacklist's outer catch block throws 'Token validation failed'
    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      new UnauthorizedException('Token validation failed'), // Changed from 'Token validation service not configured'
    );
  });
});
