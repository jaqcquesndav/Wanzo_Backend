#!/bin/bash

# Build services in order with reduced context and improved error handling

set -e
START_TIME=$(date +%s)

# Create a function to build a service
build_service() {
    local service_name="$1"
    
    echo -e "\n========================================="
    echo -e "Building $service_name..."
    echo -e "=========================================\n"
    
    # Try to build just this service with its dependencies
    if docker-compose build --no-cache "$service_name"; then
        echo -e "\n✅ Successfully built $service_name"
        return 0
    else
        echo -e "\n❌ Failed to build $service_name"
        
        # Ask if user wants to retry
        read -p "Do you want to retry building $service_name? (y/n): " retry
        if [ "$retry" = "y" ]; then
            build_service "$service_name"
            return $?
        fi
        
        # Ask if user wants to skip this service
        read -p "Do you want to skip $service_name and continue with other services? (y/n): " skip
        if [ "$skip" = "y" ]; then
            return 1
        fi
        
        # If not skipping, exit the script
        echo "Exiting build process."
        exit 1
    fi
}

# Display initial message
echo -e "\n==================================================="
echo -e "Starting phased build of Wanzo Backend services"
echo -e "===================================================\n"

# Clean up any old containers and volumes that might interfere
echo "Cleaning up environment before build..."
docker-compose down --remove-orphans
# Uncomment the next line if you want to clean volumes too (will delete database data)
# docker-compose down --volumes

# List of services to build in order
services=("postgres" "zookeeper" "kafka" "api-gateway" "admin-service" 
          "accounting-service" "analytics-service" 
          "portfolio-institution-service" "customer-service" "app-mobile-service" 
          "adha-ai-service")

# Build each service in order
succeeded_services=()
failed_services=()

for service in "${services[@]}"; do
    if build_service "$service"; then
        succeeded_services+=("$service")
    else
        failed_services+=("$service")
    fi
done

# Summary report
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo -e "\n==================================================="
echo -e "Build process completed in ${MINUTES}m ${SECONDS}s"
echo -e "===================================================\n"

if [ ${#succeeded_services[@]} -gt 0 ]; then
    echo "✅ Successfully built services:"
    for service in "${succeeded_services[@]}"; do
        echo "  - $service"
    done
fi

if [ ${#failed_services[@]} -gt 0 ]; then
    echo -e "\n❌ Failed to build services:"
    for service in "${failed_services[@]}"; do
        echo "  - $service"
    done
fi

# Ask if user wants to start the successfully built services
if [ ${#succeeded_services[@]} -gt 0 ]; then
    read -p $'\nDo you want to start the successfully built services? (y/n): ' start_services
    if [ "$start_services" = "y" ]; then
        services_to_start="${succeeded_services[*]}"
        echo "Starting services: $services_to_start"
        docker-compose up -d $services_to_start
    fi
fi
