import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserProfileDto } from '../dto/user-profile.dto';

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
      const response = await this.authService.validateToken(token);
      if (!response.isValid || !response.user) {
        throw new UnauthorizedException('Invalid token');
      }
      
      const userProfile: UserProfileDto = response.user;
      // Assign the user profile to the request object, with explicit type casting to avoid TS errors
      req['user'] = userProfile as any;
      
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}