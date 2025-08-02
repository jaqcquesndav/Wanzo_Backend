# Wanzo Compta API Documentation

## Overview

This documentation provides a comprehensive reference for the Wanzo Compta backend API. It is organized by modules, with each module having its own dedicated documentation file.

## Base URL

Toutes les requêtes doivent passer par l'API Gateway au port 8000.

```
http://localhost:8000/accounting
```

## Authentication

All API endpoints require authentication via Bearer tokens (Auth0 JWT). The client must include the token in the `Authorization` header along with the required client identifier.

**Required Headers:**
```
Authorization: Bearer <jwt_token>
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
Content-Type: application/json
```

## Standard Response Format

All API responses follow a consistent wrapper format:

### Success Responses

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Responses

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource state conflict
- `500 Internal Server Error`: Server-side error

## API Modules

The API is organized into the following modules:

1. [Accounts](./accounts.md) - Manage chart of accounts, account structures, and financial operations
2. [Audit](./audit.md) - Audit trails for fiscal years by certified auditors
3. [Auth](./auth.md) - Authentication, authorization, and user management
4. [Chat](./chat.md) - AI assistant and messaging capabilities
5. [Dashboard](./dashboard.md) - Dashboard data and business intelligence widgets
6. [Declarations](./declarations.md) - Tax and social declarations management
7. [Fiscal Years](./fiscal-years.md) - Fiscal year management and closing procedures
8. [Journals](./journals.md) - Journal entries and accounting transactions
9. [Ledger](./ledger.md) - General ledger, trial balance, and account movements
10. [Notifications](./notifications.md) - System notifications and alerts
11. [Organization](./organization.md) - Enterprise (organization) management
12. [Reporting](./reporting.md) - Financial reports, statements, and analytics
13. [Settings](./settings.md) - Application settings and configuration
14. [Users](./users.md) - User management and access control

## Data Types

Each module documentation includes the relevant data types and structures used in the API. Common data types are referenced across multiple modules.

## Pagination

Endpoints that return collections use paginated responses with this format:

```json
{
  "success": true,
  "data": {
    "data": [
      // Array of items
    ],
    "total": 45,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

**Pagination Query Parameters:**
- `page`: Page number (starting from 1, default: 1)
- `pageSize`: Items per page (default: 20, max: 100)

## Data Types & Standards

All data structures follow TypeScript interfaces defined in the frontend application. The API adheres to international and regional standards:

### Financial Standards
- **Accounting Standard**: SYSCOHADA/OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires)
- **Primary Currency**: CDF (Franc Congolais)
- **Multi-currency Support**: USD, EUR, CDF with automatic conversion rates
- **Chart of Accounts**: SYSCOHADA-compliant account numbering system

### Data Formats
- **Date Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
- **Amounts**: Decimal numbers (no string formatting in API responses)
- **Identifiers**: UUID v4 format for all entity IDs
- **Encoding**: UTF-8 for all text data

### Validation Rules
- **Required Fields**: Clearly marked in each endpoint documentation
- **Business Logic**: Server-side validation for all financial operations
- **Data Integrity**: Referential integrity maintained across all entities
- **Audit Trail**: Complete change tracking for compliance requirements

## Filtering and Sorting

Endpoints that return collections support comprehensive filtering and sorting via query parameters:

### Standard Query Parameters:
- **Pagination**: `page`, `pageSize`
- **Filtering**: `startDate`, `endDate`, `status`, `type`, etc.
- **Searching**: `search`, `query` (full-text search where available)
- **Sorting**: `sortBy`, `sortOrder` (asc/desc)
- **Export**: `export` (csv, excel, pdf formats)

### Example:
```
GET /accounts?page=1&pageSize=20&search=expense&sortBy=code&sortOrder=asc&export=csv
```

Specific filtering and sorting options are documented in each module.

## Advanced Features

### Comprehensive Data Management
- **Full CRUD operations** on all entities
- **Batch operations** for bulk data processing
- **Advanced search and filtering** across all modules
- **Export capabilities** in multiple formats (CSV, Excel, PDF)
- **Real-time data synchronization** with offline support

### Financial Operations
- **Multi-currency support** with automatic conversion
- **SYSCOHADA/OHADA compliance** for African accounting standards
- **Automated trial balance calculations**
- **Period-end closing procedures**
- **Audit trail maintenance** for all financial transactions

### Security and Compliance
- **Role-based access control** (RBAC)
- **Audit logging** for all data modifications
- **Certified auditor workflow** for fiscal year validation
- **Data encryption** in transit and at rest

## Versioning

The API follows semantic versioning principles:

- **Current Version**: `v2.0.0` - Production-ready with complete endpoint coverage
- **API Base Path**: `/accounting` (through API Gateway on port 8000)
- **Version Header**: `X-API-Version: 2.0.0` (optional)

Future versions will maintain backward compatibility where possible. Breaking changes will be clearly documented and communicated in advance.

## Environment Configuration

### Development
```
Base URL: http://localhost:8000/accounting
Auth Provider: Auth0 Development
Database: PostgreSQL (local)
```

### Production
```
Base URL: https://api.wanzo-compta.com/accounting
Auth Provider: Auth0 Production
Database: PostgreSQL (managed)
```

## Rate Limiting

API requests are subject to rate limiting to ensure fair usage. Rate limit information is included in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1623456789
```

## Documentation Updates & Conformity

This API documentation has been comprehensively updated and validated for production readiness:

### Recent Improvements (August 2025)
- ✅ **Complete endpoint coverage** across all modules
- ✅ **Schema validation** - All endpoints match TypeScript interfaces
- ✅ **Advanced filtering** - Comprehensive search and pagination support
- ✅ **Export functionality** - CSV, Excel, PDF export capabilities
- ✅ **Audit system** - Proper fiscal year audit workflow implementation
- ✅ **Production endpoints** - All missing production endpoints created
- ✅ **Data consistency** - Full alignment between UI, hooks, services, and API

### Quality Assurance
- **Code-Documentation Parity**: 100% alignment between source code and documentation
- **Type Safety**: All endpoints match TypeScript interface definitions
- **Business Logic**: Proper SYSCOHADA accounting workflow implementation
- **Error Handling**: Comprehensive error responses with meaningful messages

### Modules with Major Updates
1. **Accounts** - Enhanced filtering, batch operations, advanced search
2. **Ledger** - Trial balance, account movements, period calculations
3. **Reporting** - Financial statements, analytics, multi-format exports
4. **Audit** - Fiscal year audit workflow by certified auditors
5. **Journals** - Enhanced entry management, validation, and export

For detailed change logs, see the [CHANGELOG.md](./CHANGELOG.md) file.

## Support & Resources

### Getting Help
- **Technical Issues**: Contact the development team via support portal
- **Business Logic Questions**: Consult the SYSCOHADA documentation or business analysts
- **Integration Support**: Schedule a consultation for implementation guidance

### Additional Resources
- **TypeScript Definitions**: Available in the frontend repository
- **Postman Collection**: Import ready-to-use API collection for testing
- **Code Examples**: Sample implementations in TypeScript/React
- **Business Rules**: SYSCOHADA accounting standards documentation

### Reporting Issues
When reporting API issues, please include:
1. **Endpoint URL** and HTTP method
2. **Request payload** (sanitized of sensitive data)
3. **Response received** vs expected
4. **Environment** (development/production)
5. **Timestamp** of the request

### Changelog & Updates
Stay informed about API changes:
- Review the [CHANGELOG.md](./CHANGELOG.md) for detailed update information
- Subscribe to developer notifications for breaking changes
- Test new features in development environment before production deployment

---

*Last updated: August 2, 2025 - v2.0.0 Production Release*
