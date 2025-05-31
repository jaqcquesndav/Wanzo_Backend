/*
  # Data Sharing Configuration Schema

  1. New Tables
    - `data_sharing_configs`
      - Stores data sharing preferences and consent
      - Tracks which institutions can access data
      - Manages consent expiration
      - Logs consent history

  2. Security
    - Enable RLS
    - Add policies for data access control
*/

-- Create data_sharing_configs table
CREATE TABLE IF NOT EXISTS data_sharing_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  sharing_enabled boolean NOT NULL DEFAULT false,
  allowed_data_types text[] DEFAULT '{}',
  institution_id uuid REFERENCES companies(id),
  consent_granted_at timestamptz,
  consent_expires_at timestamptz,
  granted_by uuid REFERENCES users(id),
  sharing_preferences jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create data_sharing_history table for audit
CREATE TABLE IF NOT EXISTS data_sharing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES data_sharing_configs(id),
  action text NOT NULL,
  previous_state jsonb,
  new_state jsonb,
  performed_by uuid REFERENCES users(id),
  performed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE data_sharing_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sharing_history ENABLE ROW LEVEL SECURITY;

-- Create policies for data_sharing_configs
CREATE POLICY "Users can view their company's data sharing config"
  ON data_sharing_configs
  FOR SELECT
  TO authenticated
  USING (company_id = auth.uid());

CREATE POLICY "Admins and managers can update data sharing config"
  ON data_sharing_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.company_id = data_sharing_configs.company_id
      AND u.role IN ('admin', 'manager')
    )
  );

-- Create policies for data_sharing_history
CREATE POLICY "Users can view their company's data sharing history"
  ON data_sharing_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM data_sharing_configs c
      WHERE c.id = data_sharing_history.config_id
      AND c.company_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_data_sharing_configs_company ON data_sharing_configs(company_id);
CREATE INDEX idx_data_sharing_configs_institution ON data_sharing_configs(institution_id);
CREATE INDEX idx_data_sharing_history_config ON data_sharing_history(config_id);
CREATE INDEX idx_data_sharing_history_action ON data_sharing_history(action);

-- Create trigger for updated_at
CREATE TRIGGER update_data_sharing_configs_updated_at
  BEFORE UPDATE ON data_sharing_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to log changes
CREATE OR REPLACE FUNCTION log_data_sharing_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO data_sharing_history (
    config_id,
    action,
    previous_state,
    new_state,
    performed_by
  ) VALUES (
    NEW.id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
    auth.uid()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_data_sharing_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON data_sharing_configs
  FOR EACH ROW
  EXECUTE FUNCTION log_data_sharing_changes();