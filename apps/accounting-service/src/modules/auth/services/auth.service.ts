import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { 
  ValidateTokenResponseDto, 
  UpdateProfileDto, 
  UserProfileDto,
  UserRole,
  UserType
} from '../dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // TODO: Implement proper user validation with Auth0 or database
    // This is a placeholder implementation for development
    if (email === 'admin@example.com' && password === 'password') {
      return {
        id: 'mock-user-id',
        name: 'Admin User',
        email: email,
        role: UserRole.COMPANY_ADMIN,
        userType: UserType.INTERNAL
      };
    }
    return null;
  }

  async validateToken(token: string): Promise<ValidateTokenResponseDto> {
    // TODO: Implement proper JWT verification using Auth0 JWKS
    
    try {
      // This is a placeholder implementation
      // In a real implementation, you would decode and verify the JWT token
      // and then fetch the user profile from your database or Auth0
      
      // For now, return a mock response with a valid user
      return {
        isValid: true,
        user: {
          id: 'mock-user-id',
          name: 'Test User',
          email: 'testuser@example.com',
          role: UserRole.COMPANY_USER,
          type: UserType.EXTERNAL,
          createdAt: new Date().toISOString(),
          picture: 'https://example.com/avatar.jpg',
          phoneNumber: '+243123456789'
        }
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid token'
      };
    }
  }

  async getUserProfile(userId: string): Promise<UserProfileDto> {
    // TODO: Implement logic
    console.log(userId);
    return new UserProfileDto();
  }

  async updateUserProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserProfileDto> {
    // TODO: Implement logic
    console.log(userId, updateProfileDto);
    return new UserProfileDto();
  }

  async invalidateSession(token: string): Promise<void> {
    // TODO: Implement logic
    console.log(token);
  }
}