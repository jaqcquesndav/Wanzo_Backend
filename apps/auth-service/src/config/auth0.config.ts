import { registerAs } from '@nestjs/config';

export interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecret: string;
  audience: string;
  callbackUrl: string;
  logoutUrl: string;
  managementApiAudience: string;
  managementApiClientId: string;
  managementApiClientSecret: string;
  managementApiScopes: string[];
}

export default registerAs('auth0', (): Auth0Config => ({
  domain: process.env.AUTH0_DOMAIN || '',
  clientId: process.env.AUTH0_CLIENT_ID || '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  audience: process.env.AUTH0_AUDIENCE || 'https://api.kiota.com',
  callbackUrl: process.env.AUTH0_CALLBACK_URL || 'http://localhost:5173/auth/callback',
  logoutUrl: process.env.AUTH0_LOGOUT_URL || 'http://localhost:5173',
  managementApiAudience: process.env.AUTH0_MANAGEMENT_API_AUDIENCE || 'https://dev-tezmln0tk0g1gouf.eu.auth0.com/api/v2/',
  managementApiClientId: process.env.AUTH0_MANAGEMENT_API_CLIENT_ID || '',
  managementApiClientSecret: process.env.AUTH0_MANAGEMENT_API_CLIENT_SECRET || '',
  managementApiScopes: [
    'read:users',
    'create:users',
    'update:users',
    'delete:users',
    'read:roles',
    'create:role_members',
    'update:role_members',
    'delete:role_members',
    'read:user_idp_tokens'
  ],
}));