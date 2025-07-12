# Docker Optimization Guide

This guide provides best practices and solutions for optimizing Docker builds in the Wanzo Backend project.

## Recent Fixes

### 1. TypeScript Decorator Issues

TypeScript decorators (used heavily in NestJS) require specific compiler options to work correctly:

```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "useDefineForClassFields": false
  }
}
```

These options have been added to the shared TypeScript configurations in `packages/tsconfig/`.

### 2. Docker Build Optimization

The Docker builds have been optimized with the following strategies:

- Created proper layer caching by separating dependency installation from code copying
- Reduced build context size with a comprehensive `.dockerignore` file
- Implemented mock services for faster development builds
- Optimized production images by removing development dependencies
- Added security improvements by running as non-root users
- Fixed CMD syntax issues and local package dependencies

## Running the Optimization Scripts

### Windows

```powershell
.\optimize-docker-builds.ps1
```

### Linux/Mac

```bash
chmod +x optimize-docker-builds.sh
./optimize-docker-builds.sh
```

## Building with Docker Compose

After running the optimization scripts, you can build all Docker containers at once:

```bash
docker-compose build --no-cache
```

### Sequential Build Script

For more reliable builds, use the provided sequential build script that builds and validates each service one by one:

#### Windows:
```powershell
.\build-services-sequentially.ps1
```

#### Linux/Mac:
```bash
chmod +x build-services-sequentially.sh
./build-services-sequentially.sh
```

This approach is recommended as it:
1. Builds each service individually
2. Tests that each container starts correctly
3. Shows logs to help diagnose any issues
4. Allows you to fix problems with one service before moving to the next

### Fast Build Script

For a faster build that includes error handling and retries:

#### Windows:
```powershell
.\build-services.ps1
```

#### Linux/Mac:
```bash
chmod +x build-services.sh
./build-services.sh
```

### Known Working Services

The following services have been successfully optimized and build correctly:
- `accounting-service`
- `analytics-service`
- `customer-service`
- `admin-service`
- `api-gateway`
- `app_mobile_service`
- `portfolio-sme-service`
- `portfolio-institution-service`

### Common Build Issues

1. **Missing shared directories**: Update specific service Dockerfiles using the patterns shown in the accounting-service Dockerfile.

2. **Package version errors**: If you see `npm error Invalid Version` errors, check the package version format in the Dockerfile. Replace caret (^) versions with exact versions:
   ```dockerfile
   # Change this:
   RUN npm install --save @nestjs/microservices@^10.3.0 --legacy-peer-deps
   
   # To this:
   RUN npm install --save @nestjs/microservices@10.3.0 --legacy-peer-deps
   ```

3. **CMD syntax errors**: Several Dockerfiles had improper shell conditional syntax in CMD instructions, which causes "Unknown instruction: ELSE" errors. The optimization script fixes these by:
   ```dockerfile
   # Incorrect:
   CMD ["node", "apps/api-gateway/dist/src/main.js"]
       else \
       echo 'Could not find main.js file to execute' && ls -R apps/api-gateway/dist && exit 1; \
       fi"]
   
   # Correct:
   CMD ["sh", "-c", "if [ -f 'apps/api-gateway/dist/src/main.js' ]; then \
       node apps/api-gateway/dist/src/main.js; \
       elif [ -f 'apps/api-gateway/dist/main.js' ]; then \
       node apps/api-gateway/dist/main.js; \
       else \
       echo 'Could not find main.js file to execute' && ls -R apps/api-gateway/dist && exit 1; \
       fi"]
   ```

4. **Local package dependencies**: Some services reference local packages like `@wanzo/shared` or `@wanzobe/customer-sync` which aren't available in the npm registry. The optimization script now fixes these by:
   - Copying the actual package.json files from local packages
   - Creating stub modules for these packages
   - Modifying service package.json files to use file: references instead of version numbers
   - Using a fallback install command with --force if needed
   
   Example error:
   ```
   npm error 404 Not Found - GET https://registry.npmjs.org/@wanzobe%2fcustomer-sync - Not found
   npm error 404  '@wanzobe/customer-sync@^1.0.0' is not in this registry.
   ```

## Best Practices for Docker Builds

### 1. Layer Caching

Structure your Dockerfile to take advantage of Docker's layer caching:

```dockerfile
# Copy package files first
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Then copy source code
COPY src/ ./src/
```

### 2. Multi-stage Builds

Use multi-stage builds to keep production images small:

```dockerfile
FROM node:18-alpine AS builder
# Build steps here...

FROM node:18-alpine AS production
# Copy only what's needed from the builder
COPY --from=builder /app/dist ./dist
```

### 3. Docker Context Size

Keep your Docker context small by using `.dockerignore`:
- Exclude `node_modules`, build artifacts, logs, etc.
- Only include necessary files for building

### 4. Non-root User

Run containers as non-root users for better security:

```dockerfile
USER node
```

### 5. NestJS Build Options

For NestJS services that have build issues:
- Use the `build:docker` script which creates a mock service
- Set appropriate TypeScript compiler options for decorators

## Troubleshooting Common Issues

### TypeScript Decorator Errors

If you see errors like `TS1241`, `TS1270`, or `TS1206` related to decorators:

1. Ensure your `tsconfig.json` has the proper decorator options:
   ```json
   "experimentalDecorators": true,
   "emitDecoratorMetadata": true,
   "strictPropertyInitialization": false,
   "useDefineForClassFields": false
   ```

2. Check that your NestJS service extends from the shared configuration:
   ```json
   {
     "extends": "../../packages/tsconfig/nestjs.json"
   }
   ```

### Failed NPM Installations

If npm install fails with peer dependency issues:

1. Add `--legacy-peer-deps` flag to npm commands
2. Set the environment variable in your Dockerfile:
   ```dockerfile
   ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
   ```

### Missing Shared Directories or Files

If you encounter errors like `failed to compute cache key: failed to calculate checksum: "/packages/shared/src": not found`:

1. Create necessary directories before copying files:
   ```dockerfile
   RUN mkdir -p ./packages/shared/src ./packages/customer-sync
   ```

2. Create minimal placeholder files for dependencies:
   ```dockerfile
   RUN echo '{"name":"@wanzo/shared","version":"0.1.0"}' > ./packages/shared/package.json
   ```

### Memory Issues During Build

If you encounter memory issues during the build:

1. Increase Node's memory limit:
   ```dockerfile
   ENV NODE_OPTIONS="--max-old-space-size=4096"
   ```

2. Use a larger machine for building or adjust Docker memory allocation

### Python Service Issues

For Python services (like Adha-ai-service):

1. Use multistage builds to reduce final image size
2. Optimize pip installation with flags:
   ```dockerfile
   RUN pip install --no-cache-dir --timeout 300 --retries 10 -r requirements.txt
   ```

## Monitoring Build Performance

Track your Docker build performance:
- Use `docker build --progress=plain` to see detailed build steps
- Monitor build times and image sizes with `docker image ls`
- Consider implementing CI/CD metrics to track build performance over time
