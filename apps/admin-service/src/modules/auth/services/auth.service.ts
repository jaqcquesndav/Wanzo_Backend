import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
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
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async getUserByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { auth0Id }
    });
  }

  async validateToken(token: string): Promise<ValidateTokenResponseDto> {
    try {
      // Note: Pas de blacklist pour les admins Wanzo
      // La révocation des tokens admin se fait au niveau Auth0 directement
      
      // Vérifier la validité du token avec Auth0
      const jwksUri = `${this.configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`;
      const audience = this.configService.get('AUTH0_AUDIENCE');
      const issuer = `${this.configService.get('AUTH0_DOMAIN')}/`;
      
      const payload = this.jwtService.verify(token, {
        secret: jwksUri,
        audience,
        issuer
      });

      const auth0Id = payload.sub;
      let user = await this.getUserByAuth0Id(auth0Id);
      
      if (!user) {
        this.logger.warn(`L'utilisateur avec Auth0 ID ${auth0Id} n'a pas été trouvé`);
        return { 
          isValid: false, 
          error: 'Utilisateur non trouvé' 
        };
      }

      return {
        isValid: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          userType: user.userType,
          picture: user.avatar,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt.toISOString(),
          customerAccountId: user.customerAccountId || null,
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors de la validation du token', error);
      return { 
        isValid: false, 
        error: 'Token invalide' 
      };
    }
  }

  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`Utilisateur avec ID ${userId} non trouvé`);
    }
    
    const profile = new UserProfileDto();
    profile.id = user.id;
    profile.name = user.name;
    profile.email = user.email;
    profile.role = user.role;
    profile.userType = user.userType;
    profile.picture = user.avatar;
    profile.phoneNumber = user.phoneNumber;
    profile.customerAccountId = user.customerAccountId;
    // profile.organizationId = user.organizationId;
    profile.createdAt = user.createdAt.toISOString();
    
    return profile;
  }

  async updateUserProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserProfileDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`Utilisateur avec ID ${userId} non trouvé`);
    }
    
    // Mettre à jour uniquement les champs autorisés
    if (updateProfileDto.name) user.name = updateProfileDto.name;
    if (updateProfileDto.phoneNumber) user.phoneNumber = updateProfileDto.phoneNumber;
    if (updateProfileDto.language) user.language = updateProfileDto.language;
    if (updateProfileDto.timezone) user.timezone = updateProfileDto.timezone;
    
    await this.userRepository.save(user);
    
    return this.getUserProfile(userId);
  }

  // Note: Pas de méthodes invalidateSession() ou invalidateToken() pour les admins
  // Les admins Wanzo sont révoqués au niveau Auth0 directement, pas via blacklist locale
}
