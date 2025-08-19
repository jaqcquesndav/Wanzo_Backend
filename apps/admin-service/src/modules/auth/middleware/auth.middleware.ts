import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer') {
      throw new UnauthorizedException('Invalid token type');
    }

    try {
      const tokenResponse = await this.authService.validateToken(token);
      
      // Ensure we have a valid user with an ID
      if (!tokenResponse.isValid || !tokenResponse.user || !tokenResponse.user.id) {
        throw new UnauthorizedException('Invalid token or user data');
      }
      
      // Set the user object on the request
      req['user'] = tokenResponse.user;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
