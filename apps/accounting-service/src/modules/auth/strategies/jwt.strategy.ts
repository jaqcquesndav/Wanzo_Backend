import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, TokenBlacklist } from '../entities';
import { UserRole } from '../dto';

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
      passReqToCallback: true, // Pass request to validate method
    });
    
    this.logger.debug(`JWT Strategy initialized with issuer: ${configService.get('AUTH0_DOMAIN')}`);
  }

  async validate(req: any, payload: any): Promise<any> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    const isBlacklisted = await this.tokenBlacklistRepository.findOne({ where: { token } });
    if (isBlacklisted) {
      this.logger.warn(`Blacklisted token received for user ${payload.sub}`);
      throw new UnauthorizedException('Token has been invalidated');
    }

    this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);
    const auth0Id = payload.sub;

    let user = await this.userRepository.findOne({ where: { auth0Id } });
    
    if (!user) {
      this.logger.log(`User with Auth0 ID ${auth0Id} not found. Creating new user.`);
      
      const customerAccountId = payload['https://wanzo.com/customer_account_id'];
      const customerType = payload['https://wanzo.com/customer_type'];

      if (!customerAccountId || customerType !== 'PME') {
        this.logger.warn(`Unauthorized access attempt by non-PME user: ${auth0Id}`);
        throw new UnauthorizedException('User is not authorized for this service.');
      }

      const existingUsers = await this.userRepository.count({ where: { customerAccountId } });

      user = this.userRepository.create({
        auth0Id,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        role: existingUsers === 0 ? UserRole.COMPANY_ADMIN : UserRole.COMPANY_USER,
        customerAccountId: customerAccountId,
        userType: 'EXTERNAL',
      });
      await this.userRepository.save(user);
      this.logger.log(`Created new user ${user.id} for customer ${customerAccountId}`);
    }
    
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    let permissions = [];
    if (user.customerAccountId) {
        permissions = ['read:accounting', 'write:accounting', 'read:portfolio-sme', 'read:mobile-app'];
    }

    return {
      id: user.id,
      auth0Id: payload.sub,
      email: user.email,
      name: user.name,
      role: user.role,
      userType: user.userType,
      permissions: permissions,
      customerAccountId: user.customerAccountId,
    };
  }
}