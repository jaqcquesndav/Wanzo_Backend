import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OIDCClient } from '../entities/client.entity';
import { TokenResponseDto } from '../dtos/token.dto';

interface TokenPayload {
  sub: string;
  client_id: string;
  aud?: string;
  scope?: string;
}

interface OpenIDConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint: string;
  jwks_uri: string;
  scopes_supported: string[];
  response_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  grant_types_supported: string[];
}

@Injectable()
export class OIDCService {
  constructor(
    @InjectRepository(OIDCClient)
    private clientRepository: Repository<OIDCClient>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateTokens(userId: string, clientId: string, scopes: string[]): TokenResponseDto {
    const accessTokenPayload: TokenPayload = {
      sub: userId,
      client_id: clientId,
      scope: scopes.join(' '),
    };

    const idTokenPayload: TokenPayload = {
      sub: userId,
      client_id: clientId,
      aud: clientId,
    };

    const refreshTokenPayload: TokenPayload = {
      sub: userId,
      client_id: clientId,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, { expiresIn: '1h' });
    const idToken = this.jwtService.sign(idTokenPayload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(refreshTokenPayload, { expiresIn: '30d' });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      id_token: idToken,
      refresh_token: refreshToken,
      scope: scopes.join(' '),
    };
  }

  async getOpenIDConfiguration(): Promise<OpenIDConfiguration> {
    const issuer = this.configService.get<string>('oidc.issuer') || 'http://localhost:3000';
    return {
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      userinfo_endpoint: `${issuer}/oauth/userinfo`,
      end_session_endpoint: `${issuer}/oauth/logout`,
      jwks_uri: `${issuer}/.well-known/jwks.json`,
      scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
      response_types_supported: ['code', 'token', 'id_token token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
    };
  }

  async validateClient(clientId: string, clientSecret: string): Promise<OIDCClient | null> {
    return await this.clientRepository.findOne({
      where: { clientId, clientSecret, active: true },
    });
  }
}