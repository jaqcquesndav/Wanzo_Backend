# Analytics Service Data Aggregation Architecture

## Overview

The analytics service in the Wanzobe platform is designed to aggregate and process data from multiple microservices to provide comprehensive analytics and insights. This document details how the service collects, processes, and delivers analytics data to users.

## Architecture

### Data Collection Flow

1. **Request Initiation**
   - User initiates a request for analytics via the API Gateway
   - API Gateway validates user permissions (only portfolio institution users, admins, or users with `ANALYTICS_ACCESS` permission can access)
   - Request is proxied to the analytics-service

2. **Data Aggregation**
   - The analytics-service determines which data sources are needed for the specific analysis
   - Requests are made to relevant microservices in parallel when possible
   - Data is collected, normalized, and prepared for analysis

3. **Processing & Analysis**
   - Collected data is processed according to the analysis requirements
   - Statistical calculations, trend analysis, and data modeling are performed
   - Results are formatted for presentation

4. **Response Delivery**
   - Processed analytics are returned to the API Gateway
   - API Gateway delivers the results to the client application

## Data Sources

The analytics service collects data from the following microservices:

### 1. Portfolio Institution Service
- **Endpoint**: `GET /api/portfolios/:institutionId`
- **Data Collected**: Portfolio performance, institution details, investment allocations
- **Use Cases**: Institution performance analysis, portfolio health assessment

### 2. Portfolio SME Service
- **Endpoint**: `GET /api/portfolios/:smeId`
- **Data Collected**: SME financial data, growth metrics, risk assessments
- **Use Cases**: SME performance analysis, risk profiling

### 3. Accounting Service
- **Endpoint**: `GET /api/dashboard`
- **Data Collected**: Financial statements, cash flow data, accounting metrics
- **Use Cases**: Financial health analysis, compliance reporting

### 4. Admin Service
- **Endpoint**: `GET /api/users/:userId`
- **Data Collected**: User data, organizational structure
- **Use Cases**: User analytics, organizational insights

## Implementation Details

### DataCollectionService

The `DataCollectionService` is the core component responsible for fetching data from various microservices:

```typescript
@Injectable()
export class DataCollectionService implements OnModuleInit {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(AnalyticsConfig)
    private readonly analyticsConfigRepository: Repository<AnalyticsConfig>,
  ) {}

  // Lifecycle hook to check database connection
  async onModuleInit() {...}

  // Database connection verification
  private async checkDatabaseConnection(): Promise<boolean> {...}
  private async ensureDatabaseConnected() {...}

  // Data sharing permission checks
  async checkSMEDataSharingEnabled(smeId: string): Promise<boolean> {...}

  // Methods for collecting data from different services
  async getInstitutionPortfolioData(institutionId: string, period?: string) {...}
  async getSMEPortfolioData(smeId: string, period?: string) {...}
  async getAccountingData(companyId: string, fiscalYear?: string) {...}
  async getUserData(userId: string) {...}
  
  // Method for aggregating data from multiple sources
  async getAggregatedData(institutionId: string, period?: string) {...}
}
```

### Analytics Endpoints

The analytics service exposes several endpoints for different types of analytics:

1. **Institution Analytics**
   - `GET /analytics/institution/:id?period=<period>`
   - Provides comprehensive analysis of an institution's performance

2. **Portfolio Performance Analytics**
   - `GET /analytics/portfolio-performance/:id`
   - Analyzes the performance metrics of a specific portfolio

3. **Financial Health Analysis**
   - `GET /analytics/financial-health/:id?fiscalYear=<year>`
   - Evaluates the financial health of a company using accounting data

## Error Handling & Resilience

The analytics service implements several strategies to handle failures in data collection:

1. **Circuit Breaking**: If a microservice is consistently failing, the service will temporarily stop attempting to collect data from it.

2. **Fallback Mechanisms**: For critical analytics, the service can use cached data or provide partial results when a data source is unavailable.

3. **Logging & Monitoring**: All data collection attempts and failures are logged for monitoring and troubleshooting.

4. **Database Connection Validation**: The service actively checks for database connectivity:
   - On startup, the service verifies database connection
   - Before each operation, connection is revalidated
   - If connection fails, operations return a clear 503 Service Unavailable response

5. **Empty Data Handling**: The service gracefully handles cases where:
   - Source microservices return empty datasets
   - Not enough data is available for meaningful analysis
   - In these cases, a structured response with helpful information is returned instead of failing

## Caching Strategy

To improve performance and reduce load on source microservices:

1. **Request-Level Cache**: Frequently requested analytics are cached for short periods (configurable, default: 5 minutes)

2. **Data-Level Cache**: Raw data from source microservices can be cached for reuse across different analytics requests

3. **Invalidation Strategy**: Caches are invalidated based on time or when triggered by events from source microservices

## Security Considerations

1. **Data Access Control**: The analytics service only collects data that the requesting user has permission to access

2. **Sensitive Data Handling**: Personally identifiable information (PII) and sensitive financial data are handled according to compliance requirements

3. **Audit Logging**: All data access is logged for audit purposes

4. **SME Data Sharing Restrictions**: The service respects SME data sharing preferences and will only access SME data if explicitly permitted by the SME
   - A database table `analytics_config` tracks each SME's data sharing preferences
   - The service checks this configuration before accessing any SME data
   - If data sharing is disabled, the service returns a 403 Forbidden response

5. **Database Dependency**: The service will not operate if its database connection is unavailable
   - Service startup includes database connection verification
   - All analytics operations require a valid database connection
   - If the database is unavailable, operations return a 503 Service Unavailable response

## Configuration

The analytics service is configured via environment variables:

```
# Microservices URLs
PORTFOLIO_INSTITUTION_SERVICE_URL=http://portfolio-institution-service:3000
PORTFOLIO_SME_SERVICE_URL=http://portfolio-sme-service:3000
ACCOUNTING_SERVICE_URL=http://accounting-service:3000
ADMIN_SERVICE_URL=http://admin-service:3000

# Cache configuration
CACHE_TTL=300 # Time-to-live for cache entries in seconds

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=analytics
DB_LOGGING=false
DB_RUN_MIGRATIONS=true
```

## Future Enhancements

1. **Real-Time Analytics**: Implement Kafka-based streaming for real-time analytics updates

2. **Advanced Caching**: Implement Redis-based distributed caching for improved performance

3. **Machine Learning Integration**: Add ML capabilities for predictive analytics

4. **Custom Analytics Builder**: Allow users to create custom analytics dashboards

## Troubleshooting

Common issues and their solutions:

1. **Slow Response Times**
   - Check individual microservice response times
   - Verify network latency between services
   - Examine data volume being processed

2. **Missing Data in Analytics**
   - Verify source microservice availability
   - Check user permissions for accessing source data
   - Inspect service logs for collection errors

3. **Inconsistent Results**
   - Verify data consistency across source microservices
   - Check for cache invalidation issues
   - Examine data transformation logic
