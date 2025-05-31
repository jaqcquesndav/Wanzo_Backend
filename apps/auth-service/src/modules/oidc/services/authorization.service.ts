import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { OIDCClient } from '../entities/client.entity';
import { User } from '../entities/user.entity';
import { SessionService } from './session.service';
import * as crypto from 'crypto';

interface AuthorizationResult {
  userId: string;
  scopes: string[];
}

interface SessionData {
  userId: string;
  clientId: string;
  scopes: string[];
  nonce: string;
  authTime: Date;
  claims: Record<string, any>;
  expiresAt: Date;
}

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(AuthorizationCode)
    private authorizationCodeRepository: Repository<AuthorizationCode>,
    @InjectRepository(OIDCClient)
    private clientRepository: Repository<OIDCClient>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private sessionService: SessionService,
  ) {}

  async validateAuthorizationRequest(
    clientId: string,
    redirectUri: string,
    scopes: string[],
    responseType: string,
    codeChallenge?: string,
    codeChallengeMethod?: string,
  ): Promise<OIDCClient> {
    const client = await this.clientRepository.findOne({ where: { clientId, active: true } });
    if (!client) {
      throw new UnauthorizedException('Invalid client');
    }

    if (!client.redirectUris.includes(redirectUri)) {
      throw new BadRequestException('Invalid redirect URI');
    }

    if (responseType !== 'code') {
      throw new BadRequestException('Unsupported response type');
    }

    if (codeChallenge && !codeChallengeMethod) {
      throw new BadRequestException('Code challenge method is required when code challenge is provided');
    }

    if (codeChallengeMethod && codeChallengeMethod !== 'S256') {
      throw new BadRequestException('Unsupported code challenge method');
    }

    const invalidScopes = scopes.filter(scope => !client.allowedScopes.includes(scope));
    if (invalidScopes.length > 0) {
      throw new BadRequestException(`Invalid scopes: ${invalidScopes.join(', ')}`);
    }

    return client;
  }

  async createAuthorizationCode(
    client: OIDCClient,
    user: User,
    scopes: string[],
    redirectUri: string,
    codeChallenge?: string,
    codeChallengeMethod?: string,
  ): Promise<string> {
    const code = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes

    const authorizationCode = this.authorizationCodeRepository.create({
      code,
      clientId: client.clientId,
      userId: user.id,
      scopes,
      redirectUri,
      codeChallenge,
      codeChallengeMethod,
      expiresAt,
    });

    await this.authorizationCodeRepository.save(authorizationCode);
    return code;
  }

  async validateAuthorizationCode(
    code: string,
    clientId: string,
    redirectUri: string,
    codeVerifier?: string,
  ): Promise<AuthorizationResult> {
    const authorizationCode = await this.authorizationCodeRepository.findOne({
      where: { code, clientId },
    });

    if (!authorizationCode) {
      throw new UnauthorizedException('Invalid authorization code');
    }

    if (authorizationCode.expiresAt < new Date()) {
      throw new UnauthorizedException('Authorization code has expired');
    }

    if (authorizationCode.redirectUri !== redirectUri) {
      throw new UnauthorizedException('Invalid redirect URI');
    }

    if (authorizationCode.codeChallenge) {
      if (!codeVerifier) {
        throw new BadRequestException('Code verifier is required');
      }

      const hash = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      if (hash !== authorizationCode.codeChallenge) {
        throw new UnauthorizedException('Invalid code verifier');
      }
    }

    await this.authorizationCodeRepository.remove(authorizationCode);

    return {
      userId: authorizationCode.userId,
      scopes: authorizationCode.scopes,
    };
  }
}