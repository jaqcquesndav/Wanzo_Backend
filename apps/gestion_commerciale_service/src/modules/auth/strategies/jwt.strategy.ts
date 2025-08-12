import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { User } from '../entities/user.entity';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
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
    const user = await this.authService.validateUserById(payload.sub);
    
    // Si l'utilisateur n'existe pas dans notre base de données, refuser l'accès
    if (!user) {
      this.logger.warn(`User with Auth0 ID ${payload.sub} not found in database`);
      throw new UnauthorizedException('Utilisateur non trouvé dans la base de données');
    }
    
    // Mettre à jour la date de dernière connexion si nécessaire
    // Votre logique métier pour les dernières connexions peut être ajoutée ici

    return user;
  }
}
