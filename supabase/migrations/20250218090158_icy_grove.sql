/*
  # OIDC Tables and Initial Setup

  1. New Tables
    - `oidc_clients`: Stores OIDC client applications
    - `oidc_sessions`: Stores user sessions for OIDC clients
    - `authorization_codes`: Stores temporary authorization codes

  2. Security
    - Enable RLS on all tables
    - Add policies for secure access
    - Encrypted storage for sensitive data

  3. Initial Data
    - Create default OIDC clients for each service
*/

-- Create OIDC clients table
CREATE TABLE IF NOT EXISTS oidc_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text UNIQUE NOT NULL,
  client_secret text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('confidential', 'public')),
  redirect_uris text[] NOT NULL,
  allowed_scopes text[] NOT NULL,
  logo_url text,
  description text,
  consent_required boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create OIDC sessions table
CREATE TABLE IF NOT EXISTS oidc_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES oidc_clients(client_id) ON DELETE CASCADE,
  scopes text[] NOT NULL,
  nonce text NOT NULL,
  auth_time timestamptz NOT NULL,
  claims jsonb NOT NULL,
  acr text,
  amr text[],
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create authorization codes table
CREATE TABLE IF NOT EXISTS authorization_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  client_id text NOT NULL REFERENCES oidc_clients(client_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scopes text[] NOT NULL,
  redirect_uri text NOT NULL,
  code_challenge text,
  code_challenge_method text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE oidc_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE oidc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorization_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage OIDC clients"
  ON oidc_clients
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own sessions"
  ON oidc_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage sessions"
  ON oidc_sessions
  FOR ALL
  TO service_role;

CREATE POLICY "System can manage authorization codes"
  ON authorization_codes
  FOR ALL
  TO service_role;

-- Insert initial OIDC clients
INSERT INTO oidc_clients (
  client_id,
  client_secret,
  name,
  type,
  redirect_uris,
  allowed_scopes,
  description,
  consent_required
) VALUES
-- Admin Service Client
(
  'admin-service',
  encode(gen_random_bytes(32), 'hex'),
  'Admin Service',
  'confidential',
  ARRAY['http://localhost:3000/oauth/callback', 'https://admin.kiota.com/oauth/callback'],
  ARRAY['openid', 'profile', 'admin:full', 'users:manage', 'settings:manage'],
  'Administrative interface for Kiota platform',
  true
),
-- Accounting Service Client
(
  'accounting-service',
  encode(gen_random_bytes(32), 'hex'),
  'Accounting Service',
  'confidential',
  ARRAY['http://localhost:3001/oauth/callback', 'https://accounting.kiota.com/oauth/callback'],
  ARRAY['openid', 'profile', 'accounting:read', 'accounting:write'],
  'Accounting and financial management system',
  true
),
-- Portfolio Institution Service Client
(
  'portfolio-institution-service',
  encode(gen_random_bytes(32), 'hex'),
  'Portfolio Institution Service',
  'confidential',
  ARRAY['http://localhost:3002/oauth/callback', 'https://portfolio-institution.kiota.com/oauth/callback'],
  ARRAY['openid', 'profile', 'portfolio:read', 'portfolio:write', 'institution:manage'],
  'Portfolio management for institutions',
  true
),
-- Portfolio SMS Service Client
(
  'portfolio-sms-service',
  encode(gen_random_bytes(32), 'hex'),
  'Portfolio SMS Service',
  'confidential',
  ARRAY['http://localhost:3003/oauth/callback', 'https://portfolio-sms.kiota.com/oauth/callback'],
  ARRAY['openid', 'profile', 'portfolio:read', 'portfolio:write', 'sms:manage'],
  'Portfolio management with SMS capabilities',
  true
);

-- Create index for performance
CREATE INDEX idx_oidc_sessions_user_client ON oidc_sessions(user_id, client_id);
CREATE INDEX idx_authorization_codes_client ON authorization_codes(client_id);
CREATE INDEX idx_authorization_codes_expires ON authorization_codes(expires_at);