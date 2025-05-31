import { Controller, Get, Post, Body, Req, Res, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthorizationService } from '../services/authorization.service';
import { OIDCService } from '../services/oidc.service';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest, TokenRequest } from '../interfaces/auth.interfaces';
import { TokenResponseDto } from '../dtos/token.dto';

@ApiTags('oauth')
@Controller('oauth')
export class AuthorizationController {
  constructor(
    private authorizationService: AuthorizationService,
    private oidcService: OIDCService,
    private userService: UserService,
  ) {}

  @Get('authorize')
  @ApiOperation({ 
    summary: 'Authorization endpoint',
    description: 'OAuth2 authorization endpoint for initiating the authorization flow'
  })
  @ApiQuery({ name: 'client_id', required: true, description: 'OAuth client ID' })
  @ApiQuery({ name: 'redirect_uri', required: true, description: 'Callback URL' })
  @ApiQuery({ name: 'scope', required: true, description: 'Requested scopes (space-separated)' })
  @ApiQuery({ name: 'response_type', required: true, description: 'Response type (code)' })
  @ApiQuery({ name: 'state', required: false, description: 'State parameter for CSRF protection' })
  @ApiQuery({ name: 'code_challenge', required: false, description: 'PKCE code challenge' })
  @ApiQuery({ name: 'code_challenge_method', required: false, description: 'PKCE code challenge method' })
  @ApiResponse({ status: 302, description: 'Redirect to login or callback URL' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async authorize(
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('scope') scope: string,
    @Query('response_type') responseType: string,
    @Query('state') state: string,
    @Query('code_challenge') codeChallenge: string | undefined,
    @Query('code_challenge_method') codeChallengeMethod: string | undefined,
    @Res() res: Response,
    @Req() req?: AuthenticatedRequest,
  ): Promise<void> {
    try {
      const scopes = scope.split(' ');
      
      const client = await this.authorizationService.validateAuthorizationRequest(
        clientId,
        redirectUri,
        scopes,
        responseType,
        codeChallenge,
        codeChallengeMethod,
      );

      if (!req?.user) {
        if (req?.session) {
          req.session.authRequest = {
            clientId,
            redirectUri,
            scope,
            responseType,
            state,
            codeChallenge,
            codeChallengeMethod,
          };
        }

        return res.redirect(`/login?redirect=${encodeURIComponent('/oauth/authorize')}`);
      }

      const user = await this.userService.findById(req.user.id);
      const code = await this.authorizationService.createAuthorizationCode(
        client,
        user,
        scopes,
        redirectUri,
        codeChallenge,
        codeChallengeMethod,
      );

      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.set('code', code);
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.set('error', error instanceof Error ? error.name : 'UnknownError');
      redirectUrl.searchParams.set('error_description', error instanceof Error ? error.message : 'Unknown error occurred');
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }

      return res.redirect(redirectUrl.toString());
    }
  }

  @Post('token')
  @ApiOperation({ 
    summary: 'Token endpoint',
    description: 'OAuth2 token endpoint for exchanging authorization code for tokens'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['grant_type', 'code', 'redirect_uri', 'client_id', 'client_secret'],
      properties: {
        grant_type: {
          type: 'string',
          enum: ['authorization_code'],
          description: 'OAuth grant type',
        },
        code: {
          type: 'string',
          description: 'Authorization code',
        },
        redirect_uri: {
          type: 'string',
          description: 'Callback URL',
        },
        client_id: {
          type: 'string',
          description: 'OAuth client ID',
        },
        client_secret: {
          type: 'string',
          description: 'OAuth client secret',
        },
        code_verifier: {
          type: 'string',
          description: 'PKCE code verifier',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Tokens generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Invalid client credentials' })
  async token(@Body() tokenRequest: TokenRequest): Promise<TokenResponseDto> {
    const { grant_type, code, redirect_uri, client_id, client_secret, code_verifier } = tokenRequest;

    const client = await this.oidcService.validateClient(client_id, client_secret);
    if (!client) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    if (grant_type !== 'authorization_code') {
      throw new UnauthorizedException('Unsupported grant type');
    }

    const { userId, scopes } = await this.authorizationService.validateAuthorizationCode(
      code,
      client_id,
      redirect_uri,
      code_verifier,
    );

    return this.oidcService.generateTokens(userId, client_id, scopes);
  }
}