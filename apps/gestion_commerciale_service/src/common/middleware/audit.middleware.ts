import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware pour l'audit des opérations effectuées par les utilisateurs
 */
@Injectable()
export class AuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AuditLog');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    // Journaliser la requête entrante
    this.logRequest(req);

    // Capturer la fin de la requête pour journaliser la réponse
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logResponse(req, res, duration);
    });

    next();
  }

  private logRequest(req: Request) {
    const user = req.user ? `${req.user['email']} (${req.user['id']})` : 'Non authentifié';
    const method = req.method;
    const url = req.originalUrl;
    const contentType = req.headers['content-type'] || 'non spécifié';
    const userAgent = req.headers['user-agent'] || 'inconnu';
    const ip = req.ip || req.connection.remoteAddress;
    
    this.logger.log(
      `REQUÊTE | User: ${user} | ${method} ${url} | Content-Type: ${contentType} | IP: ${ip} | Agent: ${userAgent}`
    );
    
    // Pour les opérations de modification, journaliser le corps de la requête
    // mais filtrer les informations sensibles
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const sanitizedBody = this.sanitizeObject(req.body);
      this.logger.debug(`Corps: ${JSON.stringify(sanitizedBody)}`);
    }
  }

  private logResponse(req: Request, res: Response, duration: number) {
    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;
    const user = req.user ? `${req.user['email']} (${req.user['id']})` : 'Non authentifié';
    
    const logLevel = status >= 400 ? 'warn' : 'log';
    
    this.logger[logLevel](
      `RÉPONSE | User: ${user} | ${method} ${url} | Status: ${status} | Durée: ${duration}ms`
    );
  }

  // Nettoyer les objets pour éviter de journaliser des informations sensibles
  private sanitizeObject(obj: any): any {
    if (!obj) return obj;
    
    const sensitiveFields = [
      'password', 'token', 'secret', 'credential', 'apiKey', 'api_key',
      'authorization', 'cardNumber', 'cvv', 'creditCard'
    ];
    
    const sanitized = { ...obj };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    });
    
    return sanitized;
  }
}
