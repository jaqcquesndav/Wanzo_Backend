import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }),
      issuer: `https://${configService.get('AUTH0_DOMAIN')}/`,
      audience: configService.get('AUTH0_AUDIENCE'),
    });
    
    this.logger.debug(`JWT Strategy initialized with Auth0 issuer: https://${configService.get('AUTH0_DOMAIN')}/`);
  }

  async validate(payload: any): Promise<Record<string, any>> {
    this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);

    // Extract roles and permissions from Auth0 token
    const permissions = payload.permissions || [];
    const roles = payload[`${process.env.AUTH0_NAMESPACE}/roles`] || [];

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      permissions,
      roles,
      companyId: payload.companyId,
      institutionId: payload.institutionId,
      userType: payload.userType,
      isSystemAdmin: payload.role === 'admin',
      metadata: payload.metadata || {}
    };
  }
}