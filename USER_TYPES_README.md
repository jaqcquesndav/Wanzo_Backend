# Wanzo_Backend - User Types, Roles, and Permissions Guide

## 1. System User Types Overview

Wanzo_Backend supports two primary types of users:

```typescript
export enum UserType {
  INTERNAL = 'internal',  // Kiota platform employees/staff
  EXTERNAL = 'external',  // Client users (SMEs and institutions)
}
```

User accounts can have the following statuses:

```typescript
export enum UserStatus {
  ACTIVE = 'active',      // Fully active account
  PENDING = 'pending',    // Awaiting validation/approval
  SUSPENDED = 'suspended', // Temporarily disabled
  INACTIVE = 'inactive',   // Permanently disabled
}
```

## 2. Kiota Internal Users (Admin-Service)

Internal users are Kiota platform staff who manage the system:

```typescript
export enum UserRole {
  SUPER_ADMIN = 'super_admin',         // Highest level of access
  CTO = 'cto',                         // Technical admin
  GROWTH_FINANCE = 'growth_finance',   // Finance department
  CUSTOMER_SUPPORT = 'customer_support', // Support team
  CONTENT_MANAGER = 'content_manager',   // Content management
  COMPANY_ADMIN = 'company_admin',       // Admin for client companies
  COMPANY_USER = 'company_user',         // Regular user in client companies
}
```

Permissions are assigned to roles through the `RolePermission` entity, allowing dynamic management of access rights.

## 3. SME Users (app_mobile_service)

Small and Medium Enterprise (SME) users register and use the platform for business management:

```typescript
export enum UserRole {
  OWNER = 'owner',                 // Company owner/super admin
  ADMIN = 'admin',                 // Company administrator
  MANAGER = 'manager',             // Department/team manager
  ACCOUNTANT = 'accountant',       // Finance staff
  CASHIER = 'cashier',             // Handles cash transactions
  SALES = 'sales',                 // Sales staff
  INVENTORY_MANAGER = 'inventory_manager', // Inventory management
  STAFF = 'staff',                 // General staff
  CUSTOMER_SUPPORT = 'customer_support',   // Customer support
}
```

SME registration creates both a company entity and an OWNER user.

## 4. Institution Users (portfolio-institution-service)

Institution users represent financial entities:

```typescript
export enum UserRole {
  ADMIN = 'admin',     // Institution administrator
  MANAGER = 'manager', // Department/team manager
  ANALYST = 'analyst', // Financial analyst
  VIEWER = 'viewer'    // Read-only access
}
```

Institutions are categorized as banks, insurance companies, investment funds, or microfinance institutions.

## 5. User Registration and Validation Flow

### Registration Process
1. New users register through the auth-service
2. For SMEs:
   - Registration creates a company entity and an OWNER/ADMIN user
   - Default status is PENDING
3. For institutions:
   - Registration creates an institution entity and an ADMIN user
   - System assigns a kiotaId (format: `KIOTA-USR-XXXXXXXX-XX`)

### Validation Process
1. New accounts start with PENDING status
2. Kiota internal users review and validate new accounts
3. `toggleUserStatus` method changes user status
4. Once validated, status changes to ACTIVE
5. Notification is sent to the user

## 6. Notification System

The system sends notifications about account status changes via multiple channels:

```typescript
export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}
```

Users can customize notification preferences for different types of events:

```typescript
export enum NotificationType {
  INFO = 'info',
  ALERT = 'alert',
  REMINDER = 'reminder',
  NEW_SALE = 'new_sale',
  STOCK_ALERT = 'stock_alert',
  SUBSCRIPTION_UPDATE = 'subscription_update',
  GENERAL_MESSAGE = 'general_message',
}
```

## 7. Security and Access Control

- Role-based access control is implemented through RolesGuard
- Auth0 integration provides authentication and role assignment
- Two-factor authentication (2FA) is available for enhanced security
- User session management allows tracking and terminating active sessions
- Activity logging records user actions for audit purposes

## 8. Microservices Architecture

The system uses a microservices architecture:
- auth-service: Handles authentication and authorization
- admin-service: Manages internal users and system settings
- app_mobile_service: Serves SME users
- portfolio-institution-service: Serves institution users
- api-gateway: Routes requests between services

## 9. User Validation Workflow

1. User registers (either SME or institution)
2. System creates user with PENDING status
3. Notification sent to admin users about new registration
4. Admin reviews and validates the account
5. Admin toggles status to ACTIVE using AdminUsersController
6. System sends notification to user about activation
7. User can now fully access the system
