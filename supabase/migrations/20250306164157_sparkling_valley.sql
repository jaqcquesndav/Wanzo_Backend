/*
  # Create Users Table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `kiota_id` (text, unique identifier for Kiota system)
      - `name` (text)
      - `email` (text, unique)
      - `role` (enum: admin, superadmin, user, manager, accountant, viewer)
      - `permissions` (jsonb array of application/access pairs)
      - `company_id` (uuid, foreign key to companies)
      - `phone` (text, optional)
      - `profile_picture` (text, optional)
      - `email_verified` (boolean)
      - `two_factor_enabled` (boolean)
      - `two_factor_secret` (text, optional)
      - `failed_login_attempts` (integer)
      - `last_login_attempt` (timestamptz)
      - `locked` (boolean)
      - `active` (boolean)
      - `metadata` (jsonb)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policies for:
      - Users can read their own data
      - Superadmins can read/write company users
      - Admins can read/write all users
*/

-- Create role enum type
CREATE TYPE user_role AS ENUM ('admin', 'superadmin', 'user', 'manager', 'accountant', 'viewer');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiota_id text UNIQUE NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  permissions jsonb[] NOT NULL DEFAULT '{}',
  company_id uuid REFERENCES companies(id),
  phone text,
  profile_picture text,
  email_verified boolean NOT NULL DEFAULT false,
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
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Superadmins can read/write company users" ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'superadmin'
      AND u.company_id = users.company_id
    )
  );

CREATE POLICY "Admins can read/write all users" ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();