import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScopeDefinition } from '../../../config/scopes.config';

@Injectable()
export class ScopeService {
  private readonly scopeDefinitions: Record<string, ScopeDefinition>;

  constructor(private configService: ConfigService) {
    this.scopeDefinitions = this.configService.get<Record<string, ScopeDefinition>>('scopes.definitions') ?? {};
  }

  validateScopes(requestedScopes: string[], service: string): boolean {
    return requestedScopes.every(scope => {
      const definition = this.scopeDefinitions[scope];
      return definition && (
        definition.services.includes('*') ||
        definition.services.includes(service)
      );
    });
  }

  getServiceScopes(service: string): string[] {
    return Object.entries(this.scopeDefinitions)
      .filter(([_, definition]) => 
        definition.services.includes('*') ||
        definition.services.includes(service)
      )
      .map(([scope]) => scope);
  }

  getScopeDescriptions(scopes: string[]): Record<string, string> {
    return scopes.reduce((acc, scope) => {
      const definition = this.scopeDefinitions[scope];
      if (definition) {
        acc[scope] = definition.description;
      }
      return acc;
    }, {} as Record<string, string>);
  }

  getScopeServices(scope: string): string[] {
    const definition = this.scopeDefinitions[scope];
    return definition ? definition.services : [];
  }

  isScopeValid(scope: string): boolean {
    return scope in this.scopeDefinitions;
  }

  getScopeInfo(scope: string): ScopeDefinition | null {
    return this.scopeDefinitions[scope] || null;
  }
}