import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminRoleGuard } from '../admin-role.guard';
import { UserRole } from '../../../system-users/entities/user.entity';
import { jest } from '@jest/globals';

describe('AdminRoleGuard', () => {
  let guard: AdminRoleGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminRoleGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AdminRoleGuard>(AdminRoleGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access to users with ADMIN role', () => {
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: {
              role: UserRole.ADMIN,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access to users with SUPERADMIN role', () => {
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: {
              role: UserRole.SUPERADMIN,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException for users without admin roles', () => {
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: {
              role: UserRole.USER,
            },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is not authenticated', () => {
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: null,
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
    });
  });
});
