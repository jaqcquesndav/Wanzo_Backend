-- ===============================================
-- ANALYTICS SERVICE - TimescaleDB Initialization
-- ===============================================

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create schemas for time-series data
CREATE SCHEMA IF NOT EXISTS metrics;
CREATE SCHEMA IF NOT EXISTS events;
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Set permissions
GRANT USAGE ON SCHEMA metrics TO timeseries_user;
GRANT USAGE ON SCHEMA events TO timeseries_user;
GRANT USAGE ON SCHEMA monitoring TO timeseries_user;

GRANT CREATE ON SCHEMA metrics TO timeseries_user;
GRANT CREATE ON SCHEMA events TO timeseries_user;
GRANT CREATE ON SCHEMA monitoring TO timeseries_user;

-- Create time-series tables

-- Risk metrics over time
CREATE TABLE IF NOT EXISTS metrics.risk_metrics (
    timestamp TIMESTAMPTZ NOT NULL,
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    risk_score DECIMAL(5,2),
    liquidity_ratio DECIMAL(10,4),
    debt_ratio DECIMAL(10,4),
    profitability_score DECIMAL(5,2),
    geographic_risk DECIMAL(5,2),
    sector_risk DECIMAL(5,2),
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('metrics.risk_metrics', 'timestamp', if_not_exists => TRUE);

-- Transaction metrics
CREATE TABLE IF NOT EXISTS metrics.transaction_metrics (
    timestamp TIMESTAMPTZ NOT NULL,
    entity_id UUID NOT NULL,
    transaction_count INTEGER,
    total_amount DECIMAL(15,2),
    average_amount DECIMAL(15,2),
    currency VARCHAR(3),
    payment_method VARCHAR(50),
    location_province VARCHAR(100),
    fraud_alerts INTEGER DEFAULT 0
);

SELECT create_hypertable('metrics.transaction_metrics', 'timestamp', if_not_exists => TRUE);

-- System performance metrics
CREATE TABLE IF NOT EXISTS monitoring.system_metrics (
    timestamp TIMESTAMPTZ NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    active_connections INTEGER,
    response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0
);

SELECT create_hypertable('monitoring.system_metrics', 'timestamp', if_not_exists => TRUE);

-- Kafka event tracking
CREATE TABLE IF NOT EXISTS events.kafka_events (
    timestamp TIMESTAMPTZ NOT NULL,
    topic VARCHAR(255) NOT NULL,
    partition INTEGER,
    offset BIGINT,
    event_type VARCHAR(100),
    entity_id UUID,
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT
);

SELECT create_hypertable('events.kafka_events', 'timestamp', if_not_exists => TRUE);

-- Create retention policies (keep data for 1 year)
SELECT add_retention_policy('metrics.risk_metrics', INTERVAL '1 year', if_not_exists => TRUE);
SELECT add_retention_policy('metrics.transaction_metrics', INTERVAL '1 year', if_not_exists => TRUE);
SELECT add_retention_policy('monitoring.system_metrics', INTERVAL '3 months', if_not_exists => TRUE);
SELECT add_retention_policy('events.kafka_events', INTERVAL '6 months', if_not_exists => TRUE);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_risk_metrics_entity_id ON metrics.risk_metrics (entity_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_risk_metrics_entity_type ON metrics.risk_metrics (entity_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_transaction_metrics_entity_id ON metrics.transaction_metrics (entity_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_metrics_location ON metrics.transaction_metrics (location_province, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_system_metrics_service ON monitoring.system_metrics (service_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_kafka_events_topic ON events.kafka_events (topic, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_kafka_events_entity ON events.kafka_events (entity_id, timestamp DESC);

-- Create continuous aggregates for real-time analytics

-- Daily risk metrics summary
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.daily_risk_summary
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', timestamp) AS day,
    entity_type,
    COUNT(*) as calculation_count,
    AVG(risk_score) as avg_risk_score,
    MAX(risk_score) as max_risk_score,
    MIN(risk_score) as min_risk_score,
    AVG(liquidity_ratio) as avg_liquidity_ratio,
    AVG(debt_ratio) as avg_debt_ratio
FROM metrics.risk_metrics
GROUP BY day, entity_type;

-- Hourly transaction summary
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics.hourly_transaction_summary
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', timestamp) AS hour,
    location_province,
    currency,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_volume,
    AVG(average_amount) as avg_transaction_size,
    SUM(fraud_alerts) as total_fraud_alerts
FROM metrics.transaction_metrics
GROUP BY hour, location_province, currency;

-- Add refresh policies for continuous aggregates
SELECT add_continuous_aggregate_policy('metrics.daily_risk_summary',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);

SELECT add_continuous_aggregate_policy('metrics.hourly_transaction_summary',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '10 minutes',
    schedule_interval => INTERVAL '10 minutes',
    if_not_exists => TRUE);

-- Create compression policy to save storage
SELECT add_compression_policy('metrics.risk_metrics', INTERVAL '7 days', if_not_exists => TRUE);
SELECT add_compression_policy('metrics.transaction_metrics', INTERVAL '7 days', if_not_exists => TRUE);
SELECT add_compression_policy('monitoring.system_metrics', INTERVAL '1 day', if_not_exists => TRUE);
SELECT add_compression_policy('events.kafka_events', INTERVAL '3 days', if_not_exists => TRUE);

-- Create readonly user for reporting
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'timeseries_readonly') THEN
        CREATE ROLE timeseries_readonly;
    END IF;
END
$$;

GRANT CONNECT ON DATABASE wanzo_timeseries_prod TO timeseries_readonly;
GRANT USAGE ON SCHEMA metrics, events, monitoring TO timeseries_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA metrics, events, monitoring TO timeseries_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA timescaledb_information TO timeseries_readonly;

-- Log initialization
INSERT INTO events.kafka_events (timestamp, topic, event_type, success) 
VALUES (NOW(), 'system.initialization', 'TIMESCALEDB_INIT', TRUE);
