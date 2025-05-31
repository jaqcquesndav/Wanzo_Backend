/*
  # Workflow Configuration Schema

  1. New Tables
    - `workflow_configs`
      - Stores dynamic workflow configurations per portfolio/product
    - `workflow_step_configs` 
      - Stores step configurations for each workflow
    - `workflow_validation_tokens`
      - Stores validation tokens for workflow steps
    - `workflow_progress`
      - Stores workflow progress tracking data

  2. Security
    - Enable RLS on all tables
    - Add policies for read/write access

  3. Changes
    - Add new columns to existing workflow tables
    - Add foreign key constraints
*/

-- Create workflow_configs table
CREATE TABLE IF NOT EXISTS workflow_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiota_id text NOT NULL,
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

-- Add new columns to workflows table
ALTER TABLE workflows 
ADD COLUMN IF NOT EXISTS config_id uuid REFERENCES workflow_configs(id),
ADD COLUMN IF NOT EXISTS refresh_token text,
ADD COLUMN IF NOT EXISTS last_refresh timestamptz,
ADD COLUMN IF NOT EXISTS next_refresh timestamptz,
ADD COLUMN IF NOT EXISTS refresh_error text;

-- Add new columns to workflow_steps table
ALTER TABLE workflow_steps
ADD COLUMN IF NOT EXISTS validation_token_id uuid REFERENCES workflow_validation_tokens(id),
ADD COLUMN IF NOT EXISTS progress_percentage decimal(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS started_at timestamptz,
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error text;

-- Enable Row Level Security
ALTER TABLE workflow_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_validation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for workflow_configs
CREATE POLICY "Users can view workflow configs for their company"
  ON workflow_configs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = workflow_configs.portfolio_id
      AND p.company_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage workflow configs"
  ON workflow_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'superadmin')
    )
  );

-- Create policies for workflow_step_configs
CREATE POLICY "Users can view workflow step configs"
  ON workflow_step_configs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_configs wc
      JOIN portfolios p ON p.id = wc.portfolio_id
      WHERE wc.id = workflow_step_configs.workflow_config_id
      AND p.company_id = auth.uid()
    )
  );

-- Create policies for workflow_validation_tokens
CREATE POLICY "Users can view their validation tokens"
  ON workflow_validation_tokens
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_steps ws
      JOIN workflows w ON w.id = ws.workflow_id
      JOIN operations o ON o.id = w.operation_id
      WHERE ws.id = workflow_validation_tokens.step_id
      AND o.company_id = auth.uid()
    )
  );

-- Create policies for workflow_progress
CREATE POLICY "Users can view workflow progress"
  ON workflow_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows w
      JOIN operations o ON o.id = w.operation_id
      WHERE w.id = workflow_progress.workflow_id
      AND o.company_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_configs_portfolio_id ON workflow_configs(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_configs_workflow_config_id ON workflow_step_configs(workflow_config_id);
CREATE INDEX IF NOT EXISTS idx_workflow_validation_tokens_workflow_id ON workflow_validation_tokens(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_validation_tokens_step_id ON workflow_validation_tokens(step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_progress_workflow_id ON workflow_progress(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflows_config_id ON workflows(config_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_validation_token_id ON workflow_steps(validation_token_id);