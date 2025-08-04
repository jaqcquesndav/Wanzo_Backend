#!/bin/bash

# ===================================================
# WANZO ANALYTICS SERVICE - PRODUCTION DEPLOYMENT
# ===================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Wanzo Analytics Service - Production Deployment${NC}"
echo "================================================="

# Check if required environment variables are set
echo -e "${YELLOW}📋 Checking environment variables...${NC}"
required_vars=(
    "ANALYTICS_DB_PASSWORD"
    "NEO4J_PASSWORD" 
    "TIMESCALEDB_PASSWORD"
    "KAFKA_PASSWORD"
    "JWT_SECRET"
    "SENTRY_DSN"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: Required environment variable $var is not set${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ All required environment variables are set${NC}"

# Check Docker availability
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is ready${NC}"

# Check Docker Compose availability
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose is ready${NC}"

# Build the application
echo -e "${YELLOW}🔨 Building Analytics Service...${NC}"
docker-compose -f apps/analytics-service/docker-compose.production.yml build analytics-service
echo -e "${GREEN}✅ Build completed${NC}"

# Run security scan on the built image
echo -e "${YELLOW}🔍 Running security scan...${NC}"
if command -v trivy &> /dev/null; then
    trivy image wanzo-analytics-service-prod || echo -e "${YELLOW}⚠️ Security scan completed with warnings${NC}"
else
    echo -e "${YELLOW}⚠️ Trivy not installed, skipping security scan${NC}"
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f apps/analytics-service/docker-compose.production.yml down || true

# Start infrastructure services first
echo -e "${YELLOW}🏗️ Starting infrastructure services...${NC}"
docker-compose -f apps/analytics-service/docker-compose.production.yml up -d zookeeper
sleep 10
docker-compose -f apps/analytics-service/docker-compose.production.yml up -d kafka-1
sleep 20
docker-compose -f apps/analytics-service/docker-compose.production.yml up -d postgres-analytics neo4j timescaledb

# Wait for databases to be ready
echo -e "${YELLOW}⏳ Waiting for databases to be ready...${NC}"
timeout=300
elapsed=0

while [ $elapsed -lt $timeout ]; do
    if docker-compose -f apps/analytics-service/docker-compose.production.yml exec -T postgres-analytics pg_isready -U analytics_user -d wanzo_analytics_prod &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi
    sleep 5
    elapsed=$((elapsed + 5))
    echo "Waiting for PostgreSQL... (${elapsed}s/${timeout}s)"
done

if [ $elapsed -ge $timeout ]; then
    echo -e "${RED}❌ Timeout waiting for PostgreSQL${NC}"
    exit 1
fi

# Start analytics service
echo -e "${YELLOW}🎯 Starting Analytics Service...${NC}"
docker-compose -f apps/analytics-service/docker-compose.production.yml up -d analytics-service

# Wait for service to be healthy
echo -e "${YELLOW}⏳ Waiting for Analytics Service to be healthy...${NC}"
timeout=180
elapsed=0

while [ $elapsed -lt $timeout ]; do
    if curl -f http://localhost:3004/health &> /dev/null; then
        echo -e "${GREEN}✅ Analytics Service is healthy${NC}"
        break
    fi
    sleep 10
    elapsed=$((elapsed + 10))
    echo "Waiting for Analytics Service... (${elapsed}s/${timeout}s)"
done

if [ $elapsed -ge $timeout ]; then
    echo -e "${RED}❌ Timeout waiting for Analytics Service${NC}"
    echo -e "${YELLOW}📋 Checking service logs:${NC}"
    docker-compose -f apps/analytics-service/docker-compose.production.yml logs analytics-service
    exit 1
fi

# Run integration health check
echo -e "${YELLOW}🏥 Running integration health checks...${NC}"
health_response=$(curl -s http://localhost:3004/integration/health)
if echo "$health_response" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✅ All integrations are healthy${NC}"
else
    echo -e "${YELLOW}⚠️ Some integrations may have issues:${NC}"
    echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
fi

# Display service information
echo -e "${BLUE}📊 Deployment Summary${NC}"
echo "====================="
echo -e "Analytics Service: ${GREEN}http://localhost:3004${NC}"
echo -e "Health Check: ${GREEN}http://localhost:3004/health${NC}"
echo -e "Integration Health: ${GREEN}http://localhost:3004/integration/health${NC}"
echo -e "Metrics: ${GREEN}http://localhost:9090${NC}"
echo -e "Neo4j Browser: ${GREEN}http://localhost:7474${NC}"

# Display running containers
echo -e "${BLUE}📦 Running Containers${NC}"
echo "===================="
docker-compose -f apps/analytics-service/docker-compose.production.yml ps

echo -e "${GREEN}🎉 Analytics Service deployed successfully!${NC}"
echo
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Monitor service logs: docker-compose -f apps/analytics-service/docker-compose.production.yml logs -f analytics-service"
echo "2. Check integration health: curl http://localhost:3004/integration/health"
echo "3. Verify Kafka consumers: curl http://localhost:3004/integration/kafka"
echo "4. Monitor metrics at http://localhost:9090"

# Save deployment info
cat > analytics-service-deployment.info << EOF
Deployment Date: $(date)
Analytics Service URL: http://localhost:3004
Health Check URL: http://localhost:3004/health
Integration Health URL: http://localhost:3004/integration/health
Metrics URL: http://localhost:9090
Neo4j Browser URL: http://localhost:7474

Container Status:
$(docker-compose -f apps/analytics-service/docker-compose.production.yml ps)

Integration Health:
$health_response
EOF

echo -e "${BLUE}📄 Deployment info saved to: analytics-service-deployment.info${NC}"
