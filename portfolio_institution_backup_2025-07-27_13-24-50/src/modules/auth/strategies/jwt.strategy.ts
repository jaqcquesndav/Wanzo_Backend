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
        jwksUri: `${configService.get('AUTH_SERVICE_URL')}/.well-known/jwks.json`,
      }),
      issuer: configService.get('AUTH_SERVICE_URL'),
      audience: 'admin-service',
    });
    
    this.logger.debug(`JWT Strategy initialized with issuer: ${configService.get('AUTH_SERVICE_URL')}`);
  }

  async validate(payload: any): Promise<Record<string, any>> {
    this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);

    // Determine institutionId: prioritize payload.institutionId, then payload.companyId
    const institutionId = payload.institutionId || payload.companyId;

    if (!institutionId) {
        this.logger.warn(`institutionId (from payload.institutionId or payload.companyId) not found in JWT payload for user: ${payload.sub}.`);
        // Depending on whether an institution context is always required,
        // this could be an error or handled downstream.
        // For now, it will be undefined if not present.
    }

    return {
      id: payload.sub, // User's own ID (maps to req.user.id)
      email: payload.email,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions,
      institutionId: institutionId, // This will map to req.user.institutionId
      isSystemAdmin: payload.role === 'admin',
      metadata: payload.metadata || {}
      // companyId is no longer explicitly returned if institutionId serves its purpose
    };
  }
}