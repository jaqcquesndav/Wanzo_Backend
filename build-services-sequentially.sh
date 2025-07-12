#!/bin/bash

# Script to build Docker services one by one and validate each step
# This helps isolate and fix build issues

# Define colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}Build and Validate Docker Services${NC}"

# Array of services in the order they should be built
services=(
    "accounting-service"
    "customer-service"
    "admin-service"
    "analytics-service"
    "api-gateway"
    "app-mobile-service"
    "portfolio-sme-service"
    "portfolio-institution-service"
)

# First run the Docker optimization script
echo -e "\n${YELLOW}Step 1: Running optimization script...${NC}"
chmod +x ./optimize-docker-builds.sh
./optimize-docker-builds.sh

# Function to build and test a service
build_and_test_service() {
    local service_name=$1
    
    echo -e "\n${GREEN}Building $service_name...${NC}"
    
    # Clean up any previous containers for this service
    docker-compose rm -sf $service_name
    
    # Build the service
    echo -e "${YELLOW}Running: docker-compose build $service_name${NC}"
    docker-compose build $service_name
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error building $service_name. Fix the issue before continuing.${NC}"
        return 1
    fi
    
    # Start the service
    echo -e "${YELLOW}Starting: docker-compose up -d $service_name${NC}"
    docker-compose up -d $service_name
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error starting $service_name. Fix the issue before continuing.${NC}"
        return 1
    fi
    
    # Check the container status
    echo -e "${CYAN}Container status for $service_name:${NC}"
    docker-compose ps $service_name
    
    # Wait a moment to see if it crashes immediately
    sleep 5
    
    # Check logs
    echo -e "${CYAN}Logs for $service_name:${NC}"
    docker-compose logs --tail=20 $service_name
    
    return 0
}

# Build and test each service one by one
for service in "${services[@]}"; do
    build_and_test_service $service
    
    if [ $? -ne 0 ]; then
        read -p "Continue to next service? (y/n) " answer
        if [ "$answer" != "y" ]; then
            echo -e "${RED}Build process stopped at $service. Fix the issue and run this script again.${NC}"
            exit 1
        fi
    fi
done

echo -e "\n${GREEN}All services built and started successfully!${NC}"
