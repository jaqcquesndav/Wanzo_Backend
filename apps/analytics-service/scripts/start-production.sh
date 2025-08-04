#!/bin/bash

# ===============================================
# ANALYTICS SERVICE - PRODUCTION STARTUP SCRIPT
# ===============================================

set -e

echo "🚀 Starting Analytics Service in Production Mode..."

# Check if required environment variables are set
required_vars=(
    "ANALYTICS_DB_PASSWORD"
    "NEO4J_PASSWORD" 
    "TIMESCALEDB_PASSWORD"
    "KAFKA_PASSWORD"
    "JWT_SECRET"
)

echo "🔍 Checking required environment variables..."
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
done
echo "✅ All required environment variables are set"

# Wait for dependencies
echo "⏳ Waiting for dependencies to be ready..."

# Wait for PostgreSQL
echo "  - Waiting for PostgreSQL..."
until PGPASSWORD=$ANALYTICS_DB_PASSWORD psql -h "$DATABASE_HOST" -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -c '\q' 2>/dev/null; do
    echo "    PostgreSQL is unavailable - sleeping..."
    sleep 2
done
echo "  ✅ PostgreSQL is ready"

# Wait for Neo4j
echo "  - Waiting for Neo4j..."
until nc -z "$NEO4J_URI" 7687 2>/dev/null; do
    echo "    Neo4j is unavailable - sleeping..."
    sleep 2
done
echo "  ✅ Neo4j is ready"

# Wait for TimescaleDB
echo "  - Waiting for TimescaleDB..."
until PGPASSWORD=$TIMESCALEDB_PASSWORD psql -h "$TIMESCALEDB_HOST" -U "$TIMESCALEDB_USERNAME" -d "$TIMESCALEDB_NAME" -c '\q' 2>/dev/null; do
    echo "    TimescaleDB is unavailable - sleeping..."
    sleep 2
done
echo "  ✅ TimescaleDB is ready"

# Wait for Kafka
echo "  - Waiting for Kafka..."
IFS=',' read -ra KAFKA_BROKERS_ARRAY <<< "$KAFKA_BROKERS"
for broker in "${KAFKA_BROKERS_ARRAY[@]}"; do
    host=$(echo $broker | cut -d':' -f1)
    port=$(echo $broker | cut -d':' -f2)
    until nc -z "$host" "$port" 2>/dev/null; do
        echo "    Kafka broker $broker is unavailable - sleeping..."
        sleep 2
    done
done
echo "  ✅ Kafka is ready"

# Run database migrations
echo "🔄 Running database migrations..."
npm run migration:run || {
    echo "❌ Database migration failed"
    exit 1
}
echo "✅ Database migrations completed"

# Start the application
echo "🎯 Starting Analytics Service..."
exec npm run start:prod
