/*
  # Accounting Reports Schema

  1. New Tables
    - `reports`: Stores report metadata and configuration
    - `report_templates`: Stores report templates for different frameworks
    - `report_data`: Stores generated report data
    - `report_schedules`: Stores report generation schedules
    - `report_exports`: Stores report export history

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kiota_id text NOT NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('financial', 'risk', 'investment_analysis')),
  framework text NOT NULL CHECK (framework IN ('SYSCOHADA', 'IFRS')),
  fiscal_year text NOT NULL,
  date timestamptz NOT NULL,
  size text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'final', 'archived')),
  currency text NOT NULL DEFAULT 'CDF',
  exchange_rate decimal(20,6) NOT NULL DEFAULT 1,
  metadata jsonb,
  company_id uuid,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create report_templates table
CREATE TABLE IF NOT EXISTS report_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  framework text NOT NULL CHECK (framework IN ('SYSCOHADA', 'IFRS')),
  type text NOT NULL CHECK (type IN ('financial', 'risk', 'investment_analysis')),
  structure jsonb NOT NULL,
  formatting jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create report_data table
CREATE TABLE IF NOT EXISTS report_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES reports(id),
  section text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create report_schedules table
CREATE TABLE IF NOT EXISTS report_schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('financial', 'risk', 'investment_analysis')),
  framework text NOT NULL CHECK (framework IN ('SYSCOHADA', 'IFRS')),
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  next_run timestamptz NOT NULL,
  last_run timestamptz,
  recipients jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create report_exports table
CREATE TABLE IF NOT EXISTS report_exports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES reports(id),
  format text NOT NULL CHECK (format IN ('pdf', 'xlsx', 'csv')),
  url text NOT NULL,
  size text,
  downloaded_at timestamptz,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company's reports"
  ON reports FOR SELECT
  TO authenticated
  USING (company_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can view report templates"
  ON report_templates FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Users can view their company's report data"
  ON report_data FOR SELECT
  TO authenticated
  USING (report_id IN (SELECT id FROM reports WHERE company_id = auth.uid()));

CREATE POLICY "Users can view their company's report schedules"
  ON report_schedules FOR SELECT
  TO authenticated
  USING (company_id = auth.uid());

CREATE POLICY "Users can view their company's report exports"
  ON report_exports FOR SELECT
  TO authenticated
  USING (report_id IN (SELECT id FROM reports WHERE company_id = auth.uid()));

-- Create indexes
CREATE INDEX idx_reports_company_id ON reports(company_id);
CREATE INDEX idx_reports_fiscal_year ON reports(fiscal_year);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_framework ON reports(framework);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_report_data_report_id ON report_data(report_id);
CREATE INDEX idx_report_schedules_company_id ON report_schedules(company_id);
CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run);
CREATE INDEX idx_report_exports_report_id ON report_exports(report_id);

-- Add triggers for updated_at
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at
    BEFORE UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at
    BEFORE UPDATE ON report_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default report templates
INSERT INTO report_templates (name, framework, type, structure, formatting) VALUES
('Balance Sheet - SYSCOHADA', 'SYSCOHADA', 'financial', '{
  "sections": {
    "actif": {
      "immobilisations": {
        "incorporelles": ["20"],
        "corporelles": ["21", "22", "23", "24"],
        "financieres": ["26"]
      },
      "actifCirculant": {
        "stocks": ["3"],
        "creances": ["41"],
        "tresorerie": ["52"]
      }
    },
    "passif": {
      "capitauxPropres": {
        "capital": ["10"],
        "reserves": ["11"],
        "resultat": ["12"]
      },
      "dettes": {
        "financieres": ["16"],
        "fournisseurs": ["40"],
        "fiscales": ["44"]
      }
    }
  }
}', '{
  "orientation": "portrait",
  "pageSize": "A4",
  "fonts": {
    "title": "Arial",
    "body": "Times New Roman"
  },
  "colors": {
    "header": "#2C3E50",
    "total": "#34495E"
  }
}'),
('Income Statement - IFRS', 'IFRS', 'financial', '{
  "sections": {
    "revenue": {
      "sales": ["70"],
      "otherIncome": ["74"]
    },
    "expenses": {
      "costOfSales": ["60"],
      "distributionCosts": ["61"],
      "administrativeExpenses": ["62"],
      "employeeBenefits": ["66"],
      "financeExpenses": ["67"]
    }
  }
}', '{
  "orientation": "portrait",
  "pageSize": "A4",
  "fonts": {
    "title": "Arial",
    "body": "Times New Roman"
  },
  "colors": {
    "header": "#2C3E50",
    "total": "#34495E"
  }
}');