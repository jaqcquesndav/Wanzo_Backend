import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenBlacklist } from '../entities';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, let passport validate the JWT
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (token) {
      try {
        // Check if token is blacklisted
        const payload = this.decodeJWT(token);
        const isBlacklisted = await this.isTokenBlacklisted(payload?.jti || token);
        
        if (isBlacklisted) {
          console.log('🚫 JWT AUTH GUARD: Token is blacklisted');
          throw new UnauthorizedException('Token has been invalidated');
        }

        console.log('✅ JWT AUTH GUARD: Token is valid and not blacklisted');
      } catch (error: any) {
        console.log('⚠️ JWT AUTH GUARD: Error checking blacklist:', error.message);
        // For now, continue even if blacklist check fails to avoid blocking
        // In production, you might want to fail closed
      }
    }

    return true;
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('🛡️ JWT AUTH GUARD handleRequest called');
    console.log('❌ Error:', err || 'No error');
    console.log('👤 User:', user ? 'User found' : 'No user');
    console.log('ℹ️ Info:', info || 'No info');

    if (err || !user) {
      throw err || new UnauthorizedException('Authentification invalide');
    }
    return user;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = Buffer.from(payload, 'base64').toString();
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  private async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    try {
      const blacklistedToken = await this.tokenBlacklistRepository.findOne({
        where: { tokenId }
      });
      return !!blacklistedToken;
    } catch (error) {
      this.logger.error('Error checking token blacklist:', error);
      return false; // Fail open for now
    }
  }
}
