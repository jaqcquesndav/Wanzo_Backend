import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
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