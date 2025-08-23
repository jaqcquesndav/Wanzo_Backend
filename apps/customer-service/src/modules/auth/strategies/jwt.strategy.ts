
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { UserService } from '../../system-users/services/user.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    console.log('🚀 JwtStrategy constructor called - STARTING INITIALIZATION');
    console.log('AUTH0_DOMAIN:', process.env.AUTH0_DOMAIN);
    console.log('AUTH0_AUDIENCE:', process.env.AUTH0_AUDIENCE);
    console.log('AUTH0_CERTIFICATE_PATH:', process.env.AUTH0_CERTIFICATE_PATH);
    
    // Déterminer quelle méthode de vérification utiliser basée sur la présence du certificat
    let jwtOptions;
    
    if (process.env.AUTH0_CERTIFICATE_PATH && fs.existsSync(process.env.AUTH0_CERTIFICATE_PATH)) {
      // Utiliser le certificat local
      const certificate = fs.readFileSync(process.env.AUTH0_CERTIFICATE_PATH, 'utf8');
      jwtOptions = {
        secretOrKey: certificate,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256'],
      };
      console.log('Auth0: Using local certificate for JWT validation');
    } else {
      // Fallback sur l'endpoint JWKS
      jwtOptions = {
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
      };
      console.log('Auth0: Using JWKS endpoint for JWT validation');
    }
    
    console.log('JWT Options configured:', {
      audience: jwtOptions.audience,
      issuer: jwtOptions.issuer,
      algorithms: jwtOptions.algorithms,
      hasSecretOrKey: !!jwtOptions.secretOrKey,
      hasSecretOrKeyProvider: !!jwtOptions.secretOrKeyProvider
    });
    
    super(jwtOptions);
    console.log('JwtStrategy initialization completed');
  }

  async validate(payload: any) {
    console.log('JWT Strategy validate called with payload:', JSON.stringify(payload, null, 2));
    
    // Check if user exists in our database
    try {
      console.log('Attempting to find user by Auth0 ID:', payload.sub);
      const user = await this.userService.findByAuth0Id(payload.sub);
      console.log('User found:', user ? 'YES' : 'NO');
      
      // Vérifiez les permissions à partir du token Auth0
      const permissions = payload.permissions || [];
      const roles = payload[`${process.env.AUTH0_NAMESPACE}/roles`] || [];
      
      // Si l'utilisateur existe déjà dans notre base de données
      if (user) {
        console.log('Returning existing user data');
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
      console.log('Returning new user data');
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
