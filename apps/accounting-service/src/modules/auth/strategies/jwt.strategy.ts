import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, TokenBlacklist } from '../entities';
import { UserRole } from '../entities/user.entity';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
  ) {
    // Déterminer quelle méthode de vérification utiliser basée sur la présence du certificat
    const certificatePath = configService.get('AUTH0_CERTIFICATE_PATH');
    const domain = configService.get('AUTH0_DOMAIN');
    const audience = configService.get('AUTH0_AUDIENCE');
    let jwtOptions;
    let usesLocalCertificate = false;
    
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
        passReqToCallback: true, // Pass request to validate method
      };
      usesLocalCertificate = true;
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
        passReqToCallback: true, // Pass request to validate method
      };
    }
    
    // Appel de super() avant d'utiliser this
    super(jwtOptions);
    
    // Maintenant on peut utiliser this en toute sécurité
    this.logger.debug(`JWT Strategy initialized with issuer: ${domain}`);
    if (usesLocalCertificate) {
      this.logger.debug('Auth0: Using local certificate for JWT validation');
    } else {
      this.logger.debug('Auth0: Using JWKS endpoint for JWT validation');
    }
  }

  async validate(req: any, payload: any): Promise<any> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    // Only check blacklist if token exists
    const isBlacklisted = token ? 
      await this.tokenBlacklistRepository.findOne({ 
        where: { token } 
      }) : 
      null;
    if (isBlacklisted) {
      this.logger.warn(`Blacklisted token received for user ${payload.sub}`);
      throw new UnauthorizedException('Token has been invalidated');
    }

    this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);
    const auth0Id = payload.sub;

    let user = await this.userRepository.findOne({ where: { auth0Id } });
    
    if (!user) {
      this.logger.log(`User with Auth0 ID ${auth0Id} not found. Creating new user.`);
      
      const companyId = payload['https://wanzo.com/company_id'];
      const userType = payload['https://wanzo.com/user_type'];

      if (!companyId || !userType) {
        this.logger.warn(`Unauthorized access attempt: missing company_id or user_type for user: ${auth0Id}`);
        throw new UnauthorizedException('User is not authorized for this service.');
      }

      const existingUsers = await this.userRepository.count({ where: { organizationId: companyId } });

      user = this.userRepository.create({
        auth0Id,
        email: payload.email,
        firstName: payload.given_name || 'User',
        lastName: payload.family_name || '',
        profilePicture: payload.picture,
        role: existingUsers === 0 ? UserRole.ADMIN : UserRole.VIEWER,
        organizationId: companyId,
      });
      await this.userRepository.save(user);
      this.logger.log(`Created new user ${user.id} for organization ${companyId}`);
    }
    
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const permissions = payload.permissions || [];

    return {
      id: user.id,
      auth0Id: payload.sub,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: permissions,
      organizationId: user.organizationId,
    };
  }
}