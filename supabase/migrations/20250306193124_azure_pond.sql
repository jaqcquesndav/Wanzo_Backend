/*
  # Portfolio-Accounting Integration Schema

  1. New Tables
    - `portfolio_accounting_links`: Links portfolios to accounting companies
    - `portfolio_report_mappings`: Maps portfolio reports to accounting reports
    - `portfolio_operation_mappings`: Maps portfolio operations to accounting entries
    - `portfolio_sync_logs`: Tracks synchronization between services

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create portfolio_accounting_links table
CREATE TABLE IF NOT EXISTS portfolio_accounting_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id uuid NOT NULL,
  accounting_company_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'pending')),
  sync_enabled boolean DEFAULT true,
  sync_frequency text NOT NULL CHECK (sync_frequency IN ('realtime', 'daily', 'weekly')),
  last_sync_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(portfolio_id, accounting_company_id)
);

-- Create portfolio_report_mappings table
CREATE TABLE IF NOT EXISTS portfolio_report_mappings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_report_id uuid NOT NULL,
  accounting_report_id uuid NOT NULL,
  mapping_type text NOT NULL CHECK (mapping_type IN ('balance_sheet', 'income_statement', 'cash_flow', 'trial_balance')),
  mapping_rules jsonb NOT NULL,
  framework text NOT NULL CHECK (framework IN ('SYSCOHADA', 'IFRS')),
  currency text NOT NULL DEFAULT 'CDF',
  exchange_rate decimal(20,6) NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(portfolio_report_id, accounting_report_id, mapping_type)
);

-- Create portfolio_operation_mappings table
CREATE TABLE IF NOT EXISTS portfolio_operation_mappings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_operation_id uuid NOT NULL,
  accounting_journal_id uuid NOT NULL,
  operation_type text NOT NULL CHECK (operation_type IN ('credit', 'leasing', 'emission', 'subscription')),
  mapping_rules jsonb NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(portfolio_operation_id, accounting_journal_id)
);

-- Create portfolio_sync_logs table
CREATE TABLE IF NOT EXISTS portfolio_sync_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id uuid NOT NULL REFERENCES portfolio_accounting_links(id),
  sync_type text NOT NULL CHECK (sync_type IN ('reports', 'operations', 'full')),
  status text NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  items_processed integer DEFAULT 0,
  items_failed integer DEFAULT 0,
  error_details jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE portfolio_accounting_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_report_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_operation_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company's links"
  ON portfolio_accounting_links FOR SELECT
  TO authenticated
  USING (accounting_company_id = auth.uid());

CREATE POLICY "Users can view their company's report mappings"
  ON portfolio_report_mappings FOR SELECT
  TO authenticated
  USING (
    portfolio_report_id IN (
      SELECT portfolio_report_id 
      FROM portfolio_accounting_links 
      WHERE accounting_company_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their company's operation mappings"
  ON portfolio_operation_mappings FOR SELECT
  TO authenticated
  USING (
    portfolio_operation_id IN (
      SELECT portfolio_operation_id 
      FROM portfolio_accounting_links 
      WHERE accounting_company_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their company's sync logs"
  ON portfolio_sync_logs FOR SELECT
  TO authenticated
  USING (
    link_id IN (
      SELECT id 
      FROM portfolio_accounting_links 
      WHERE accounting_company_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_portfolio_accounting_links_portfolio_id ON portfolio_accounting_links(portfolio_id);
CREATE INDEX idx_portfolio_accounting_links_company_id ON portfolio_accounting_links(accounting_company_id);
CREATE INDEX idx_portfolio_report_mappings_portfolio_id ON portfolio_report_mappings(portfolio_report_id);
CREATE INDEX idx_portfolio_report_mappings_accounting_id ON portfolio_report_mappings(accounting_report_id);
CREATE INDEX idx_portfolio_operation_mappings_portfolio_id ON portfolio_operation_mappings(portfolio_operation_id);
CREATE INDEX idx_portfolio_operation_mappings_accounting_id ON portfolio_operation_mappings(accounting_journal_id);
CREATE INDEX idx_portfolio_sync_logs_link_id ON portfolio_sync_logs(link_id);
CREATE INDEX idx_portfolio_sync_logs_status ON portfolio_sync_logs(status);

-- Add triggers for updated_at
CREATE TRIGGER update_portfolio_accounting_links_updated_at
    BEFORE UPDATE ON portfolio_accounting_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_report_mappings_updated_at
    BEFORE UPDATE ON portfolio_report_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_operation_mappings_updated_at
    BEFORE UPDATE ON portfolio_operation_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default mapping rules for SYSCOHADA
INSERT INTO portfolio_report_mappings (
  portfolio_report_id,
  accounting_report_id,
  mapping_type,
  mapping_rules,
  framework
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'balance_sheet',
  '{
    "assets": {
      "fixed_assets": {
        "accounts": ["20", "21", "22", "23", "24", "25", "26", "27", "28", "29"],
        "mapping": {
          "intangible": ["20"],
          "tangible": ["21", "22", "23", "24"],
          "financial": ["26"]
        }
      },
      "current_assets": {
        "accounts": ["3", "4"],
        "mapping": {
          "inventory": ["3"],
          "receivables": ["41"]
        }
      }
    },
    "liabilities": {
      "equity": {
        "accounts": ["10", "11", "12"],
        "mapping": {
          "capital": ["10"],
          "reserves": ["11"],
          "result": ["12"]
        }
      },
      "debt": {
        "accounts": ["16", "40", "44"],
        "mapping": {
          "financial": ["16"],
          "suppliers": ["40"],
          "tax": ["44"]
        }
      }
    }
  }',
  'SYSCOHADA'
);