import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../services/user.service';
import { passportJwtSecret } from 'jwks-rsa';

interface JwtPayload {
  name: any;
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  scope: string;
  client_id: string;
  aud: string;
  companyId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Utiliser jwks-rsa pour récupérer la clé publique d'Auth0
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.get('auth0.domain')}/.well-known/jwks.json`,
      }),
      // Vérifier l'émetteur du token
      issuer: `https://${configService.get('auth0.domain')}/`,
      // Vérifier l'audience du token
      audience: configService.get('auth0.audience', 'https://api.kiota.com'),
    });
    
    this.logger.debug(`JwtStrategy initialized with issuer: https://${configService.get('auth0.domain')}/`);
    this.logger.debug(`JWKS URI: https://${configService.get('auth0.domain')}/.well-known/jwks.json`);
    this.logger.debug(`Audience: ${configService.get('auth0.audience', 'https://api.kiota.com')}`);
  }

  async validate(payload: JwtPayload): Promise<boolean | Record<string, any>> {
    this.logger.debug(`Validating JWT for user: ${payload.sub}`);
    
    // Vérifier les scopes requis
    const requiredScopes = ['openid', 'profile'];
    const tokenScopes = payload.scope ? payload.scope.split(' ') : [];
    
    if (!requiredScopes.some(scope => tokenScopes.includes(scope))) {
      this.logger.warn(`JWT validation failed: missing required scopes for user ${payload.sub}`);
      return false;
    }

    // Récupérer les informations supplémentaires de l'utilisateur depuis la base de données
    try {
      const user = await this.userService.findById(payload.sub);
      
      this.logger.debug(`JWT validated successfully for user: ${payload.sub}`);
      
      return {
        id: payload.sub,
        email: payload.email || user.email,
        name: payload.name || user.name,
        role: payload.role || user.role,
        permissions: payload.permissions || user.permissions,
        clientId: payload.client_id,
        companyId: user.companyId || payload.companyId,
        isSystemAdmin: payload.role === 'admin',
        metadata: user.metadata || {}
      };
    } catch (error) {
      this.logger.warn(`User not found in database, using token data: ${payload.sub}`);
      // Si l'utilisateur n'existe pas dans notre base de données, on utilise les informations du token
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        permissions: payload.permissions,
        clientId: payload.client_id,
        companyId: payload.companyId
      };
    }
  }
}