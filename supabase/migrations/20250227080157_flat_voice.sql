/*
  # Mise à jour des tables utilisateurs et entreprises

  1. Modifications de la table users
    - Ajout de la colonne `company_id` pour lier les utilisateurs à leur entreprise
    - Ajout de la colonne `metadata` pour stocker des informations supplémentaires
    - Mise à jour du type de la colonne `role` pour utiliser une énumération

  2. Création de la table companies
    - Structure complète pour stocker les informations des entreprises
    - Relations avec les utilisateurs
    - Champs pour les informations légales et de contact

  3. Security
    - Enable RLS on `companies` table
    - Add policies for authenticated users to manage their own company data
*/

-- Création du type d'énumération pour les rôles utilisateur
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'superadmin', 'user', 'manager', 'accountant', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Mise à jour de la table users
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Modification du type de la colonne role si elle existe déjà
DO $$ 
BEGIN
  ALTER TABLE users 
    ALTER COLUMN role TYPE user_role USING role::user_role;
EXCEPTION
  WHEN undefined_column THEN 
    ALTER TABLE users ADD COLUMN role user_role DEFAULT 'user'::user_role;
  WHEN others THEN
    NULL;
END $$;

-- Création de la table companies
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kiota_id text UNIQUE NOT NULL,
  legal_form text,
  industry text,
  rccm text,
  idnat text,
  nif text,
  cnss text,
  addresses jsonb DEFAULT '[]'::jsonb,
  contacts jsonb DEFAULT '{}'::jsonb,
  subscription_plan text DEFAULT 'free',
  subscription_status text DEFAULT 'active',
  subscription_expires_at timestamptz,
  created_by uuid REFERENCES users(id),
  active boolean DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ajout d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status ON companies(subscription_status);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view their own company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Superadmins can manage their own company"
  ON companies
  FOR ALL
  TO authenticated
  USING (
    id = (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'superadmin'::user_role)
  );

CREATE POLICY "Admins can manage all companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'::user_role)
  );

-- Trigger pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();