/*
  # Create Companies Table

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `kiota_id` (text, unique identifier with format KIOTA-COM-XXXXXXXX-XX)
      - `name` (text)
      - `legal_form` (text)
      - `industry` (text)
      - `rccm` (text)
      - `idnat` (text)
      - `nif` (text)
      - `cnss` (text)
      - `addresses` (jsonb array)
      - `contacts` (jsonb)
      - `subscription_plan` (text)
      - `subscription_status` (text)
      - `subscription_expires_at` (timestamptz)
      - `active` (boolean)
      - `metadata` (jsonb)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policies for company access
*/

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
  addresses jsonb[] NOT NULL DEFAULT '{}',
  contacts jsonb NOT NULL DEFAULT '{}',
  subscription_plan text NOT NULL DEFAULT 'free',
  subscription_status text NOT NULL DEFAULT 'active',
  subscription_expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (u.company_id = companies.id OR u.role = 'admin')
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

CREATE POLICY "Company admins can update their company"
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

-- Create updated_at trigger
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();