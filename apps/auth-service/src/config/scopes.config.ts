import { registerAs } from '@nestjs/config';

export interface ScopeDefinition {
  name: string;
  description: string;
  services: string[];
}

export interface ScopesConfig {
  definitions: Record<string, ScopeDefinition>;
}

export default registerAs('scopes', (): ScopesConfig => ({
  definitions: {
    'openid': {
      name: 'OpenID',
      description: 'Basic OpenID Connect scope',
      services: ['*'],
    },
    'profile': {
      name: 'Profile',
      description: 'Access to user profile information',
      services: ['*'],
    },
    'admin:full': {
      name: 'Full Admin Access',
      description: 'Complete access to administrative functions',
      services: ['admin-service'],
    },
    'users:manage': {
      name: 'User Management',
      description: 'Ability to manage users and their permissions',
      services: ['admin-service'],
    },
    'settings:manage': {
      name: 'Settings Management',
      description: 'Ability to manage system settings',
      services: ['admin-service'],
    },
    'accounting:read': {
      name: 'Read Accounting',
      description: 'Access to view accounting information',
      services: ['accounting-service'],
    },
    'accounting:write': {
      name: 'Write Accounting',
      description: 'Ability to modify accounting information',
      services: ['accounting-service'],
    },
    'portfolio:read': {
      name: 'Read Portfolio',
      description: 'Access to view portfolio information',
      services: ['portfolio-institution-service', 'portfolio-sms-service'],
    },
    'portfolio:write': {
      name: 'Write Portfolio',
      description: 'Ability to modify portfolio information',
      services: ['portfolio-institution-service', 'portfolio-sms-service'],
    },
    'institution:manage': {
      name: 'Institution Management',
      description: 'Ability to manage institutional portfolios',
      services: ['portfolio-institution-service'],
    },
    'sms:manage': {
      name: 'SMS Management',
      description: 'Ability to manage SMS-related features',
      services: ['portfolio-sms-service'],
    },
  },
}));