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
      - `addresses` (jsonb array)
      - `contacts` (jsonb)
      - `subscription_plan` (text)
      - `subscription_status` (text)
      - `subscription_expires_at` (timestamptz)
      - `created_by` (uuid)
      - `active` (boolean)
      - `metadata` (jsonb)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policies for company access
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
  addresses jsonb[] NOT NULL DEFAULT '{}',
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
CREATE POLICY "Users can view their own company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Admins can view all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create updated_at trigger
CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();