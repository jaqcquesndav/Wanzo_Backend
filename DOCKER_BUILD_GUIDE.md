# Docker Build Optimization Guide

This guide explains how to optimize Docker builds for the Wanzo Backend microservices architecture.

## Common Docker Build Issues

- **Large build context**: Slow uploads and potential timeouts (EOF errors)
- **Redundant file copying**: Unnecessary files being included in images
- **Inefficient layer caching**: Poor ordering of Dockerfile instructions
- **Dependency issues**: Missing or outdated dependencies

## Improved .dockerignore Files

We've created specific .dockerignore files for each service to minimize the build context:

- **Root .dockerignore**: Contains general exclusions for all services
- **Service-specific .dockerignore**: Contains exclusions tailored to each service

### Key files to exclude:

- Node modules and package locks
- Python virtual environments and caches
- Git and IDE files
- Large data files, models, and databases
- Test files and documentation

## Build Scripts

We've provided two build scripts to help with the build process:

- `build-services.ps1`: PowerShell script for Windows users
- `build-services.sh`: Bash script for Unix/Linux users or Git Bash

These scripts:
- Build services individually to reduce memory usage
- Provide better error reporting
- Allow for retrying failed builds
- Summarize the build process

## How to Build

### Option 1: Using the build scripts

```powershell
# PowerShell
.\build-services.ps1
```

```bash
# Bash
chmod +x ./build-services.sh
./build-services.sh
```

### Option 2: Building individual services

```bash
# Build and start a specific service and its dependencies
docker-compose build accounting-service
docker-compose up -d accounting-service
```

## Monitoring the Build

To monitor Docker's resource usage during builds:
- Windows: Use Docker Desktop dashboard
- Linux: Use `docker stats`

## Troubleshooting

If you encounter build failures:

1. Check the error message in the build output
2. Ensure all dependencies are available
3. Try building with `--no-cache` if issues persist
4. Check service-specific Dockerfile for issues
5. Verify that .dockerignore files are correctly set up

## Best Practices

1. Keep your build context small
2. Use multi-stage builds for production images
3. Order Dockerfile instructions to maximize cache usage
4. Use specific versions for base images
5. Regularly update dependencies
6. Test builds in CI environments before deploying
