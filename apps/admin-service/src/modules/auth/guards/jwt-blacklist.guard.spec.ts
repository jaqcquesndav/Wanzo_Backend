import { Test, TestingModule } from '@nestjs/testing';
import { JwtBlacklistGuard } from './jwt-blacklist.guard';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('JwtBlacklistGuard', () => {
  let guard: JwtBlacklistGuard;
  let httpService: HttpService;
  let configService: ConfigService;

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
      ],
    }).compile();

    guard = module.get<JwtBlacklistGuard>(JwtBlacklistGuard);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if token is not blacklisted', async () => {
    mockHttpService.post.mockReturnValue(
      of({ data: { isBlacklisted: false } } as AxiosResponse<any>),
    );
    const canActivate = await guard.canActivate(mockExecutionContext);
    expect(canActivate).toBe(true);
    expect(mockHttpService.post).toHaveBeenCalledWith(
      'http://localhost:3000/auth/token/check-blacklist',
      { token: 'test-token' },
    );
  });

  it('should deny access if token is blacklisted', async () => {
    mockHttpService.post.mockReturnValue(
      of({ data: { isBlacklisted: true } } as AxiosResponse<any>),
    );
    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      new UnauthorizedException('Token is blacklisted'),
    );
    expect(mockHttpService.post).toHaveBeenCalledWith(
      'http://localhost:3000/auth/token/check-blacklist',
      { token: 'test-token' },
    );
  });

  it('should deny access if auth service call fails', async () => {
    mockHttpService.post.mockReturnValue(
      throwError(() => new Error('Auth service error')),
    );
    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      new UnauthorizedException('Error validating token with auth service'),
    );
  });

  it('should deny access if no token is provided', async () => {
    await expect(guard.canActivate(mockExecutionContextNoToken)).rejects.toThrow(
      new UnauthorizedException('No token provided'),
    );
    expect(mockHttpService.post).not.toHaveBeenCalled();
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
    await expect(guard.canActivate(mockExecutionContextMalformedHeader)).rejects.toThrow(
      new UnauthorizedException('Invalid token format'),
    );
    expect(mockHttpService.post).not.toHaveBeenCalled();
  });

  it('should use AUTH_SERVICE_URL from config', async () => {
    mockConfigService.get.mockReturnValue('http://custom-auth-url/api');
    mockHttpService.post.mockReturnValue(
      of({ data: { isBlacklisted: false } } as AxiosResponse<any>),
    );
    await guard.canActivate(mockExecutionContext);
    expect(mockHttpService.post).toHaveBeenCalledWith(
      'http://custom-auth-url/api/token/check-blacklist',
      { token: 'test-token' },
    );
  });
});
