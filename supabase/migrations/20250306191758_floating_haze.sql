/*
  # Portfolio SME Service Schema

  1. New Tables
    - `portfolios`
      - Stores portfolio information
    - `financial_products`
      - Stores financial products catalog
    - `equipment_catalog`
      - Stores equipment catalog
    - `operations`
      - Stores operations (credit, leasing, etc.)
    - `workflows`
      - Stores workflow configurations and instances
    - `workflow_steps`
      - Stores workflow step details
    - `workflow_configs`
      - Stores workflow configurations
    - `workflow_step_configs`
      - Stores step configurations
    - `workflow_validation_tokens`
      - Stores validation tokens for workflow steps
    - `workflow_progress`
      - Stores workflow progress tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for read/write access

  3. Changes
    - Initial schema creation
*/

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiota_id text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('traditional_finance', 'leasing', 'investment')),
  active boolean NOT NULL DEFAULT true,
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
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create financial_products table
CREATE TABLE IF NOT EXISTS financial_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiota_id text NOT NULL,
  portfolio_id uuid NOT NULL REFERENCES portfolios(id),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'bond', 'equity')),
  characteristics jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create equipment_catalog table
CREATE TABLE IF NOT EXISTS equipment_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiota_id text NOT NULL,
  portfolio_id uuid NOT NULL REFERENCES portfolios(id),
  name text NOT NULL,
  category text NOT NULL,
  price decimal(15,2) NOT NULL,
  specifications jsonb NOT NULL,
  condition text NOT NULL,
  maintenance_included boolean NOT NULL DEFAULT false,
  insurance_required boolean NOT NULL DEFAULT false,
  image_url text NOT NULL,
  availability boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create operations table
CREATE TABLE IF NOT EXISTS operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('validation', 'approval', 'review')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'cancelled')),
  current_step_id uuid,
  operation_id uuid NOT NULL REFERENCES operations(id),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create workflow_steps table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_type text NOT NULL CHECK (type IN ('approval', 'external_validation', 'system_check', 'document_upload', 'manager_validation')),
  label text NOT NULL,
  description text,
  assigned_to text NOT NULL,
  external_app text NOT NULL,
  requires_validation_token boolean NOT NULL DEFAULT false,
  files jsonb,
  evaluation_criteria jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'skipped')),
  workflow_id uuid NOT NULL REFERENCES workflows(id),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create workflow_configs table
CREATE TABLE IF NOT EXISTS workflow_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id),
  product_id uuid REFERENCES financial_products(id),
  equipment_id uuid REFERENCES equipment_catalog(id),
  name text NOT NULL,
  description text,
  steps jsonb NOT NULL,
  validation_rules jsonb NOT NULL,
  refresh_interval interval NOT NULL DEFAULT '5 minutes',
  auto_progress boolean NOT NULL DEFAULT false,
  metadata jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create workflow_step_configs table
CREATE TABLE IF NOT EXISTS workflow_step_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_config_id uuid NOT NULL REFERENCES workflow_configs(id),
  step_type text NOT NULL,
  label text NOT NULL,
  description text,
  assigned_to text NOT NULL,
  external_app text NOT NULL,
  requires_validation_token boolean NOT NULL DEFAULT false,
  validation_rules jsonb,
  required_files jsonb,
  evaluation_criteria jsonb,
  timeout interval,
  retry_count integer DEFAULT 0,
  retry_delay interval DEFAULT '5 minutes',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create workflow_validation_tokens table
CREATE TABLE IF NOT EXISTS workflow_validation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id),
  step_id uuid NOT NULL REFERENCES workflow_steps(id),
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  used_by uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create workflow_progress table
CREATE TABLE IF NOT EXISTS workflow_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id),
  total_steps integer NOT NULL,
  completed_steps integer NOT NULL DEFAULT 0,
  current_step_index integer NOT NULL DEFAULT 0,
  percentage_complete decimal(5,2) NOT NULL DEFAULT 0,
  estimated_completion timestamptz,
  last_update timestamptz NOT NULL DEFAULT now(),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_validation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for portfolios
CREATE POLICY "Users can view portfolios for their company"
  ON portfolios
  FOR SELECT
  TO authenticated
  USING (company_id = auth.uid());

CREATE POLICY "Admins can manage portfolios"
  ON portfolios
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'superadmin')
    )
  );

-- Create policies for financial_products
CREATE POLICY "Users can view financial products"
  ON financial_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = financial_products.portfolio_id
      AND p.company_id = auth.uid()
    )
  );

-- Create policies for equipment_catalog
CREATE POLICY "Users can view equipment"
  ON equipment_catalog
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = equipment_catalog.portfolio_id
      AND p.company_id = auth.uid()
    )
  );

-- Create policies for operations
CREATE POLICY "Users can view operations for their company"
  ON operations
  FOR SELECT
  TO authenticated
  USING (company_id = auth.uid());

-- Create policies for workflows
CREATE POLICY "Users can view workflows"
  ON workflows
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operations o
      WHERE o.id = workflows.operation_id
      AND o.company_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_company_id ON portfolios(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_products_portfolio_id ON financial_products(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_equipment_catalog_portfolio_id ON equipment_catalog(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_operations_portfolio_id ON operations(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_operations_company_id ON operations(company_id);
CREATE INDEX IF NOT EXISTS idx_workflows_operation_id ON workflows(operation_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_configs_portfolio_id ON workflow_configs(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_configs_workflow_config_id ON workflow_step_configs(workflow_config_id);
CREATE INDEX IF NOT EXISTS idx_workflow_validation_tokens_workflow_id ON workflow_validation_tokens(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_validation_tokens_step_id ON workflow_validation_tokens(step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_progress_workflow_id ON workflow_progress(workflow_id);