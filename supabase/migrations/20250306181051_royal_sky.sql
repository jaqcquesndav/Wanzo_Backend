/*
# Create users table

1. New Tables
  - `users`
    - `id` (uuid, primary key)
    - `kiota_id` (text, unique identifier)
    - `name` (text)
    - `email` (text, unique)
    - `password` (text)
    - `role` (enum)
    - `permissions` (jsonb)
    - `company_id` (uuid, nullable)
    - `phone` (text, nullable)
    - `profile_picture` (text, nullable)
    - `email_verified` (boolean)
    - `two_factor_enabled` (boolean)
    - `active` (boolean)
    - `metadata` (jsonb)
    - Timestamps (created_at, updated_at)

2. Security
  - Enable RLS on `users` table
  - Add policies for:
    - Admins can read all users
    - Superadmins can read users in their company
    - Users can read their own data
    - Admins can create/update users
    - Superadmins can create/update users in their company
*/

-- Create user role enum
CREATE TYPE user_role AS ENUM (
  'admin',
  'superadmin',
  'user',
  'manager',
  'accountant',
  'viewer'
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiota_id text UNIQUE NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  permissions jsonb NOT NULL DEFAULT '[]',
  company_id uuid,
  phone text,
  profile_picture text,
  email_verified boolean NOT NULL DEFAULT false,
  email_verification_token text,
  email_verification_token_expires timestamptz,
  password_reset_token text,
  password_reset_token_expires timestamptz,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  two_factor_secret text,
  failed_login_attempts integer NOT NULL DEFAULT 0,
  last_login_attempt timestamptz,
  locked boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Superadmins can read company users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'superadmin' 
    AND company_id = (auth.jwt() ->> 'company_id')::uuid
  );

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can create users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Superadmins can create company users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'superadmin'
    AND company_id = (auth.jwt() ->> 'company_id')::uuid
  );

CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Superadmins can update company users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'superadmin'
    AND company_id = (auth.jwt() ->> 'company_id')::uuid
  );

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Create indexes
CREATE INDEX users_company_id_idx ON users(company_id);
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_role_idx ON users(role);
CREATE INDEX users_active_idx ON users(active);

-- Create updated_at trigger
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();