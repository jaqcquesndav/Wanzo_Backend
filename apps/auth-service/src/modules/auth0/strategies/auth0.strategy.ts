import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-auth0';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Auth0Strategy extends PassportStrategy(Strategy, 'auth0') {
  private readonly logger = new Logger(Auth0Strategy.name);

  constructor(configService: ConfigService) {
    const domain = configService.get('auth0.domain');
    const clientID = configService.get('auth0.clientId');
    const clientSecret = configService.get('auth0.clientSecret');
    const callbackURL = configService.get('auth0.callbackUrl');
    const audience = configService.get('auth0.audience');

    super({
      domain,
      clientID,
      clientSecret,
      callbackURL,
      audience,
      scope: 'openid profile email',
    });

    this.logger.debug(`Auth0Strategy initialized with domain: ${domain}`);
    this.logger.debug(`Callback URL: ${callbackURL}`);
    this.logger.debug(`Audience: ${audience}`);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    extraParams: any,
    profile: any,
  ): Promise<any> {
    this.logger.debug(`Auth0 profile validated: ${profile.id}`);
    
    return {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      accessToken,
      refreshToken,
      extraParams,
    };
  }
}