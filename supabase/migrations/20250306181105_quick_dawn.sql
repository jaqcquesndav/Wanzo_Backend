/*
# Create companies table

1. New Tables
  - `companies`
    - `id` (uuid, primary key)
    - `kiota_id` (text, unique identifier)
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
  - Enable RLS on `companies` table
  - Add policies for:
    - Admins can read all companies
    - Superadmins can read their own company
    - Users can read their company
    - Admins can create/update companies
    - Superadmins can update their company
*/

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
  created_by uuid REFERENCES users(id),
  active boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can read all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Superadmins can read own company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can read their company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (id = (
    SELECT company_id 
    FROM users 
    WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Superadmins can update own company"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (id = (auth.jwt() ->> 'company_id')::uuid);

-- Create indexes
CREATE INDEX companies_subscription_status_idx ON companies(subscription_status);
CREATE INDEX companies_active_idx ON companies(active);

-- Create updated_at trigger
CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();

-- Add foreign key to users table
ALTER TABLE users
  ADD CONSTRAINT users_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE SET NULL;