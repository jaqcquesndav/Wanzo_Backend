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
      const jti = payload.jti || 'unknown';
      
      // Check if the token is blacklisted by calling the auth service
      const isBlacklisted = await this.checkTokenBlacklist(jti, userId);
      
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
      
      // If everything is valid, set the user in the request
      request['user'] = payload;
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown JWT validation error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`JWT validation error: ${errorMessage}`, errorStack);
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw specific UnauthorizedException
      }
      throw new UnauthorizedException('Invalid token'); // Default for other errors
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async checkTokenBlacklist(jti: string, userId: string): Promise<boolean> {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/token/check-blacklist`, {
          jti,
          userId
        }).pipe(
          catchError((error) => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error checking token blacklist';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Error checking token blacklist (via HttpService): ${errorMessage}`, errorStack);
            // This specific exception will be caught by canActivate's try-catch
            throw new UnauthorizedException('Error validating token with auth-service');
          }),
        ),
      );

      if (response && response.data && typeof response.data.blacklisted === 'boolean') {
        return response.data.blacklisted;
      } else {
        this.logger.error('Invalid response structure from auth service blacklist check');
        throw new UnauthorizedException('Invalid response from auth-service');
      }
    } catch (error) {
      // This catch block will now primarily handle errors propagated from the pipe,
      // or if configService.get fails, or if new UnauthorizedException('Invalid response from auth-service') is thrown.
      if (error instanceof UnauthorizedException) {
        // Re-throw the specific UnauthorizedExceptions that we expect to be handled by canActivate
        throw error;
      }
      // For other unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in checkTokenBlacklist processing';
      this.logger.error(`Unexpected error in checkTokenBlacklist: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      // Default to fail-closed for security if the blacklist status cannot be determined by throwing an error
      // that canActivate will handle as a validation failure.
      throw new UnauthorizedException('Failed to determine token blacklist status');
    }
  }
}
