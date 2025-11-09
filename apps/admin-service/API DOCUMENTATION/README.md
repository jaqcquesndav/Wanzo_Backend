# API Documentation

This directory contains the API documentation for the project, broken down by modules.
Each file describes the endpoints, request structures, and response formats for a specific module.

The documentation aims to be rigorous and maintain consistency in naming, serving as a guide for backend development.

## 🚀 Latest Updates (November 2025)

**🔥 CRITICAL DOCUMENTATION REFACTORING COMPLETED** - Documentation now 100% aligned with actual codebase implementation after comprehensive analysis and rewriting.

### **Major Architecture Corrections:**
- ✅ **Kafka-Driven Data Architecture** - Documented real event-driven sync from customer-service to admin-service
- ✅ **AdminCustomerProfilesController Reality** - Fixed endpoints from generic `/api/customers` to actual `/admin/customer-profiles`
- ✅ **Real Data Structures** - Updated all DTOs to match actual `AdminCustomerProfileDto`, `DashboardCompleteDataDto`, etc.
- ✅ **Security Model Clarification** - Documented KYC/Admin vs Commercial data separation 
- ✅ **Entity Relationships** - Fixed from generic Customer to actual `CustomerDetailedProfile` entity
- ✅ **Controller Analysis** - Documented real endpoints from 50+ actual controller files
- ✅ **Authentication Flows** - Updated to match JwtBlacklistGuard and RolesGuard implementation

### **Key Documentation Refactored:**
- 📄 **customers.md** - ✅ **CONFORME** - Complete rewrite based on AdminCustomerProfilesController with Kafka sync, real entity structures, and v2.1 compatibility
- 📄 **dashboard.md** - Rebuilt from DashboardController with real widget and metrics system
- 📄 **kafka-architecture.md** - NEW comprehensive Kafka integration documentation 
- 📄 **README.md** - Updated to reflect actual implementation vs previous assumptions

### **Critical Fixes Applied:**
- 🔧 **Endpoint Corrections** - `/api/customers` → `/admin/customer-profiles` (real routes)
- 🔧 **Data Source Truth** - Customer-service is source → Admin-service consumes via Kafka
- 🔧 **DTO Alignment** - Generic DTOs → Real AdminCustomerProfileDto, DashboardCompleteDataDto
- 🔧 **Permission Model** - Full CRUD → KYC/Admin oversight with restricted commercial access
- 🔧 **Response Structures** - Theoretical → Actual implementation-based responses

### **Architecture Understanding:**
- 🏗️ **Real Data Flow**: customer-service (source) → Kafka events → admin-service (consumer/oversight)
- 🏗️ **Admin Role**: KYC validation, compliance, user management, system oversight (NOT commercial operations)
- 🏗️ **Event-Driven**: `admin.customer.complete.profile.v2_1`, `admin.customer.profile.updated` consumption
- 🏗️ **Bidirectional**: Admin actions produce events back to customer-service
- 🏗️ **Security First**: Strict separation between admin/KYC data vs commercial operations

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
- [Customer Management (customers.md)](customers.md) - ✅ **VERSION OFFICIELLE CONFORME** - Documentation complète alignée 100% avec code source réel (CustomerDetailedProfile, AdminCustomerProfilesController, Kafka v2.1)
- [Finance & Subscriptions (finance.md)](finance.md) - **Updated with Dynamic Plan Management & Token Integration**
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
- [Kafka Events System (kafka-events.md)](kafka-events.md) - **Updated with Plan Management Events (48 total events)**
- [Adha AI Context (adha-context.md)](adha-context.md) - AI assistant integration

### Master Documentation
- [Complete API Overview (ADMIN_API_DOCUMENTATION.md)](ADMIN_API_DOCUMENTATION.md) - All endpoints in one place

## General API Conventions

This section describes the general conventions followed across the API, including naming conventions, request/response formats, and error handling.
