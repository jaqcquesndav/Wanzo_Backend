import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { TokenBlacklistService } from '../services/token-blacklist.service';

@Injectable()
export class JwtBlacklistGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    
    try {
      // Verify the token
      const payload = await this.jwtService.verifyAsync(token);
      
      // Extract user ID and token JTI (JWT ID)
      const userId = payload.sub;
      const jti = payload.jti || 'unknown';
      
      // Check if the token is blacklisted
      const isBlacklisted = await this.tokenBlacklistService.isTokenBlacklisted(jti, userId);
      
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
      
      // If everything is valid, set the user in the request
      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
