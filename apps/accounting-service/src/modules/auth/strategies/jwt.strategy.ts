import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, TokenBlacklist } from '../entities';
import { UserRole } from '../entities/user.entity';
import { CustomerSyncService } from '../services/customer-sync.service';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    
    // Appel de super() obligatoire en premier
    super(jwtOptions);
  }

  async validate(req: any, payload: any): Promise<any> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    // Only check blacklist if token exists
    const isBlacklisted = token ? 
      await this.tokenBlacklistRepository.findOne({ 
        where: { token } 
      }) : 
      null;
    if (isBlacklisted) {
      this.logger.warn(`Blacklisted token received for user ${payload.sub}`);
      throw new UnauthorizedException('Token has been invalidated');
    }

    this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);
    const auth0Id = payload.sub;

    let user = await this.userRepository.findOne({ where: { auth0Id } });
    
    if (!user) {
      this.logger.log(`User with Auth0 ID ${auth0Id} not found. Syncing with Customer Service first.`);
      
      const companyId = payload['https://wanzo.com/company_id'];
      const userType = payload['https://wanzo.com/user_type'];

      if (!companyId || !userType) {
        this.logger.warn(`Unauthorized access attempt: missing company_id or user_type for user: ${auth0Id}`);
        throw new UnauthorizedException('User is not authorized for this service.');
      }

      try {
        // 🔄 Synchronisation avec Customer Service AVANT création locale
        await this.customerSyncService.syncUserWithCustomerService({
          auth0Id,
          email: payload.email,
          name: `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
          firstName: payload.given_name,
          lastName: payload.family_name,
          picture: payload.picture,
          companyId,
          userType,
          metadata: {
            source: 'accounting-service',
            firstLoginFrom: 'accounting-app'
          }
        });

        // Attendre un court délai pour que l'événement soit traité
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Rechercher à nouveau l'utilisateur (il devrait maintenant exister)
        user = await this.userRepository.findOne({ where: { auth0Id } });
        
        if (!user) {
          // Si l'utilisateur n'existe toujours pas, créer localement en fallback
          this.logger.warn(`User still not found after sync, creating locally as fallback`);
          const existingUsers = await this.userRepository.count({ where: { organizationId: companyId } });

          user = this.userRepository.create({
            auth0Id,
            email: payload.email,
            firstName: payload.given_name || 'User',
            lastName: payload.family_name || '',
            profilePicture: payload.picture,
            role: existingUsers === 0 ? UserRole.ADMIN : UserRole.VIEWER,
            organizationId: companyId,
          });
          await this.userRepository.save(user);
          this.logger.log(`Created user locally as fallback for ${auth0Id}`);
        }
        
      } catch (syncError: any) {
        this.logger.error(`Customer Service sync failed: ${syncError.message || syncError}`);
        
        // Fallback : créer l'utilisateur localement si la sync échoue
        const existingUsers = await this.userRepository.count({ where: { organizationId: companyId } });

        user = this.userRepository.create({
          auth0Id,
          email: payload.email,
          firstName: payload.given_name || 'User',
          lastName: payload.family_name || '',
          profilePicture: payload.picture,
          role: existingUsers === 0 ? UserRole.ADMIN : UserRole.VIEWER,
          organizationId: companyId,
        });
        await this.userRepository.save(user);
        this.logger.log(`Created user locally as fallback for ${auth0Id}`);
      }
    } else {
      // 🔄 Pour les utilisateurs existants, informer aussi Customer Service
      try {
        await this.customerSyncService.notifyUserLogin({
          auth0Id,
          email: payload.email,
          name: `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
          firstName: payload.given_name,
          lastName: payload.family_name,
          picture: payload.picture,
          companyId: payload['https://wanzo.com/company_id'],
          userType: payload['https://wanzo.com/user_type'],
          metadata: {
            source: 'accounting-service',
            existingUser: true
          }
        });
      } catch (syncError: any) {
        this.logger.warn(`Failed to sync existing user login: ${syncError.message || syncError}`);
        // Ne pas bloquer si la sync échoue pour un utilisateur existant
      }
    }
    
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const permissions = payload.permissions || [];

    return {
      id: user.id,
      auth0Id: payload.sub,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: permissions,
      organizationId: user.organizationId,
    };
  }
}
