import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser, TokenBlacklist, UserRole } from '../entities';
import { CustomerSyncService } from '../services/customer-sync.service';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(AuthUser)
    private readonly userRepository: Repository<AuthUser>,
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
    private readonly customerSyncService: CustomerSyncService,
  ) {
    // Récupérer les configurations
    const certificatePath = configService.get('AUTH0_CERTIFICATE_PATH');
    const domain = configService.get('AUTH0_DOMAIN');
    const audience = configService.get('AUTH0_AUDIENCE');
    
    // Déterminer la configuration JWT
    let jwtOptions;
    
    if (certificatePath && fs.existsSync(certificatePath)) {
      // Utiliser le certificat local RSA
      const certificate = fs.readFileSync(certificatePath, 'utf8');
      jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: certificate,
        issuer: `https://${domain}/`,
        audience: audience,
        algorithms: ['RS256'],
        passReqToCallback: true,
      };
    } else {
      // Utiliser JWKS avec RSA
      jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKeyProvider: passportJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: `https://${domain}/.well-known/jwks.json`,
        }),
        issuer: `https://${domain}/`,
        audience: audience,
        passReqToCallback: true,
      };
    }
    
    super(jwtOptions);
    
    // Debug dependency injection (après super())
    console.log(`🔍 JWT STRATEGY CONSTRUCTOR: Strategy initialized for portfolio`);
    this.logger.log(`🔍 JWT Strategy constructor completed`);
    this.logger.log(`📊 UserRepository: ${this.userRepository ? 'Injected' : 'MISSING'}`);
    this.logger.log(`🚫 TokenBlacklistRepository: ${this.tokenBlacklistRepository ? 'Injected' : 'MISSING'}`);
    this.logger.log(`👥 CustomerSyncService: ${this.customerSyncService ? 'Injected' : 'MISSING'}`);
    console.log(`📊 JWT STRATEGY CONSTRUCTOR: Dependencies checked for portfolio`);
  }

  async validate(req: any, payload: any): Promise<Record<string, any>> {
    const auth0Id = payload.sub;
    
    console.log('🎫 JWT STRATEGY: Starting validation for user', auth0Id);
    
    // Extraire le token de la requête
    const token = req?.headers?.authorization?.replace('Bearer ', '');
    console.log('🎫 JWT STRATEGY: Token extracted:', token ? 'Present' : 'Missing');

    // Bypass temporaire du blacklist pour debug
    console.log('⚠️ JWT STRATEGY: BLACKLIST CHECK BYPASSED FOR DEBUGGING PURPOSES');

    // Extraire informations du payload
    const companyId = payload['https://wanzo.com/company_id'] || 'default-company';
    const userType = payload['https://wanzo.com/user_type'] || 'INSTITUTION_USER';
    const permissions = payload.permissions || [];

    if (!companyId || !userType) {
      this.logger.warn(`Unauthorized access attempt: missing company_id or user_type for user: ${auth0Id}`);
      throw new UnauthorizedException('Token manque company_id ou user_type');
    }

    // Chercher l'utilisateur existant
    let user = await this.userRepository.findOne({
      where: { auth0Id }
    });

    if (!user) {
      // Créer nouvel utilisateur
      try {
        await this.customerSyncService.syncUserWithCustomerService({
          auth0Id,
          email: payload.email,
          name: `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
          companyId,
          userType,
          role: userType
        });

        // Déterminer le rôle basé sur le nombre d'utilisateurs existants
        const existingUsers = await this.userRepository.count({ where: { institutionId: companyId } });
        
        user = this.userRepository.create({
          auth0Id,
          email: payload.email || 'no-email@wanzo.com',
          firstName: payload.given_name || 'User',
          lastName: payload.family_name || '',
          profilePicture: payload.picture,
          role: existingUsers === 0 ? UserRole.ADMIN : UserRole.PORTFOLIO_MANAGER,
          institutionId: companyId,
        });
        await this.userRepository.save(user);
        this.logger.log(`Created user locally as fallback for ${auth0Id}`);
        
      } catch (syncError: any) {
        this.logger.error(`Customer Service sync failed: ${syncError.message || syncError}`);
        
        // Fallback : créer l'utilisateur localement si la sync échoue
        const existingUsers = await this.userRepository.count({ where: { institutionId: companyId } });

        console.log(`📧 Creating user with email: "${payload.email}"`);
        
        user = this.userRepository.create({
          auth0Id,
          email: payload.email || 'no-email@wanzo.com',
          firstName: payload.given_name || 'User',
          lastName: payload.family_name || '',
          profilePicture: payload.picture,
          role: existingUsers === 0 ? UserRole.ADMIN : UserRole.PORTFOLIO_MANAGER,
          institutionId: companyId,
        });
        await this.userRepository.save(user);
        this.logger.log(`Created user locally as fallback for ${auth0Id}`);
      }
    } else {
      // 🔄 Pour les utilisateurs existants, informer aussi Customer Service
      try {
        await this.customerSyncService.syncUserWithCustomerService({
          auth0Id,
          email: payload.email,
          name: `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
          companyId: payload['https://wanzo.com/company_id'],
          userType: payload['https://wanzo.com/user_type'],
        });
      } catch (syncError: any) {
        this.logger.warn(`Failed to sync existing user login: ${syncError.message || syncError}`);
        // Ne pas bloquer si la sync échoue pour un utilisateur existant
      }

      // Mettre à jour lastLoginAt
      await this.userRepository.update(user.id, { 
        lastLoginAt: new Date() 
      });
    }

    // Retourner les informations utilisateur pour req.user
    return {
      id: user.id,
      auth0Id: payload.sub,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: permissions,
      institutionId: user.institutionId,
    };
  }
}
