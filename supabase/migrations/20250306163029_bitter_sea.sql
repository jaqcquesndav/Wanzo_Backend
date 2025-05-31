/*
  # Initial Schema Setup for Admin Service

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `kiota_id` (text, unique)
      - `name` (text)
      - `email` (text, unique)
      - `role` (text)
      - `permissions` (jsonb)
      - `company_id` (uuid, nullable)
      - `phone` (text, nullable)
      - `profile_picture` (text, nullable)
      - `active` (boolean)
      - `metadata` (jsonb)
      - Timestamps (created_at, updated_at)

    - `companies`
      - `id` (uuid, primary key)
      - `kiota_id` (text, unique)
      - `name` (text)
      - `legal_form` (text)
      - `industry` (text)
      - `rccm` (text)
      - `idnat` (text)
      - `nif` (text)
      - `cnss` (text)
      - `addresses` (jsonb)
      - `contacts` (jsonb)
      - `subscription_plan` (text)
      - `subscription_status` (text)
      - `subscription_expires_at` (timestamptz)
      - `active` (boolean)
      - `metadata` (jsonb)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiota_id text UNIQUE NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '[]',
  company_id uuid,
  phone text,
  profile_picture text,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiota_id text UNIQUE NOT NULL,
  name text NOT NULL,
  legal_form text,
  industry text,
  rccm text,
  idnat text,
  nif text,
  cnss text,
  addresses jsonb NOT NULL DEFAULT '[]',
  contacts jsonb NOT NULL DEFAULT '{}',
  subscription_plan text NOT NULL DEFAULT 'free',
  subscription_status text NOT NULL DEFAULT 'active',
  subscription_expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE users
ADD CONSTRAINT fk_users_company
FOREIGN KEY (company_id)
REFERENCES companies(id)
ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
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

-- Create policies for companies table
CREATE POLICY "Users can view their company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (u.role = 'admin' OR (u.company_id = companies.id))
    )
  );

CREATE POLICY "Admins can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins and company superadmins can update companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (u.role = 'admin' OR (u.role = 'superadmin' AND u.company_id = companies.id))
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();