# Wanzo Compta API Documentation

## Overview

This documentation provides a comprehensive reference for the Wanzo Compta backend API. It is organized by modules, with each module having its own dedicated documentation file.

## Authentication

Most API endpoints require authentication. Authentication is handled via JWT (JSON Web Tokens). After a successful login, the client receives a token that must be included in the `Authorization` header of subsequent requests.

**Authentication Header Format:**
```
Authorization: Bearer {token}
```

## Common Response Formats

### Success Responses

Successful responses typically return the requested data or a confirmation message with an appropriate HTTP status code (200 OK, 201 Created, etc.).

### Error Responses

Error responses follow a consistent format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": ["Optional array of specific error details"]
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

1. [Accounts](./accounts.md) - Manage chart of accounts and account structures
2. [Activities](./activities.md) - Track user activities and system events
3. [Audit](./audit.md) - Audit trails and data validation
4. [Auth](./auth.md) - Authentication, authorization, and user management
5. [Chat](./chat.md) - AI assistant and messaging capabilities
6. [Organization](./organization.md) - Entreprise (organization) management
7. [Dashboard](./dashboard.md) - Dashboard data and widgets
8. [Data Import](./data-import.md) - Data import functionality
9. [Events](./events.md) - System and business events
10. [External AI](./external-ai.md) - Integration with external AI services
11. [Files](./files.md) - File management and document storage
12. [Fiscal Years](./fiscal-years.md) - Fiscal year management
13. [Journals](./journals.md) - Journal entries and accounting transactions
14. [Declarations](./declarations.md) - Tax and social declarations management
15. [Reporting](./reporting.md) - Financial reports and statements
16. [Settings](./settings.md) - Application settings and configuration
17. [Taxes](./taxes.md) - Tax declarations and calculations

## Data Types

Each module documentation includes the relevant data types and structures used in the API. Common data types are referenced across multiple modules.

## Pagination

Many endpoints that return collections support pagination. Paginated responses follow this format:

```json
{
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 45,
    "totalPages": 3
  }
}
```

Pagination is controlled via query parameters:
- `page`: The page number to retrieve (starting from 1)
- `pageSize`: The number of items per page

## Filtering and Sorting

Endpoints that return collections often support filtering and sorting via query parameters:

- Filtering: `?filter[field]=value`
- Sorting: `?sort=field` (ascending) or `?sort=-field` (descending)

Specific filtering and sorting options are documented in each module.

## Versioning

The API version is included in the base URL: `/api/v1/`

Future versions will use a different version number: `/api/v2/`

## Rate Limiting

API requests are subject to rate limiting to ensure fair usage. Rate limit information is included in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1623456789
```

## Support

For API support or to report issues, please contact the development team.
