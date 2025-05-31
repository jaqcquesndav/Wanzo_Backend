import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  clientId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  session?: {
    authRequest?: {
      clientId: string;
      redirectUri: string;
      scope: string;
      responseType: string;
      state?: string;
      codeChallenge?: string;
      codeChallengeMethod?: string;
    };
  };
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token: string;
  refresh_token: string;
  scope: string;
}

export interface TokenRequest {
  grant_type: string;
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
  code_verifier?: string;
}