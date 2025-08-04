#!/bin/bash

# ===================================================
# ANALYTICS SERVICE - PRODUCTION MONITORING SCRIPT
# ===================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
    echo -e "${BLUE}Analytics Service Production Monitoring${NC}"
    echo "========================================="
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  status      - Show service status and health"
    echo "  logs        - Show real-time logs"
    echo "  health      - Detailed health check"
    echo "  metrics     - Show performance metrics"
    echo "  kafka       - Check Kafka integration"
    echo "  backup      - Backup databases"
    echo "  restart     - Restart analytics service"
    echo "  cleanup     - Clean old logs and data"
    echo "  help        - Show this help"
}

check_service_status() {
    echo -e "${BLUE}📊 Analytics Service Status${NC}"
    echo "==========================="
    
    # Check container status
    echo -e "${YELLOW}Container Status:${NC}"
    docker-compose -f apps/analytics-service/docker-compose.production.yml ps
    echo
    
    # Check service health
    echo -e "${YELLOW}Service Health:${NC}"
    if curl -f http://localhost:3004/health &> /dev/null; then
        echo -e "${GREEN}✅ Analytics Service: HEALTHY${NC}"
    else
        echo -e "${RED}❌ Analytics Service: UNHEALTHY${NC}"
    fi
    
    # Check database connections
    echo -e "${YELLOW}Database Connections:${NC}"
    if docker-compose -f apps/analytics-service/docker-compose.production.yml exec -T postgres-analytics pg_isready -U analytics_user -d wanzo_analytics_prod &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL: CONNECTED${NC}"
    else
        echo -e "${RED}❌ PostgreSQL: DISCONNECTED${NC}"
    fi
    
    # Check Kafka
    echo -e "${YELLOW}Kafka Status:${NC}"
    if docker-compose -f apps/analytics-service/docker-compose.production.yml exec -T kafka-1 kafka-broker-api-versions --bootstrap-server=localhost:9092 &> /dev/null; then
        echo -e "${GREEN}✅ Kafka: READY${NC}"
    else
        echo -e "${RED}❌ Kafka: NOT READY${NC}"
    fi
}

show_logs() {
    echo -e "${BLUE}📋 Analytics Service Logs${NC}"
    echo "========================="
    docker-compose -f apps/analytics-service/docker-compose.production.yml logs -f analytics-service
}

detailed_health_check() {
    echo -e "${BLUE}🏥 Detailed Health Check${NC}"
    echo "========================"
    
    # Integration health
    echo -e "${YELLOW}Integration Health:${NC}"
    health_response=$(curl -s http://localhost:3004/integration/health)
    echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
    echo
    
    # Kafka consumers
    echo -e "${YELLOW}Kafka Consumers:${NC}"
    kafka_response=$(curl -s http://localhost:3004/integration/kafka)
    echo "$kafka_response" | jq '.' 2>/dev/null || echo "$kafka_response"
    echo
    
    # Services health
    echo -e "${YELLOW}Microservices Health:${NC}"
    services_response=$(curl -s http://localhost:3004/integration/services)
    echo "$services_response" | jq '.' 2>/dev/null || echo "$services_response"
}

show_metrics() {
    echo -e "${BLUE}📈 Performance Metrics${NC}"
    echo "====================="
    
    # Container resource usage
    echo -e "${YELLOW}Container Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" | grep wanzo
    echo
    
    # Database sizes
    echo -e "${YELLOW}Database Sizes:${NC}"
    docker-compose -f apps/analytics-service/docker-compose.production.yml exec -T postgres-analytics psql -U analytics_user -d wanzo_analytics_prod -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
        FROM pg_tables 
        WHERE schemaname IN ('analytics', 'risk', 'fraud', 'geographic')
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10;
    " 2>/dev/null || echo "Could not connect to database"
}

check_kafka() {
    echo -e "${BLUE}📡 Kafka Integration Check${NC}"
    echo "=========================="
    
    # List topics
    echo -e "${YELLOW}Kafka Topics:${NC}"
    docker-compose -f apps/analytics-service/docker-compose.production.yml exec -T kafka-1 kafka-topics --bootstrap-server=localhost:9092 --list 2>/dev/null || echo "Could not list topics"
    echo
    
    # Consumer groups
    echo -e "${YELLOW}Consumer Groups:${NC}"
    docker-compose -f apps/analytics-service/docker-compose.production.yml exec -T kafka-1 kafka-consumer-groups --bootstrap-server=localhost:9092 --list 2>/dev/null || echo "Could not list consumer groups"
}

backup_databases() {
    echo -e "${BLUE}💾 Database Backup${NC}"
    echo "=================="
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_dir="backups/${timestamp}"
    mkdir -p "$backup_dir"
    
    # Backup PostgreSQL
    echo -e "${YELLOW}Backing up PostgreSQL...${NC}"
    docker-compose -f apps/analytics-service/docker-compose.production.yml exec -T postgres-analytics pg_dump -U analytics_user wanzo_analytics_prod > "${backup_dir}/analytics_postgres_${timestamp}.sql"
    
    # Backup Neo4j
    echo -e "${YELLOW}Backing up Neo4j...${NC}"
    docker-compose -f apps/analytics-service/docker-compose.production.yml exec -T neo4j neo4j-admin database dump --to-path=/tmp neo4j || echo "Neo4j backup requires manual intervention"
    
    # Backup TimescaleDB
    echo -e "${YELLOW}Backing up TimescaleDB...${NC}"
    docker-compose -f apps/analytics-service/docker-compose.production.yml exec -T timescaledb pg_dump -U timeseries_user wanzo_timeseries_prod > "${backup_dir}/timeseries_${timestamp}.sql"
    
    echo -e "${GREEN}✅ Backup completed in: ${backup_dir}${NC}"
}

restart_service() {
    echo -e "${BLUE}🔄 Restarting Analytics Service${NC}"
    echo "==============================="
    
    docker-compose -f apps/analytics-service/docker-compose.production.yml restart analytics-service
    
    # Wait for service to be healthy
    echo -e "${YELLOW}⏳ Waiting for service to be healthy...${NC}"
    timeout=60
    elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        if curl -f http://localhost:3004/health &> /dev/null; then
            echo -e "${GREEN}✅ Service restarted successfully${NC}"
            return 0
        fi
        sleep 5
        elapsed=$((elapsed + 5))
        echo "Waiting... (${elapsed}s/${timeout}s)"
    done
    
    echo -e "${RED}❌ Service did not become healthy after restart${NC}"
    return 1
}

cleanup() {
    echo -e "${BLUE}🧹 Cleanup Operations${NC}"
    echo "===================="
    
    # Clean old logs
    echo -e "${YELLOW}Cleaning old logs...${NC}"
    find /var/log/analytics-service -name "*.log" -mtime +7 -delete 2>/dev/null || echo "Could not clean logs"
    
    # Clean Docker
    echo -e "${YELLOW}Cleaning Docker resources...${NC}"
    docker system prune -f
    
    # Clean old backups (keep last 5)
    echo -e "${YELLOW}Cleaning old backups...${NC}"
    if [ -d "backups" ]; then
        find backups -maxdepth 1 -type d | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || echo "No old backups to clean"
    fi
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main script logic
case "${1:-help}" in
    "status")
        check_service_status
        ;;
    "logs")
        show_logs
        ;;
    "health")
        detailed_health_check
        ;;
    "metrics")
        show_metrics
        ;;
    "kafka")
        check_kafka
        ;;
    "backup")
        backup_databases
        ;;
    "restart")
        restart_service
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|*)
        show_help
        ;;
esac
