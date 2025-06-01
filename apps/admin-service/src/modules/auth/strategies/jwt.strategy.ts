import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get('AUTH_SERVICE_URL')}/.well-known/jwks.json`,
      }),
      issuer: configService.get('AUTH_SERVICE_URL'),
      audience: 'admin-service',
    });
    
    this.logger.debug(`JWT Strategy initialized with issuer: ${configService.get('AUTH_SERVICE_URL')}`);
  }

  async validate(payload: any): Promise<Record<string, any>> {
    this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions,
      companyId: payload.companyId,
      isSystemAdmin: payload.role === 'admin',
      metadata: payload.metadata || {}
    };
  }
}