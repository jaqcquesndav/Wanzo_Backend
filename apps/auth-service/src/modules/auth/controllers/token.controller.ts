import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('token')
@Controller('token')
export class TokenController {
  constructor(private readonly tokenBlacklistService: TokenBlacklistService) {}

  @Post('check-blacklist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('service')
  @ApiOperation({ summary: 'Check if a token is blacklisted' })
  @ApiResponse({ status: 200, description: 'Token blacklist status' })
  async checkBlacklist(
    @Body() body: { jti: string; userId: string },
  ) {
    const isBlacklisted = await this.tokenBlacklistService.isTokenBlacklisted(
      body.jti,
      body.userId
    );
    
    return {
      blacklisted: isBlacklisted
    };
  }
}
