import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'; // Added BadRequestException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm'; // Added EntityManager
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateUserDto } from '../auth/dto/create-user.dto'; // Assuming this can be used for the admin user
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Company } from '../company/entities/company.entity'; // Corrected path
import { RefreshTokenDto } from './dto/refresh-token.dto';

export interface AuthResponse {
  user: Omit<User, 'password' | 'hashPassword' | 'validatePassword'>;
  token: string;
  refreshToken?: string; // Optional: if you implement refresh tokens
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company) // Inject CompanyRepository
    private readonly companyRepository: Repository<Company>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    return this.dataSource.transaction(async (transactionalEntityManager: EntityManager) => { // Added type for transactionalEntityManager
      // Check if admin email already exists
      const existingUser = await transactionalEntityManager.findOne(User, { where: { email: registerDto.adminEmail } });
      if (existingUser) {
        throw new ConflictException('User with this email already exists.');
      }

      // Check if company name already exists (optional, based on business rules)
      const existingCompany = await transactionalEntityManager.findOne(Company, { where: { name: registerDto.companyName } });
      if (existingCompany) {
        throw new ConflictException('Company with this name already exists.');
      }

      // Create and save the company
      const newCompany = transactionalEntityManager.create(Company, {
        name: registerDto.companyName,
        // Add other company fields from registerDto if available
      });
      const savedCompany: Company = await transactionalEntityManager.save(Company, newCompany); // Added type for savedCompany

      // Create and save the admin user
      const adminUser = transactionalEntityManager.create(User, {
        email: registerDto.adminEmail,
        password: registerDto.adminPassword, // Password will be hashed by the entity's BeforeInsert/BeforeUpdate hook
        firstName: registerDto.adminName, // Assuming adminName is firstName, or split it
        phoneNumber: registerDto.adminPhone,
        role: UserRole.ADMIN, // Assign ADMIN role
        isActive: true,
        company: savedCompany,
        companyId: savedCompany.id,
      });
      
      await adminUser.hashPassword(); // Manually hash password before saving
      const savedAdminUser = await transactionalEntityManager.save(User, adminUser);

      const { password, ...userResult } = savedAdminUser;
      const token = await this._createToken(userResult);
      const refreshToken = await this._createRefreshToken(userResult.id);

      return {
        user: userResult,
        token,
        refreshToken,
      };
    });
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({ 
        where: { email: loginDto.email },
        relations: ['company'] // Load company relation
    });

    if (!user || !(await user.validatePassword(loginDto.password)) || !user.isActive) {
      throw new NotFoundException('Invalid credentials or user inactive.');
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const { password, ...userResult } = user;
    const token = await this._createToken(userResult);
    const refreshToken = await this._createRefreshToken(userResult.id);

    return {
      user: userResult,
      token,
      refreshToken,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({ 
          where: { id: payload.sub },
          relations: ['company']
      });
      if (!user || !user.isActive) {
        throw new NotFoundException('User not found or inactive');
      }
      
      const { password, ...userResult } = user;
      const newAccessToken = await this._createToken(userResult);
      return { accessToken: newAccessToken };

    } catch (e) {
      // console.error('Refresh token error:', e); // Optional: for server-side logging
      throw new BadRequestException('Invalid refresh token');
    }
  }

  async validateUserById(userId: string): Promise<User | null> { // Changed return type to User | null
    const user = await this.userRepository.findOne({ 
        where: { id: userId, isActive: true },
        relations: ['company']
    });
    // No longer omitting password here; the strategy receives the full user object.
    // Sensitive data should be stripped before sending responses to the client.
    return user; 
  }

  async validateUserByPassword(loginDto: LoginDto): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['company'],
    });

    if (user && (await user.validatePassword(loginDto.password)) && user.isActive) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user; // Exclude password from the returned user object
      return result as User; // Cast to User after omitting password
    }
    return null;
  }

  private async _createToken(user: Omit<User, 'password' | 'hashPassword' | 'validatePassword'>): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
  }

  private async _createRefreshToken(userId: string): Promise<string> {
    const payload = { sub: userId }; // Keep refresh token payload minimal
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
  }

  // Placeholder for Auth0 Management API Token - requires Auth0 SDK and setup
  async getAuth0ManagementApiToken(): Promise<{ managementApiToken: string }> {
    // This would involve calling Auth0 to get a Management API token
    // using client credentials flow (M2M application in Auth0)
    // Securely store and use your Auth0 domain, client ID, and client secret (from ConfigService)
    // Example using `auth0` package:
    /*
    const { ManagementClient } = require('auth0');
    const management = new ManagementClient({
      domain: this.configService.get('AUTH0_DOMAIN'),
      clientId: this.configService.get('AUTH0_M2M_CLIENT_ID'),
      clientSecret: this.configService.get('AUTH0_M2M_CLIENT_SECRET'),
      scope: 'read:users update:users' // Or whatever scopes you need
    });
    const token = await management.getAccessToken(); // This is a simple way, might need caching
    return { managementApiToken: token };
    */
    console.warn('Auth0 Management API Token retrieval is not implemented.');
    throw new Error('Auth0 Management API Token retrieval not implemented.');
  }
}
