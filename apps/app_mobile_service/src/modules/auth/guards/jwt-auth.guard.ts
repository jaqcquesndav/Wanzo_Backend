import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenBlacklist } from '../entities';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
    // Get the JWT token from the request
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant ou format invalide');
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' from the header
    
    // Check if the token is in the blacklist
    const isValid = await this.validateToken(token);
    if (!isValid) {
      throw new UnauthorizedException('Token invalidé ou expiré');
    }
    
    // Continue with the standard JWT validation
    return super.canActivate(context) as Promise<boolean>;
  }

  private async validateToken(token: string): Promise<boolean> {
    const blacklistedToken = await this.tokenBlacklistRepository.findOne({ where: { token } });
    return !blacklistedToken; // Return true if token is not blacklisted
  }

  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException('Authentification invalide');
    }
    return user;
  }
}
