#!/bin/bash
# start-environment.sh - Script to start the Wanzobe environment

# Default values
ENV_PROFILE="dev"
BUILD_IMAGES=false

# Function to display help
function show_help {
    echo "Usage: ./start-environment.sh [PROFILE] [OPTIONS]"
    echo ""
    echo "Arguments:"
    echo "  PROFILE         Either 'dev' or 'prod' (default: dev)"
    echo ""
    echo "Options:"
    echo "  -b, --build     Build or rebuild images before starting containers"
    echo "  -h, --help      Show this help message"
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        dev|prod)
            ENV_PROFILE="$1"
            shift
            ;;
        -b|--build)
            BUILD_IMAGES=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            ;;
    esac
done

# Base command
DOCKER_COMPOSE_CMD="docker-compose --profile $ENV_PROFILE"

# Add build flag if requested
if [ "$BUILD_IMAGES" = true ]; then
    echo "🔨 Building images for profile: $ENV_PROFILE"
    BUILD_CMD="$DOCKER_COMPOSE_CMD build"
    echo "Executing: $BUILD_CMD"
    eval $BUILD_CMD
    
    if [ $? -ne 0 ]; then
        echo "❌ Build failed"
        exit 1
    fi
fi

# Start containers
echo "🚀 Starting environment with profile: $ENV_PROFILE"
UP_CMD="$DOCKER_COMPOSE_CMD up -d"
echo "Executing: $UP_CMD"
eval $UP_CMD

if [ $? -ne 0 ]; then
    echo "❌ Failed to start environment"
    exit 1
fi

# Show running containers
echo "✅ Environment started successfully with profile: $ENV_PROFILE"
echo "📋 Running containers:"
docker-compose ps

echo ""
echo "💡 To stop the environment, run: docker-compose --profile $ENV_PROFILE down"
echo "💡 To view logs from all services, run: docker-compose --profile $ENV_PROFILE logs -f"
echo "💡 To view logs from a specific service, run: docker-compose --profile $ENV_PROFILE logs -f SERVICE_NAME"
