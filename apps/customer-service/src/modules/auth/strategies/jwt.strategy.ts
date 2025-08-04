
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { UserService } from '../../system-users/services/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    // Check if user exists in our database
    try {
      const user = await this.userService.findByAuth0Id(payload.sub);
      
      // Vérifiez les permissions à partir du token Auth0
      const permissions = payload.permissions || [];
      const roles = payload[`${process.env.AUTH0_NAMESPACE}/roles`] || [];
      
      // Si l'utilisateur existe déjà dans notre base de données
      if (user) {
        return {
          ...payload,
          userId: user.id,
          companyId: user.companyId,
          financialInstitutionId: user.financialInstitutionId,
          userRole: user.role,
          userType: user.userType,
          permissions,
          roles,
        };
      }
      
      // Si l'utilisateur n'existe pas encore, laissez passer uniquement 
      // pour les endpoints /users/sync et /users/me
      return {
        ...payload,
        isNewUser: true,
        permissions,
        roles,
      };
    } catch (error) {
      console.error('Error validating JWT token:', error);
      return {
        ...payload,
        isError: true,
      };
    }
  }
}
