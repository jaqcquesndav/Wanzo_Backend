import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async validateToken(token: string): Promise<Record<string, any>> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Validating token with auth service: ${authServiceUrl}`);

      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get(`${authServiceUrl}/oauth/userinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const user = response.data;
      
      // Vérifier que l'utilisateur a les scopes nécessaires
      const requiredScopes = ['admin:full', 'users:manage', 'settings:manage'];
      const userScopes = user.scope ? user.scope.split(' ') : [];
      
      if (!this.hasRequiredScopes(userScopes, requiredScopes)) {
        throw new UnauthorizedException('Insufficient permissions');
      }

      this.logger.debug(`Token validated successfully for user: ${user.sub}`);
      return user;
    } catch (error) {
      this.logger.error('Token validation failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private hasRequiredScopes(userScopes: string[], requiredScopes: string[]): boolean {
    return requiredScopes.some(scope => userScopes.includes(scope));
  }

  hasPermission(user: any, permission: string): boolean {
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) || false;
  }
}
