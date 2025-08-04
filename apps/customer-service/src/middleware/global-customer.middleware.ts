import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class GlobalCustomerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Ce middleware pourrait être utilisé pour des configurations globales
    // Pour l'instant, il ne fait que passer au suivant
    next();
  }
}
