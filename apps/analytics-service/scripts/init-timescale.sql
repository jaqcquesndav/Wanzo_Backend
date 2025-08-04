-- ===============================================
-- ANALYTICS SERVICE - TimescaleDB Initialization
-- ===============================================

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas for time-series data
CREATE SCHEMA IF NOT EXISTS metrics;
CREATE SCHEMA IF NOT EXISTS events;
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Grant permissions
GRANT USAGE ON SCHEMA metrics TO timeseries_user;
GRANT USAGE ON SCHEMA events TO timeseries_user;
GRANT USAGE ON SCHEMA monitoring TO timeseries_user;

GRANT CREATE ON SCHEMA metrics TO timeseries_user;
GRANT CREATE ON SCHEMA events TO timeseries_user;
GRANT CREATE ON SCHEMA monitoring TO timeseries_user;

-- Create risk metrics table
CREATE TABLE IF NOT EXISTS metrics.risk_metrics (
    time TIMESTAMPTZ NOT NULL,
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    risk_score DECIMAL(5,2),
    risk_category VARCHAR(20),
    confidence_level DECIMAL(4,2),
    calculation_version INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hypertable for risk metrics
SELECT create_hypertable('metrics.risk_metrics', 'time', if_not_exists => TRUE);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_risk_metrics_entity ON metrics.risk_metrics (entity_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_risk_metrics_type ON metrics.risk_metrics (entity_type, time DESC);

-- Log initialization completion
INSERT INTO monitoring.system_metrics (time, service_name, metric_name, metric_value, unit)
VALUES (NOW(), 'timescaledb', 'initialization_completed', 1, 'boolean');
