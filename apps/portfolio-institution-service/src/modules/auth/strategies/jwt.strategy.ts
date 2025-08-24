import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { CustomerSyncService } from '../services/customer-sync.service';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly customerSyncService: CustomerSyncService,
  ) {
    // Déterminer quelle méthode de vérification utiliser basée sur la présence du certificat
    const certificatePath = configService.get('AUTH0_CERTIFICATE_PATH');
    
    // Utiliser AUTH0_DOMAIN si disponible, sinon fallback sur AUTH_SERVICE_URL
    const domain = configService.get('AUTH0_DOMAIN') || configService.get('AUTH_SERVICE_URL');
    const audience = configService.get('AUTH0_AUDIENCE') || 'admin-service';
    
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
        issuer: domain.startsWith('https://') ? domain : `https://${domain}/`,
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

    // 🔄 NOUVELLE LOGIQUE : Sync avec Customer Service AVANT retour
    try {
      const syncData = {
        auth0Id: payload.sub,
        email: payload.email,
        name: payload.name || payload.given_name || payload.nickname,
        companyId: payload.companyId,
        financialInstitutionId: institutionId,
        userType: payload.user_type || 'FINANCIAL_INSTITUTION',
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
