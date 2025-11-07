import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwksRsa from 'jwks-rsa';

const enabled = String(process.env.AUTH0_ENABLED || 'false') === 'true';
const domain = process.env.AUTH0_DOMAIN || '';
const audience = process.env.AUTH0_AUDIENCE || '';

export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    if (!enabled) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: true,
        secretOrKey: 'auth-disabled',
      });
      return;
    }
    const issuer = `https://${domain}/`;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience,
      issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: `${issuer}.well-known/jwks.json`,
      }) as any,
    });
  }

  async validate(payload: any) {
    return payload;
  }
}
