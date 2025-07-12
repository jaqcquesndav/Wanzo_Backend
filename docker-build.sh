#!/bin/bash

# Function to display help message
show_help() {
    echo "Usage: ./docker-build.sh [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help            Show this help message"
    echo "  -s, --service NAME    Build only a specific service (e.g. accounting-service)"
    echo "  -c, --clean           Clean Docker cache before building"
    echo "  -f, --force           Force rebuild without using cache"
    echo "  -p, --prune           Prune unused Docker images after building"
    echo "  -d, --dev             Build development environment"
    echo "  -u, --up              Start services after build"
    echo ""
    echo "Examples:"
    echo "  ./docker-build.sh --service accounting-service --up"
    echo "  ./docker-build.sh --clean --force"
}

# Default values
SERVICE=""
CLEAN=false
FORCE=false
PRUNE=false
DEV=false
UP=false

# Parse command line options
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -h|--help)
            show_help
            exit 0
            ;;
        -s|--service)
            SERVICE="$2"
            shift
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -p|--prune)
            PRUNE=true
            shift
            ;;
        -d|--dev)
            DEV=true
            shift
            ;;
        -u|--up)
            UP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Clean Docker cache if requested
if [ "$CLEAN" = true ]; then
    echo "Cleaning Docker build cache..."
    docker builder prune -f
fi

# Build command options
BUILD_OPTS=""

if [ "$FORCE" = true ]; then
    BUILD_OPTS="$BUILD_OPTS --no-cache"
fi

if [ "$DEV" = true ]; then
    COMPOSE_FILE="docker-compose.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

# Build the specified service or all services
echo "Building Docker containers using $COMPOSE_FILE..."

if [ -n "$SERVICE" ]; then
    echo "Building service: $SERVICE"
    docker-compose -f $COMPOSE_FILE build $BUILD_OPTS $SERVICE
else
    echo "Building all services"
    docker-compose -f $COMPOSE_FILE build $BUILD_OPTS
fi

# Start services if requested
if [ "$UP" = true ]; then
    if [ -n "$SERVICE" ]; then
        echo "Starting service: $SERVICE"
        docker-compose -f $COMPOSE_FILE up -d $SERVICE
    else
        echo "Starting all services"
        docker-compose -f $COMPOSE_FILE up -d
    fi
fi

# Prune unused Docker images if requested
if [ "$PRUNE" = true ]; then
    echo "Pruning unused Docker images..."
    docker image prune -f
fi

echo "Docker build process completed!"
