/*
  # Create Companies Table

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
      - `active` (boolean)
      - `metadata` (jsonb)
      - Timestamps

  2. Security
    - Enable RLS
    - Add policies for:
      - Admins can read all companies
      - Superadmins can read/write their own company
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
  addresses jsonb NOT NULL DEFAULT '[]',
  contacts jsonb NOT NULL DEFAULT '{}',
  subscription_plan text NOT NULL DEFAULT 'free',
  subscription_status text NOT NULL DEFAULT 'active',
  subscription_expires_at timestamptz,
  created_by uuid,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can read all companies" ON companies
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Superadmins can manage their company" ON companies
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'superadmin' 
    AND id = (auth.jwt() ->> 'company_id')::uuid
  );

-- Create indexes
CREATE INDEX companies_subscription_status_idx ON companies(subscription_status);
CREATE INDEX companies_active_idx ON companies(active);