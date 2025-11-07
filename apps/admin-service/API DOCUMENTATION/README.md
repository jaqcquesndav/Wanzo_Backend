# API Documentation

This directory contains the API documentation for the project, broken down by modules.
Each file describes the endpoints, request structures, and response formats for a specific module.

The documentation aims to be rigorous and maintain consistency in naming, serving as a guide for backend development.

## 🚀 Latest Updates (November 2025)

**Major Refactoring Completed:** Admin Service now has complete system-wide capabilities with dual customer type management, bidirectional Kafka communication and accounting service integration.

### Key Changes:
- ✅ **Dual Customer Type Management** - Complete support for SME Companies & Financial Institutions
- ✅ **Institution Management Integration** - 16 endpoints for Portfolio Institution Service (port 3006)
- ✅ **Company Management Integration** - 18 endpoints for Gestion Commerciale Service (port 3005)
- ✅ **Token Integration in Subscription Plans** - Tokens now included in plans, no separate purchases
- ✅ **Accounting Service Integration** - Complete financial operations (9 endpoints)
- ✅ **Extended Customer Management** - Subscription/token/user modifications (6 methods)
- ✅ **Bidirectional Kafka Events** - Emit 7 events, consume 8 events
- ✅ **Data Structure Compatibility** - Aligned SubscriptionPlan and Subscription entities
- ✅ **PaginatedResponse<T>** standard format for all list endpoints
- ✅ **APIResponse<T>** standard format for all operation responses  
- ✅ **100% Code Conformity** between documentation and implementation

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

## Modules Documented

### Core Modules
- [Authentication (auth.md)](auth.md)
- [User Management (users.md)](users.md)
- [System & Configuration (system.md)](system.md)

### Customer & Finance Modules
- [Customer Management (customers.md)](customers.md) - **Updated with Advanced Management endpoints**
- [Finance & Subscriptions (finance.md)](finance.md) - **Updated with Token Integration**
- [Accounting Service Integration (accounting.md)](accounting.md) - **NEW - 9 endpoints**
- [Token Management (tokens.md)](tokens.md)

### Admin Customer Type Management (NEW)
- [Financial Institutions (institutions.md)](institutions.md) - **NEW - 16 endpoints for CustomerType.FINANCIAL**
- [SME Companies (companies.md)](companies.md) - **NEW - 18 endpoints for CustomerType.SME**

### Platform Modules
- [Dashboard (dashboard.md)](dashboard.md)
- [Company Management (company.md)](company.md) - Wanzo company profile management
- [Document Management (documents.md)](documents.md)
- [User Settings (settings.md)](settings.md)
- [Chat (chat.md)](chat.md)

### Advanced Features
- [Kafka Events System (kafka-events.md)](kafka-events.md) - **Bidirectional event communication**
- [Adha AI Context (adha-context.md)](adha-context.md) - AI assistant integration

### Master Documentation
- [Complete API Overview (ADMIN_API_DOCUMENTATION.md)](ADMIN_API_DOCUMENTATION.md) - All endpoints in one place

## General API Conventions

This section describes the general conventions followed across the API, including naming conventions, request/response formats, and error handling.
