// Nouveau fichier: apps/auth-service/src/common/services/logger.service.ts

import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context: string;

  constructor(context?: string) {
    this.context = context || 'App';
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    console.log(`[${context || this.context}] ${message}`);
  }

  error(message: any, trace?: string, context?: string) {
    console.error(`[${context || this.context}] ERROR: ${message}`);
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: any, context?: string) {
    console.warn(`[${context || this.context}] WARN: ${message}`);
  }

  debug(message: any, context?: string) {
    console.debug(`[${context || this.context}] DEBUG: ${message}`);
  }

  verbose(message: any, context?: string) {
    console.log(`[${context || this.context}] VERBOSE: ${message}`);
  }
}
