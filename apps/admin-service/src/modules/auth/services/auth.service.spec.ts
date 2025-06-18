import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: {} }, // Mock UsersService
        { provide: JwtService, useValue: {} },   // Mock JwtService
        { provide: ConfigService, useValue: {} }, // Mock ConfigService
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return a user for correct credentials', async () => {
      const user = await service.validateUser('admin@example.com', 'password');
      expect(user).toBeDefined();
      expect(user.email).toEqual('admin@example.com');
    });

    it('should return null for incorrect credentials', async () => {
      const user = await service.validateUser('wrong@example.com', 'wrong');
      expect(user).toBeNull();
    });
  });
});
