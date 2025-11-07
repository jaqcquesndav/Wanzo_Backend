import { Controller, Get, Post, Body, HttpException, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ScopesGuard } from '../../auth/scopes.guard';
import { Scopes } from '../../auth/scopes.decorator';

class RegisterDto {
  username!: string;
  affiliation?: string;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Intent: health; Fabric CA registration via fabric-gateway; delegated login via Auth0; JWT profile echo

  @Get('health')
  @ApiOperation({ summary: 'Users module health' })
  health() {
    return { status: 'ok' };
  }

  @UseGuards(JwtAuthGuard, ScopesGuard)
  @Post('register')
  @Scopes('users:register')
  @ApiOperation({
    summary: 'Register & enroll a Fabric identity (via fabric-gateway)',
    description:
      'Provisions a new identity using Fabric CA. Requires fabric-gateway to expose CA endpoints and be configured.',
  })
  @ApiResponse({ status: 501, description: 'Fabric CA not configured' })
  async register(@Body() body: RegisterDto) {
    const supported = await this.usersService.isCaSupported();
    if (!supported) {
      throw new HttpException('Fabric CA not configured', HttpStatus.NOT_IMPLEMENTED);
    }
    return this.usersService.register(body);
  }

  @Get('ca/status')
  @ApiOperation({ summary: 'Get Fabric CA status (via fabric-gateway)' })
  async caStatus() {
    return this.usersService.getCaStatus();
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate via Auth0 (delegated)' })
  @ApiResponse({ status: 501, description: 'Use Auth0 OAuth2 to obtain JWT' })
  login() {
    throw new HttpException('Use Auth0 OAuth2 to obtain JWT', HttpStatus.NOT_IMPLEMENTED);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile from JWT' })
  me(@Req() req: any) {
    const { sub, scope, email } = req.user || {};
    return { sub, email: email || null, scope: scope || '' };
  }
}
