import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { CustomerSyncService } from '../services/customer-sync.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private readonly customerSyncService: CustomerSyncService,
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

    // 🔄 NOUVELLE LOGIQUE : Sync avec Customer Service AVANT retour
    try {
      const syncData = {
        auth0Id: payload.sub,
        email: payload.email,
        name: payload.name || payload.given_name || payload.nickname,
        companyId: payload.companyId,
        financialInstitutionId: payload.companyId, // Peut être institution ou company
        userType: payload.user_type || 'ANALYTICS_USER',
        role: payload.role,
      };

      this.logger.debug(`🔄 Syncing user ${payload.sub} with Customer Service`);
      await this.customerSyncService.syncUserWithCustomerService(syncData);
      this.logger.debug(`✅ User sync successful for ${payload.sub}`);
    } catch (syncError: any) {
      this.logger.warn(`⚠️ Customer Service sync failed: ${syncError.message}. Continuing with local validation.`);
      // Continue avec la validation locale en cas d'échec de sync
    }

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
