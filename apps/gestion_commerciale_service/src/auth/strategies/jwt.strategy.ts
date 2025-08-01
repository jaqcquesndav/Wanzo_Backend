import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  
  constructor(
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET_KEY') || 'default-secret-key',
      // Pour l'intégration avec la plateforme, nous pouvons avoir besoin de ces options
      issuer: configService.get<string>('JWT_ISSUER'),
      audience: configService.get<string>('JWT_AUDIENCE'),
    });
    this.logger.log('JwtStrategy initialized with platform integration settings');
  }

  async validate(payload: any): Promise<JwtPayload> {
    this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);

    if (!payload) {
      throw new UnauthorizedException('Token invalide');
    }
    
    // Validation du token - vous pouvez ajouter des validations supplémentaires ici
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Token incomplet ou mal formé');
    }

    // Retourne les données du payload pour qu'elles soient attachées à la requête
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      roles: payload.roles || [payload.role] || [], // Compatibilité avec ancien format
      businessUnitId: payload.businessUnitId,
      features: payload.features || payload.permissions || [], // Compatibilité avec ancien format
      subscriptionId: payload.subscriptionId,
      subscriptionPlan: payload.subscriptionPlan,
      iat: payload.iat,
      exp: payload.exp,
      iss: payload.iss,
      aud: payload.aud,
    };
  }
}
