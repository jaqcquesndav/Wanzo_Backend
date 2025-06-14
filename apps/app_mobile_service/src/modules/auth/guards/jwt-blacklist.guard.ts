import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtBlacklistGuard implements CanActivate {
  private readonly logger = new Logger(JwtBlacklistGuard.name);

  constructor(
    private jwtService: JwtService,
    private httpService: HttpService,
    private configService: ConfigService,
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
      const jti = payload.jti || 'unknown'; // Ensure jti is always a string
      
      // Check if the token is blacklisted by calling the auth service
      const isBlacklisted = await this.checkTokenBlacklist(jti, userId);
      
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
      
      // If everything is valid, set the user in the request
      request['user'] = payload;
      return true;
    } catch (error) {      const errorMessage = error instanceof Error ? error.message : 'Unknown JWT validation error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`JWT validation error: ${errorMessage}`, errorStack);
      
      // Vérifier si l'erreur provient de nos propres validations
      if (error instanceof UnauthorizedException) {
        throw error; // Rethrow the original error with its message
      }
      
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async checkTokenBlacklist(jti: string, userId: string): Promise<boolean> {
    try {
      const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
      if (!authServiceUrl) {
        this.logger.error('AUTH_SERVICE_URL is not configured');
        throw new UnauthorizedException('Token validation service not configured');
      }
      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/token/check-blacklist`, { 
          jti,
          userId
        }).pipe(
          catchError((error) => {
            this.logger.error(`Error checking token blacklist with auth-service: ${error.message}`, error.stack);
            // Decide whether to fail open or closed. For security, failing closed (token considered blacklisted) is safer.
            throw new UnauthorizedException('Error validating token with blacklist service');
          }),
        ),
      );
      
      return response.data.blacklisted;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error checking token blacklist';
      this.logger.error(`Failed to check token blacklist: ${errorMessage}`);
      // Fail closed for security if any error occurs during the check
      throw new UnauthorizedException('Token validation failed');
    }
  }
}