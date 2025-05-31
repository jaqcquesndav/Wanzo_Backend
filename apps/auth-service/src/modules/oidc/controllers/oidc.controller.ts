import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OIDCService } from '../services/oidc.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

interface TokenRequest {
  grant_type: string;
  code: string;
  client_id: string;
  client_secret: string;
}

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

@ApiTags('oauth')
@Controller()
export class OIDCController {
  constructor(private readonly oidcService: OIDCService) {}

  @Get('.well-known/openid-configuration')
  @ApiOperation({ summary: 'Get OpenID Configuration' })
  @ApiResponse({ status: 200, description: 'OpenID configuration retrieved successfully' })
  async getOpenIDConfiguration(): Promise<Record<string, any>> {
    return await this.oidcService.getOpenIDConfiguration();
  }

  @Post('oauth/token')
  @ApiOperation({ summary: 'Exchange token' })
  @ApiResponse({ status: 200, description: 'Token exchange successful' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async token(@Body() tokenRequest: TokenRequest): Promise<Record<string, any>> {
    const { grant_type, code, client_id, client_secret } = tokenRequest;

    const client = await this.oidcService.validateClient(client_id, client_secret);
    if (!client) {
      throw new Error('Invalid client');
    }

    return this.oidcService.generateTokens('user-123', client_id, ['openid', 'profile']);
  }

  @Get('oauth/userinfo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async userinfo(@Req() req: AuthenticatedRequest): Promise<Record<string, any>> {
    return {
      sub: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      permissions: req.user.permissions,
    };
  }
}