/*
  # Create Users Table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `kiota_id` (text, unique identifier with format KIOTA-USR-XXXXXXXX-XX)
      - `name` (text)
      - `email` (text, unique)
      - `role` (enum: admin, superadmin, user, manager, accountant, viewer)
      - `permissions` (jsonb array of application access objects)
      - `company_id` (uuid, foreign key)
      - `phone` (text, optional)
      - `profile_picture` (text, optional)
      - `active` (boolean)
      - `metadata` (jsonb)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policies for user access
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
  company_id uuid,
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
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (u.role = 'admin' OR (u.role = 'superadmin' AND u.company_id = users.company_id))
    )
  );

CREATE POLICY "Admins can create users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (u.role = 'admin' OR u.role = 'superadmin')
    )
  );

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (u.role = 'admin' OR (u.role = 'superadmin' AND u.company_id = users.company_id))
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();