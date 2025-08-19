import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
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

  async validate(payload: any): Promise<Record<string, any>> {
    this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);

    // Rechercher l'utilisateur dans notre base de données
    const user = await this.userRepository.findOne({ where: { auth0Id: payload.sub } });
    
    // Si l'utilisateur n'existe pas dans notre base de données, refuser l'accès
    if (!user) {
      this.logger.warn(`User with Auth0 ID ${payload.sub} not found in database`);
      throw new UnauthorizedException('Utilisateur non trouvé dans la base de données');
    }
    
    // Mettre à jour la date de dernière connexion
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    return {
      id: user.id,
      auth0Id: payload.sub,
      email: user.email,
      name: user.name,
      role: user.role,
      userType: user.userType,
      permissions: user.permissions,
      customerAccountId: user.customerAccountId
    };
  }
}
