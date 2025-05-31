import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly states: Map<string, CircuitBreakerState> = new Map();
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;

  constructor(private configService: ConfigService) {
    this.failureThreshold = this.configService.get('CIRCUIT_BREAKER_THRESHOLD', 5);
    this.resetTimeout = this.configService.get('CIRCUIT_BREAKER_TIMEOUT', 60000);
  }

  canRequest(service: string): boolean {
    const state = this.getState(service);
    if (!state.isOpen) return true;

    const now = Date.now();
    if (now - state.lastFailure > this.resetTimeout) {
      this.reset(service);
      return true;
    }

    return false;
  }

  recordSuccess(service: string): void {
    this.reset(service);
  }

  recordFailure(service: string): boolean {
    const state = this.getState(service);
    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= this.failureThreshold) {
      state.isOpen = true;
      this.logger.warn(`Circuit breaker opened for service: ${service}`);
      return true;
    }

    return false;
  }

  private getState(service: string): CircuitBreakerState {
    if (!this.states.has(service)) {
      this.states.set(service, {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
      });
    }
    return this.states.get(service)!;
  }

  private reset(service: string): void {
    this.states.set(service, {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    });
  }
}