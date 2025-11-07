import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities';
import { CustomerSyncService } from '../services/customer-sync.service';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly customerSyncService: CustomerSyncService,
  ) {
    // Déterminer quelle méthode de vérification utiliser basée sur la présence du certificat
    const certificatePath = configService.get('AUTH0_CERTIFICATE_PATH');
    const domain = configService.get('AUTH0_DOMAIN');
    const audience = configService.get('AUTH0_AUDIENCE');
    let jwtOptions;
    
    if (certificatePath && fs.existsSync(certificatePath)) {
      // Utiliser le certificat local
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
      // Pas d'appel this.logger avant super()
    } else {
      // Fallback sur l'endpoint JWKS
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
      // Pas d'appel this.logger avant super()
    }
    
    super(jwtOptions);
    
    // Maintenant on peut utiliser this.logger
    this.logger.debug(`JWT Strategy initialized with issuer: ${domain}`);
    
    if (certificatePath && fs.existsSync(certificatePath)) {
      this.logger.debug('Auth0: Using local certificate for JWT validation');
    } else {
      this.logger.debug('Auth0: Using JWKS endpoint for JWT validation');
    }
  }

  async validate(req: any, payload: any): Promise<Record<string, any>> {
    this.logger.log(`🔍 Starting JWT validation for admin user: ${payload?.sub || 'UNKNOWN'}`);
    this.logger.debug(`📋 JWT PAYLOAD: ${JSON.stringify(payload)}`);
    
    // Note: Pas de blacklist pour les admins Wanzo - la révocation se fait au niveau Auth0
    
    this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);
    const auth0Id = payload.sub;

    // Rechercher l'utilisateur dans notre base de données
    let user = await this.userRepository.findOne({ where: { auth0Id } });
    
    // Si l'utilisateur n'existe pas dans notre base de données, le créer
    if (!user) {
      this.logger.log(`User with Auth0 ID ${auth0Id} not found. Creating user and syncing with Customer Service.`);
      
      const companyId = payload['https://wanzo.com/company_id'] || payload['https://wanzo.com/organizationId'];
      const userType = payload['https://wanzo.com/user_type'];
      
      // Synchroniser avec Customer Service via Kafka
      try {
        await this.customerSyncService.syncUserWithCustomerService({
          auth0Id,
          email: payload.email,
          name: `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || payload.name,
          firstName: payload.given_name,
          lastName: payload.family_name,
          picture: payload.picture,
          companyId,
          userType,
          metadata: {
            source: 'admin-service',
            firstLoginFrom: 'admin-app'
          }
        });
        
        // Attendre un court délai pour que l'événement soit traité
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Rechercher à nouveau l'utilisateur (il devrait maintenant exister)
        user = await this.userRepository.findOne({ where: { auth0Id } });
      } catch (syncError: any) {
        this.logger.error(`Customer Service sync failed: ${syncError.message || syncError}`);
      }
      
      // Si l'utilisateur n'existe toujours pas, créer localement en fallback
      if (!user) {
        this.logger.warn(`User still not found after sync, creating locally as fallback`);
        
        user = this.userRepository.create({
          auth0Id,
          email: payload.email || 'no-email@wanzo.com',
          name: `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || payload.name || 'User',
          picture: payload.picture,
          role: payload['https://wanzo.com/role'] || 'company_user',
          userType: userType || 'external',
          organizationId: companyId,
          customerAccountId: payload['https://wanzo.com/customer_account_id'],
        });
        
        await this.userRepository.save(user);
        this.logger.log(`Created user locally as fallback for ${auth0Id}`);
      }
    } else {
      // Pour les utilisateurs existants, notifier Customer Service
      try {
        await this.customerSyncService.notifyUserLogin({
          auth0Id,
          email: payload.email,
          name: user.name,
          firstName: payload.given_name,
          lastName: payload.family_name,
          picture: payload.picture,
          companyId: payload['https://wanzo.com/company_id'],
          userType: payload['https://wanzo.com/user_type'],
          metadata: {
            source: 'admin-service',
            existingUser: true
          }
        });
      } catch (syncError: any) {
        this.logger.warn(`Failed to sync existing user login: ${syncError.message || syncError}`);
        // Ne pas bloquer si la sync échoue pour un utilisateur existant
      }
    }
    
    // Mettre à jour la date de dernière connexion
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    const permissions = payload.permissions || [];

    return {
      id: user.id,
      auth0Id: payload.sub,
      email: user.email,
      name: user.name,
      role: user.role,
      userType: user.userType,
      permissions: permissions,
      organizationId: user.organizationId,
      customerAccountId: user.customerAccountId,
    };
  }
}
