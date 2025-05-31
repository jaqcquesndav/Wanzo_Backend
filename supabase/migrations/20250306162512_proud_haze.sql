/*
  # Create Users Table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `kiota_id` (text, unique identifier)
      - `name` (text)
      - `email` (text, unique)
      - `role` (enum)
      - `permissions` (jsonb)
      - `company_id` (uuid, foreign key)
      - `active` (boolean)
      - `metadata` (jsonb)
      - Timestamps

  2. Security
    - Enable RLS
    - Add policies for:
      - Users can read their own data
      - Admins can read all data
      - Superadmins can read company data
*/

-- Create role enum type
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
  role user_role NOT NULL DEFAULT 'user',
  permissions jsonb NOT NULL DEFAULT '[]',
  company_id uuid REFERENCES companies(id),
  phone text,
  profile_picture text,
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

CREATE POLICY "Admins can read all data" ON users
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Superadmins can read company data" ON users
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'superadmin' 
    AND company_id = (auth.jwt() ->> 'company_id')::uuid
  );

-- Create indexes
CREATE INDEX users_company_id_idx ON users(company_id);
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_role_idx ON users(role);