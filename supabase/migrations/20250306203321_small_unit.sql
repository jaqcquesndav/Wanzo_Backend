```sql
/*
  # Create Graph Database Structure

  1. New Tables
    - `graph_nodes`
      - `id` (uuid, primary key)
      - `kiota_id` (text)
      - `type` (enum)
      - `label` (text)
      - `properties` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `graph_edges`
      - `id` (uuid, primary key)
      - `type` (enum)
      - `source_id` (uuid, references graph_nodes)
      - `target_id` (uuid, references graph_nodes)
      - `properties` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `timeseries_metrics`
      - `id` (uuid, primary key)
      - `entity_id` (text)
      - `entity_type` (text)
      - `type` (enum)
      - `value` (decimal)
      - `metadata` (jsonb)
      - `timestamp` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for data access

  3. Indexes
    - Add indexes for performance optimization
*/

-- Create node type enum
CREATE TYPE node_type AS ENUM (
  'enterprise',
  'institution',
  'portfolio',
  'operation',
  'transaction',
  'workflow',
  'workflow_step',
  'alert_risk',
  'score_aml',
  'market_index',
  'macro_trend'
);

-- Create edge type enum
CREATE TYPE edge_type AS ENUM (
  'belongs_to',
  'owns',
  'invests_in',
  'approves',
  'generates',
  'concerns',
  'signals',
  'impacts',
  'evolves_with',
  'succeeds'
);

-- Create metric type enum
CREATE TYPE metric_type AS ENUM (
  'transaction_volume',
  'credit_score',
  'aml_score',
  'market_index',
  'risk_score',
  'financial_ratio'
);

-- Create graph_nodes table
CREATE TABLE IF NOT EXISTS graph_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiota_id text NOT NULL,
  type node_type NOT NULL,
  label text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create graph_edges table
CREATE TABLE IF NOT EXISTS graph_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type edge_type NOT NULL,
  source_id uuid NOT NULL REFERENCES graph_nodes(id),
  target_id uuid NOT NULL REFERENCES graph_nodes(id),
  properties jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create timeseries_metrics table
CREATE TABLE IF NOT EXISTS timeseries_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id text NOT NULL,
  entity_type text NOT NULL,
  type metric_type NOT NULL,
  value decimal(20,4) NOT NULL,
  metadata jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Create hypertable for timeseries_metrics
SELECT create_hypertable('timeseries_metrics', 'timestamp');

-- Create indexes
CREATE INDEX idx_nodes_type ON graph_nodes(type);
CREATE INDEX idx_nodes_kiota_id ON graph_nodes(kiota_id);
CREATE INDEX idx_edges_type ON graph_edges(type);
CREATE INDEX idx_edges_source ON graph_edges(source_id);
CREATE INDEX idx_edges_target ON graph_edges(target_id);
CREATE INDEX idx_metrics_entity ON timeseries_metrics(entity_id, entity_type);
CREATE INDEX idx_metrics_type ON timeseries_metrics(type);

-- Enable RLS
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeseries_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read access to authenticated users" ON graph_nodes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow read access to authenticated users" ON graph_edges
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow read access to authenticated users" ON timeseries_metrics
  FOR SELECT TO authenticated
  USING (true);

-- Create policies for write operations (restricted to service role)
CREATE POLICY "Allow write access to service role" ON graph_nodes
  FOR ALL TO service_role
  USING (true);

CREATE POLICY "Allow write access to service role" ON graph_edges
  FOR ALL TO service_role
  USING (true);

CREATE POLICY "Allow write access to service role" ON timeseries_metrics
  FOR ALL TO service_role
  USING (true);
```