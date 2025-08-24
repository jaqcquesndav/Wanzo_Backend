import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { User } from '../entities/user.entity';
import { CustomerSyncService } from '../services/customer-sync.service';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
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
      };
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
      };
    }
    
    super(jwtOptions);
    
    // Log après super()
    this.logger.debug(`JWT Strategy initialized with issuer: ${domain}`);
    
    if (certificatePath && fs.existsSync(certificatePath)) {
      this.logger.debug('Auth0: Using local certificate for JWT validation');
    } else {
      this.logger.debug('Auth0: Using JWKS endpoint for JWT validation');
    }
  }

  async validate(payload: any): Promise<User> {
    this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);

    // Rechercher l'utilisateur dans notre base de données
    let user = await this.authService.validateUserById(payload.sub);
    
    // Si l'utilisateur n'existe pas dans notre base de données, synchroniser avec Customer Service
    if (!user) {
      this.logger.log(`User with Auth0 ID ${payload.sub} not found in database. Syncing with Customer Service.`);
      
      const companyId = payload['https://wanzo.com/company_id'];
      const userType = payload['https://wanzo.com/user_type'];

      if (!companyId || !userType) {
        this.logger.warn(`Unauthorized access: missing company_id or user_type for user: ${payload.sub}`);
        throw new UnauthorizedException('User is not authorized for this service.');
      }

      // Vérifier que c'est un utilisateur SME
      if (userType !== 'sme') {
        this.logger.warn(`Access denied: user ${payload.sub} is not an SME user`);
        throw new UnauthorizedException('Access is restricted to SME users only.');
      }

      try {
        // 🔄 Synchronisation avec Customer Service
        await this.customerSyncService.syncUserWithCustomerService({
          auth0Id: payload.sub,
          email: payload.email,
          name: `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
          firstName: payload.given_name,
          lastName: payload.family_name,
          picture: payload.picture,
          companyId,
          userType,
          metadata: {
            source: 'gestion-commerciale-service',
            firstLoginFrom: 'gestion-commerciale-app'
          }
        });

        // Attendre un court délai pour que l'événement soit traité
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Rechercher à nouveau l'utilisateur
        user = await this.authService.validateUserById(payload.sub);
        
        if (!user) {
          this.logger.warn(`User still not found after sync for ${payload.sub}`);
          throw new UnauthorizedException('Utilisateur non trouvé dans la base de données après synchronisation');
        }
        
      } catch (syncError: any) {
        this.logger.error(`Customer Service sync failed: ${syncError.message || syncError}`);
        throw new UnauthorizedException('Échec de la synchronisation utilisateur');
      }
    } else {
      // 🔄 Pour les utilisateurs existants, informer Customer Service
      try {
        await this.customerSyncService.notifyUserLogin({
          auth0Id: payload.sub,
          email: payload.email,
          name: `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
          firstName: payload.given_name,
          lastName: payload.family_name,
          picture: payload.picture,
          companyId: payload['https://wanzo.com/company_id'],
          userType: payload['https://wanzo.com/user_type'],
          metadata: {
            source: 'gestion-commerciale-service',
            existingUser: true
          }
        });
      } catch (syncError: any) {
        this.logger.warn(`Failed to sync existing user login: ${syncError.message || syncError}`);
        // Ne pas bloquer si la sync échoue pour un utilisateur existant
      }
    }
    
    // Mettre à jour la date de dernière connexion
    if (user) {
      await this.authService.updateLastLogin(user.id);
    }

    return user;
  }
}
