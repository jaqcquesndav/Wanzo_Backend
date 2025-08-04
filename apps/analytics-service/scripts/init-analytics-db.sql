-- ===============================================
-- ANALYTICS SERVICE - PostgreSQL Initialization
-- ===============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS risk;
CREATE SCHEMA IF NOT EXISTS fraud;
CREATE SCHEMA IF NOT EXISTS geographic;

-- Set default schema permissions
GRANT USAGE ON SCHEMA analytics TO analytics_user;
GRANT USAGE ON SCHEMA risk TO analytics_user;
GRANT USAGE ON SCHEMA fraud TO analytics_user;
GRANT USAGE ON SCHEMA geographic TO analytics_user;

GRANT CREATE ON SCHEMA analytics TO analytics_user;
GRANT CREATE ON SCHEMA risk TO analytics_user;
GRANT CREATE ON SCHEMA fraud TO analytics_user;
GRANT CREATE ON SCHEMA geographic TO analytics_user;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_created_at ON analytics.risk_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_entity_id ON analytics.risk_calculations(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_type ON analytics.risk_calculations(entity_type);

-- Create performance monitoring view
CREATE OR REPLACE VIEW analytics.performance_stats AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname IN ('analytics', 'risk', 'fraud', 'geographic');

-- Create backup user for analytics (read-only)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'analytics_readonly') THEN
        CREATE ROLE analytics_readonly;
    END IF;
END
$$;

GRANT CONNECT ON DATABASE wanzo_analytics_prod TO analytics_readonly;
GRANT USAGE ON SCHEMA analytics, risk, fraud, geographic TO analytics_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics, risk, fraud, geographic TO analytics_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics, risk, fraud, geographic GRANT SELECT ON TABLES TO analytics_readonly;

-- Log initialization completion
INSERT INTO analytics.system_logs (message, level, timestamp) 
VALUES ('Analytics PostgreSQL database initialized successfully', 'INFO', NOW())
ON CONFLICT DO NOTHING;
