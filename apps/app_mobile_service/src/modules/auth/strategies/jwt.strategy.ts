import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }),
      issuer: `${configService.get('AUTH0_DOMAIN')}/`,
      audience: configService.get('AUTH0_AUDIENCE'),
    });
    
    this.logger.debug(`JWT Strategy initialized with issuer: ${configService.get('AUTH0_DOMAIN')}`);
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
