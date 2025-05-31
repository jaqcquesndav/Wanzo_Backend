/*
  # Portfolio SME Service Schema

  1. New Tables
    - `portfolios`: Stores portfolio information
    - `financial_products`: Stores financial products
    - `equipment_catalog`: Stores equipment catalog
    - `operations`: Stores operations (credit, leasing, etc.)
    - `workflows`: Stores workflow information
    - `workflow_steps`: Stores workflow steps
    - `assets`: Stores asset information
    - `asset_valuations`: Stores asset valuations

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kiota_id text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('traditional_finance', 'leasing', 'investment')),
  active boolean DEFAULT true,
  target_amount decimal(15,2) NOT NULL,
  target_return decimal(5,2) NOT NULL,
  target_sectors text[] NOT NULL,
  risk_profile text NOT NULL CHECK (risk_profile IN ('low', 'moderate', 'aggressive')),
  metrics jsonb NOT NULL DEFAULT '{
    "netValue": 0,
    "averageReturn": 0,
    "riskPortfolio": 0,
    "sharpeRatio": 0,
    "volatility": 0,
    "alpha": 0,
    "beta": 0
  }',
  company_id uuid,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create financial_products table
CREATE TABLE IF NOT EXISTS financial_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kiota_id text NOT NULL,
  portfolio_id uuid NOT NULL REFERENCES portfolios(id),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'bond', 'equity')),
  characteristics jsonb NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create equipment_catalog table
CREATE TABLE IF NOT EXISTS equipment_catalog (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kiota_id text NOT NULL,
  portfolio_id uuid NOT NULL REFERENCES portfolios(id),
  name text NOT NULL,
  category text NOT NULL,
  price decimal(15,2) NOT NULL,
  specifications jsonb NOT NULL,
  condition text NOT NULL,
  maintenance_included boolean DEFAULT false,
  insurance_required boolean DEFAULT false,
  image_url text NOT NULL,
  availability boolean DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create operations table
CREATE TABLE IF NOT EXISTS operations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kiota_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'leasing', 'emission', 'subscription')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'rejected', 'cancelled')),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id),
  product_id uuid REFERENCES financial_products(id),
  equipment_id uuid REFERENCES equipment_catalog(id),
  date_emission timestamptz NOT NULL,
  rate_or_yield decimal(10,2) NOT NULL,
  quantity integer NOT NULL,
  duration integer NOT NULL,
  description text NOT NULL,
  requested_amount decimal(15,2),
  initial_payment decimal(15,2),
  attachments jsonb,
  metadata jsonb,
  company_id uuid,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('validation', 'approval', 'review')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'cancelled')),
  current_step_id uuid,
  operation_id uuid NOT NULL REFERENCES operations(id),
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workflow_steps table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id uuid NOT NULL REFERENCES workflows(id),
  step_type text NOT NULL CHECK (step_type IN ('approval', 'external_validation', 'system_check', 'document_upload', 'manager_validation')),
  label text NOT NULL,
  description text,
  assigned_to text NOT NULL,
  external_app text NOT NULL,
  requires_validation_token boolean DEFAULT false,
  files jsonb,
  evaluation_criteria jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'skipped')),
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kiota_id text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('real_estate', 'vehicle', 'equipment', 'intellectual_property', 'other')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_maintenance', 'inactive', 'sold')),
  acquisition_value decimal(15,2) NOT NULL,
  current_value decimal(15,2) NOT NULL,
  acquisition_date timestamptz NOT NULL,
  specifications jsonb NOT NULL,
  maintenance_history jsonb NOT NULL,
  insurance_info jsonb NOT NULL,
  company_id uuid,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create asset_valuations table
CREATE TABLE IF NOT EXISTS asset_valuations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id uuid NOT NULL REFERENCES assets(id),
  type text NOT NULL CHECK (type IN ('market', 'book', 'appraisal')),
  value decimal(15,2) NOT NULL,
  valuation_date timestamptz NOT NULL,
  appraiser text,
  methodology jsonb,
  notes text,
  valid_until timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_valuations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company's portfolios"
  ON portfolios FOR SELECT
  TO authenticated
  USING (company_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can view their company's financial products"
  ON financial_products FOR SELECT
  TO authenticated
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE company_id = auth.uid()));

CREATE POLICY "Users can view their company's equipment"
  ON equipment_catalog FOR SELECT
  TO authenticated
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE company_id = auth.uid()));

CREATE POLICY "Users can view their company's operations"
  ON operations FOR SELECT
  TO authenticated
  USING (company_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can view their company's workflows"
  ON workflows FOR SELECT
  TO authenticated
  USING (operation_id IN (SELECT id FROM operations WHERE company_id = auth.uid()));

CREATE POLICY "Users can view their company's workflow steps"
  ON workflow_steps FOR SELECT
  TO authenticated
  USING (workflow_id IN (SELECT id FROM workflows WHERE operation_id IN (SELECT id FROM operations WHERE company_id = auth.uid())));

CREATE POLICY "Users can view their company's assets"
  ON assets FOR SELECT
  TO authenticated
  USING (company_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can view their company's asset valuations"
  ON asset_valuations FOR SELECT
  TO authenticated
  USING (asset_id IN (SELECT id FROM assets WHERE company_id = auth.uid()));

-- Create indexes
CREATE INDEX idx_portfolios_company_id ON portfolios(company_id);
CREATE INDEX idx_portfolios_type ON portfolios(type);
CREATE INDEX idx_financial_products_portfolio_id ON financial_products(portfolio_id);
CREATE INDEX idx_equipment_portfolio_id ON equipment_catalog(portfolio_id);
CREATE INDEX idx_operations_portfolio_id ON operations(portfolio_id);
CREATE INDEX idx_operations_company_id ON operations(company_id);
CREATE INDEX idx_operations_status ON operations(status);
CREATE INDEX idx_workflows_operation_id ON workflows(operation_id);
CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_assets_company_id ON assets(company_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_asset_valuations_asset_id ON asset_valuations(asset_id);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portfolios_updated_at
    BEFORE UPDATE ON portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_products_updated_at
    BEFORE UPDATE ON financial_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
    BEFORE UPDATE ON equipment_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operations_updated_at
    BEFORE UPDATE ON operations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_steps_updated_at
    BEFORE UPDATE ON workflow_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();