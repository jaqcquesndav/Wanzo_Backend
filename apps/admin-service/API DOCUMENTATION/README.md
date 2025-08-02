# API Documentation

This directory contains the API documentation for the project, broken down by modules.
Each file describes the endpoints, request structures, and response formats for a specific module.

The documentation aims to be rigorous and maintain consistency in naming, serving as a guide for backend development.

## 🚀 Latest Updates (August 2025)

**Standardization Completed:** All API documentation has been updated to reflect the standardized service architecture implemented in the codebase.

### Key Changes:
- ✅ **PaginatedResponse<T>** standard format for all list endpoints
- ✅ **APIResponse<T>** standard format for all operation responses  
- ✅ **Centralized Types** imported from `/types/` directory
- ✅ **Service Architecture** UI → Hooks → Types → Services → API
- ✅ **99% Code Conformity** between documentation and implementation

## Standard Response Types

All endpoints now use standardized response formats:

### PaginatedResponse<T>
```typescript
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  totalPages: number;
}
```

### APIResponse<T>
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: APIError;
}
```

## Modules Documented:
(This section will be updated as modules are documented)
- [Authentication (auth.md)](auth.md)
- [User Management (users.md)](users.md)
- [Chat (chat.md)](chat.md)
- [System & Configuration (system.md)](system.md)
- [Customer Management (customers.md)](customers.md)
- [Finance & Subscriptions (finance.md)](finance.md)
- [Dashboard (dashboard.md)](dashboard.md)
- [Company Management (company.md)](company.md)
- [Document Management (documents.md)](documents.md)
- [Token Management (tokens.md)](tokens.md)
- [User Settings (settings.md)](settings.md)
- [Adha Context (adha-context.md)](adha-context.md)

## General API Conventions

This section describes the general conventions followed across the API, including naming conventions, request/response formats, and error handling.
