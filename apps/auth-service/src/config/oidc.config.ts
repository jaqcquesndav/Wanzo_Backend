import { registerAs } from '@nestjs/config';

export default registerAs('oidc', () => ({
  issuer: process.env.OIDC_ISSUER || 'https://auth.mondomaine.com',
  clientId: process.env.OIDC_CLIENT_ID || 'default-client-id',
  clientSecret: process.env.OIDC_CLIENT_SECRET || 'default-client-secret',
  redirectUri: process.env.OIDC_REDIRECT_URI || 'http://localhost:3000/oauth/callback',
  scopes: ['openid', 'profile', 'email', 'offline_access'],
  jwksUri: process.env.OIDC_JWKS_URI || 'https://auth.mondomaine.com/.well-known/jwks.json',
}));