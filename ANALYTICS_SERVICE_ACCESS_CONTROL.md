# Analytics Service Access Control

## Overview

The analytics service (`analytics-service`) is restricted to portfolio institution users only. This document describes how this access restriction is implemented and how to test or modify it.

## Implementation Details

The access control is implemented at the API Gateway level through the following mechanisms:

1. **Guards**:
   - `AnalyticsRouteGuard`: A guard that checks if the user has the appropriate role before allowing access to analytics routes.

2. **Middleware**:
   - `AnalyticsAccessMiddleware`: A middleware that enforces access control for all routes starting with `/analytics`.

3. **Controllers**:
   - `AnalyticsAccessController`: Provides an endpoint to check if a user has access to the analytics service.

## User Types with Access

The following user types have access to the analytics service:

1. Portfolio Institution users (`userType === 'PORTFOLIO_INSTITUTION'`)
2. Admin users (`userType === 'ADMIN'`)
3. Users with the specific permission `'ANALYTICS_ACCESS'` in their permissions array

## How to Test

You can test the access control using the following endpoint:

```
GET /analytics-access/check
```

This endpoint will return:
- `200 OK` with `{ hasAccess: true, ... }` if the user has access
- `403 Forbidden` if the user does not have access

## How to Modify Access Control

If you need to modify the access control rules:

1. Edit the `AnalyticsRouteGuard` in `apps/api-gateway/src/modules/proxy/guards/analytics-route.guard.ts`
2. Edit the `AnalyticsAccessMiddleware` in `apps/api-gateway/src/modules/analytics/middleware/analytics-access.middleware.ts`

For example, to add a new user type with access:

```typescript
const hasInstitutionAccess = 
  userType === 'PORTFOLIO_INSTITUTION' || 
  userType === 'ADMIN' ||
  userType === 'NEW_USER_TYPE' ||  // Add new user type here
  (request.user.permissions && request.user.permissions.includes('ANALYTICS_ACCESS'));
```

## Configuration

The access control is currently hardcoded in the middleware and guards. If you need to make it configurable, consider:

1. Moving the allowed user types to environment variables
2. Creating a database table for role-based access control
3. Implementing a more sophisticated permission system

## Troubleshooting

If users are unexpectedly denied access:

1. Check the user object in the request to ensure it contains the correct `userType` or `permissions`
2. Verify that the authentication middleware is properly setting the user object
3. Check for any middleware ordering issues that might prevent the user object from being set

## Data Sources

The analytics service does not maintain its own primary data storage. Instead, it aggregates and processes data from other microservices in the system:

1. **Data Collection**:
   - The service retrieves data from other microservices via API calls or message queues
   - Each analysis may require data from multiple source services
   - Data is collected on-demand or through scheduled synchronization

2. **Source Microservices**:
   - `portfolio-institution-service`: Institution portfolio data
   - `portfolio-sme-service`: SME portfolio data
   - `accounting-service`: Financial and accounting data
   - `admin-service`: User and organizational data

3. **Data Flow**:
   - Client requests analysis → Analytics service determines required data → Requests data from relevant microservices → Processes and returns results
   - For performance-critical operations, the service may maintain a cache of frequently accessed data

4. **Communication Methods**:
   - REST API calls between services
   - Kafka event streaming for real-time updates
   - Database replication for large datasets (when applicable)

This architecture ensures that the analytics service always works with the most current data while maintaining separation of concerns between services.
