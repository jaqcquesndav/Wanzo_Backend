import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

export interface CustomerTokenPayload {
  sub: string; // Customer ID
  customerType: 'sme' | 'financial_institution';
  subscriptionId?: string;
  planId?: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      customer?: {
        id: string;
        type: 'sme' | 'financial_institution';
        subscriptionId?: string;
        planId?: string;
        email: string;
        name: string;
      };
    }
  }
}

@Injectable()
export class CustomerExtractorMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.substring(7);
      
      if (!token) {
        return next();
      }

      // Décoder le token JWT
      const payload = this.jwtService.verify<CustomerTokenPayload>(token);
      
      if (payload && payload.sub) {
        // Extraire les informations du client depuis le token
        req.customer = {
          id: payload.sub,
          type: payload.customerType,
          subscriptionId: payload.subscriptionId,
          planId: payload.planId,
          email: payload.email,
          name: payload.name
        };
      }

      next();
    } catch (error) {
      // En cas d'erreur de vérification du token, continuer sans customer
      // Le guard d'authentification s'occupera de rejeter la requête si nécessaire
      next();
    }
  }
}

/**
 * Version simplifiée qui peut être utilisée si pas de JWT
 */
@Injectable()
export class SimpleCustomerExtractorMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // Version simplifiée pour les tests ou développement
    // En production, utilisez CustomerExtractorMiddleware avec JWT
    
    const customerId = req.headers['x-customer-id'] as string;
    const customerType = req.headers['x-customer-type'] as 'sme' | 'financial_institution';
    
    if (customerId && customerType) {
      req.customer = {
        id: customerId,
        type: customerType,
        email: `${customerId}@example.com`,
        name: `Customer ${customerId}`
      };
    }

    next();
  }
}
