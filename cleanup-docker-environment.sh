#!/bin/bash
# Docker Project Cleanup Script
# This script cleans up Docker resources and prepares the environment for a fresh build

echo -e "\e[36mStarting Docker cleanup and environment preparation...\e[0m"

# 1. Stop all running containers
echo -e "\e[33mStopping all running Docker containers...\e[0m"
docker stop $(docker ps -q) 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "\e[90m  No running containers to stop\e[0m"
else
    echo -e "\e[32m  All containers stopped\e[0m"
fi

# 2. Remove all stopped containers
echo -e "\e[33mRemoving stopped containers...\e[0m"
docker container prune -f
echo -e "\e[32m  Containers removed\e[0m"

# 3. Remove unused images
echo -e "\e[33mRemoving unused Docker images...\e[0m"
docker image prune -f
echo -e "\e[32m  Unused images removed\e[0m"

# 4. Remove unused volumes
echo -e "\e[33mRemoving unused Docker volumes...\e[0m"
docker volume prune -f
echo -e "\e[32m  Unused volumes removed\e[0m"

# 5. Remove unused networks
echo -e "\e[33mRemoving unused Docker networks...\e[0m"
docker network prune -f
echo -e "\e[32m  Unused networks removed\e[0m"

# 6. Remove all Wanzo service images to force rebuild
echo -e "\e[33mRemoving Wanzo service images...\e[0m"
services=(
    "accounting-service"
    "admin-service"
    "analytics-service"
    "api-gateway"
    "app_mobile_service"
    "customer-service"
    "portfolio-institution-service"
    "portfolio-sme-service"
)

for service in "${services[@]}"; do
    docker rmi -f "wanzo/$service" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo -e "\e[90m  No image found for wanzo/$service\e[0m"
    else
        echo -e "\e[32m  Removed image wanzo/$service\e[0m"
    fi
done

# 7. Clean node_modules if requested
read -p "Do you want to clean node_modules directories? (y/N) " clean_node_modules
if [[ "$clean_node_modules" =~ ^[Yy]$ ]]; then
    echo -e "\e[33mCleaning node_modules directories...\e[0m"
    find . -name "node_modules" -type d -exec echo "  Removing {}" \; -exec rm -rf {} \; 2>/dev/null
    echo -e "\e[32m  All node_modules directories removed\e[0m"
fi

# 8. Run Docker system prune as final cleanup
read -p "Do you want to perform a deep system cleanup? This will remove all unused data (y/N) " deep_clean
if [[ "$deep_clean" =~ ^[Yy]$ ]]; then
    echo -e "\e[33mRunning Docker system prune...\e[0m"
    docker system prune -a -f
    echo -e "\e[32m  Deep cleanup completed\e[0m"
fi

echo -e "\n\e[36mDocker cleanup complete!\e[0m"
echo -e "\e[36mYou can now run './optimize-docker-builds.sh' followed by './build-services-sequentially.sh' to rebuild all services.\e[0m"
