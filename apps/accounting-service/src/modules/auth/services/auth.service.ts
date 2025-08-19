import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../entities/user.entity';
import { TokenBlacklist } from '../entities/token-blacklist.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
  ) {}

  async validateUserById(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId }
    });
    return user;
  }

  async getUserByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { auth0Id }
    });
  }
  
  async validateToken(token: string): Promise<any> {
    try {
      // Vérifier si le token est dans la liste noire
      const blacklistedToken = await this.tokenBlacklistRepository.findOne({
        where: { token }
      });
      
      if (blacklistedToken) {
        this.logger.warn('Tentative d\'utilisation d\'un token révoqué');
        return { isValid: false, error: 'Token révoqué' };
      }

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
        return { isValid: false, error: 'Utilisateur non trouvé' };
      }

      return {
        isValid: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          organizationId: user.organizationId
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors de la validation du token', error);
      return { isValid: false, error: 'Token invalide' };
    }
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`Utilisateur avec ID ${userId} non trouvé`);
    }
    
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      organizationId: user.organizationId,
      permissions: user.permissions || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async updateUserProfile(userId: string, updateData: Partial<User>): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`Utilisateur avec ID ${userId} non trouvé`);
    }
    
    // Mettre à jour uniquement les champs autorisés
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.phoneNumber) user.phoneNumber = updateData.phoneNumber;
    if (updateData.language) user.language = updateData.language;
    if (updateData.timezone) user.timezone = updateData.timezone;
    if (updateData.preferences) user.preferences = updateData.preferences;
    
    await this.userRepository.save(user);
    
    return this.getUserProfile(userId);
  }

  async invalidateSession(token: string): Promise<void> {
    // Ajouter le token à la liste noire
    const blacklistEntry = this.tokenBlacklistRepository.create({
      token,
      invalidatedAt: new Date()
    });
    
    await this.tokenBlacklistRepository.save(blacklistEntry);
    this.logger.log(`Token invalidé avec succès`);
  }
}
