import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const accessToken = req.cookies['access_token'];
    
    if (!accessToken) {
      throw new UnauthorizedException('No access token');
    }

    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      const response = await firstValueFrom(
        this.httpService.get(`${authServiceUrl}/auth/validate`, {
          headers: { Cookie: `access_token=${accessToken}` },
          withCredentials: true
        })
      );

      req['user'] = response.data;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}