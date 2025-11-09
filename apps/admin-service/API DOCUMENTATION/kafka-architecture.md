# Kafka Integration Architecture: Admin Service

This document provides comprehensive documentation of the Kafka event-driven architecture that enables real-time data synchronization between the **customer-service** and **admin-service**. The admin service operates on synchronized data and provides administrative oversight capabilities.

## 🏗️ **Architecture Overview**

### **Event-Driven Data Flow**
```
┌─────────────────┐    Kafka Events    ┌─────────────────┐
│                 │ ════════════════► │                 │
│  Customer       │                   │  Admin          │
│  Service        │                   │  Service        │
│  (Source)       │ ◄════════════════ │  (Consumer)     │
│                 │   Admin Actions   │                 │
└─────────────────┘                   └─────────────────┘
```

### **Core Principles**
- **Customer-service is the source of truth** for all customer profile data
- **Admin-service consumes and synchronizes** data for administrative oversight
- **Bidirectional communication** enables admin actions to flow back to customer-service
- **Real-time synchronization** ensures data consistency across services
- **Event versioning (v2.1)** supports comprehensive profile data sharing

## 1. Events Consumed by Admin Service

### 1.1. Complete Profile Synchronization

#### `admin.customer.complete.profile.v2_1`
**Description:** Complete customer profile data with all v2.1 enhanced information
**Producer:** Customer Service (CustomerEventsProducer)
**Consumer:** Admin Service (CustomerProfileConsumer)
**Frequency:** On profile creation, major updates, or explicit sync requests

**Event Structure:**
```typescript
interface AdminCustomerCompleteProfileV21Event {
  // Base customer information
  customerId: string;
  customerType: 'COMPANY' | 'FINANCIAL_INSTITUTION';
  name: string;
  email: string;
  phone?: string;
  logo?: string;
  address?: string;
  status: string;
  accountType?: string;
  createdAt: string;
  updatedAt: string;
  dataVersion: '2.1';

  // Company-specific data (for PMEs)
  companySpecificData?: {
    legalForm: string;
    industry: string;
    size: string;
    rccm: string;
    taxId: string;
    natId: string;
    activities: any;
    capital: any;
    financials: any;
    affiliations: any;
    owner: any;
    associates: any[];
    locations: any[];
    yearFounded: number;
    employeeCount: number;
    contactPersons: any[];
    socialMedia: any;
  };

  // Institution-specific data (for Financial Institutions)
  institutionSpecificData?: {
    denominationSociale: string;
    sigleLegalAbrege: string;
    type: string;
    category: string;
    licenseNumber: string;
    establishedDate: string;
    typeInstitution: string;
    autorisationExploitation: string;
    dateOctroi: string;
    autoriteSupervision: string;
    dateAgrement: string;
    coordonneesGeographiques: any;
    regulatoryInfo: any;
    website: string;
    brandColors: any;
    facebookPage: string;
    linkedinPage: string;
    capitalStructure: any;
    branches: any[];
    contacts: any;
    leadership: any;
    services: any;
    financialInfo: any;
    digitalPresence: any;
    partnerships: any;
    certifications: any;
    creditRating: any;
    performanceMetrics: any;
  };

  // Extended identification data
  extendedIdentification?: {
    generalInfo: any;
    legalInfo: any;
    patrimonyAndMeans: any;
    specificities: any;
    performance: any;
    completionPercentage: number;
    isComplete: boolean;
    identification: any;
    lastIdentificationUpdate: string;
  };

  // Asset and stock information
  patrimoine?: {
    assets: any[];
    stocks: any[];
    totalAssetsValue: number;
    totalStockValue: number;
    lastUpdateDate: string;
  };

  // Profile completeness metrics
  profileCompleteness: {
    percentage: number;
    completedSections: string[];
    missingFields: string[];
  };

  // Compliance and regulatory data
  complianceData?: any;
  performanceMetrics?: any;
}
```

**Processing in Admin Service:**
1. **Data Validation**: Validate event structure and version compatibility
2. **Entity Creation/Update**: Update `CustomerDetailedProfile` entity
3. **Admin Field Initialization**: Set default admin status, compliance rating
4. **Completeness Calculation**: Calculate profile completeness percentage
5. **Indexing**: Update search indexes for admin queries
6. **Notification**: Trigger admin notifications if profile requires attention

### 1.2. Profile Update Notifications

#### `admin.customer.profile.updated`
**Description:** Notification of customer profile updates with change details
**Producer:** Customer Service (CustomerEventsProducer)
**Consumer:** Admin Service (CustomerProfileConsumer)
**Frequency:** On every significant profile change

**Event Structure:**
```typescript
interface AdminCustomerProfileUpdatedEvent {
  customerId: string;
  customerType: 'COMPANY' | 'FINANCIAL_INSTITUTION';
  updatedFields: string[];
  updateContext: {
    updatedBy?: string;
    updateSource: 'form_submission' | 'admin_action' | 'system_update';
    formType?: string;
  };
  timestamp: string;
}
```

**Processing in Admin Service:**
1. **Sync Trigger**: Mark profile for resynchronization
2. **Change Tracking**: Log changes for audit trail
3. **Admin Attention**: Flag profile if critical fields changed
4. **Completeness Recalculation**: Update profile completeness metrics

### 1.3. Status Change Events

#### `customer.status.changed`
**Description:** Customer status changes (active, suspended, etc.)
**Producer:** Customer Service
**Consumer:** Admin Service
**Processing:** Update admin view of customer status, trigger compliance checks

#### `customer.created`
**Description:** New customer registration
**Producer:** Customer Service
**Consumer:** Admin Service
**Processing:** Create initial admin profile entry, set default KYC status

#### `customer.deleted`
**Description:** Customer deletion (rare, usually archival)
**Producer:** Customer Service
**Consumer:** Admin Service
**Processing:** Archive admin profile, maintain audit trail

## 2. Events Produced by Admin Service

### 2.1. Admin Action Events

#### `customer.admin_action.validate`
**Description:** Admin validates a customer profile
**Producer:** Admin Service (AdminCustomerProfilesController)
**Consumer:** Customer Service
**Trigger:** Admin calls `/admin/customer-profiles/{customerId}/validate`

**Event Structure:**
```typescript
interface CustomerAdminActionValidateEvent {
  customerId: string;
  action: 'validate';
  adminId: string;
  adminName: string;
  validationDetails: {
    complianceRating: 'high' | 'medium' | 'low' | 'critical';
    adminNotes?: string;
    validatedFields: string[];
    validationDate: string;
  };
  timestamp: string;
}
```

#### `customer.admin_action.suspend`
**Description:** Admin suspends a customer profile
**Producer:** Admin Service
**Consumer:** Customer Service
**Trigger:** Admin calls `/admin/customer-profiles/{customerId}/suspend`

**Event Structure:**
```typescript
interface CustomerAdminActionSuspendEvent {
  customerId: string;
  action: 'suspend';
  adminId: string;
  adminName: string;
  suspensionDetails: {
    reason: string;
    suspensionType: 'temporary' | 'permanent';
    expectedResolution?: string;
    suspensionDate: string;
  };
  timestamp: string;
}
```

#### `customer.admin_action.reactivate`
**Description:** Admin reactivates a suspended customer profile
**Producer:** Admin Service
**Consumer:** Customer Service
**Trigger:** Admin calls `/admin/customer-profiles/{customerId}/reactivate`

**Event Structure:**
```typescript
interface CustomerAdminActionReactivateEvent {
  customerId: string;
  action: 'reactivate';
  adminId: string;
  adminName: string;
  reactivationDetails: {
    previousSuspensionReason: string;
    reactivationReason: string;
    reactivationDate: string;
  };
  timestamp: string;
}
```

### 2.2. Sync Request Events

#### `customer.sync.request`
**Description:** Admin requests immediate profile synchronization
**Producer:** Admin Service (CustomersService)
**Consumer:** Customer Service
**Trigger:** Manual sync requests or automated sync needs

**Event Structure:**
```typescript
interface CustomerSyncRequestEvent {
  customerId: string;
  requestedBy: string;
  requestId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requestedData: string[];
  timestamp: string;
}
```

## 3. Kafka Topics Configuration

### 3.1. Topic Naming Convention
```
Pattern: {target_service}.{entity}.{action}.{version?}

Examples:
- admin.customer.complete.profile.v2_1
- admin.customer.profile.updated
- customer.admin_action.validate
- customer.sync.request
```

### 3.2. Topic Partitioning Strategy
- **Partition Key**: `customerId` for customer-related events
- **Partition Count**: 3 partitions per topic for parallel processing
- **Replication Factor**: 3 for high availability
- **Retention Policy**: 7 days for operational events, 30 days for audit events

### 3.3. Consumer Groups
- **Admin Service Consumer Group**: `admin-service-customer-sync`
- **Customer Service Consumer Group**: `customer-service-admin-actions`

## 4. Data Synchronization Patterns

### 4.1. Initial Sync (Cold Start)
When admin-service starts or a new customer is created:
1. Customer-service publishes `admin.customer.complete.profile.v2_1`
2. Admin-service creates `CustomerDetailedProfile` entity
3. Default admin fields are initialized
4. Profile is marked as `needs_review` if incomplete

### 4.2. Incremental Updates (Hot Sync)
When customer data changes:
1. Customer-service publishes `admin.customer.profile.updated`
2. Admin-service updates relevant fields
3. Profile completeness is recalculated
4. Admin attention flags are updated if necessary

### 4.3. Admin Action Flow
When admin performs actions:
1. Admin action is processed locally in admin-service
2. Admin action event is published to customer-service
3. Customer-service processes admin action
4. Customer-service may publish update confirmation
5. Admin-service logs action completion

### 4.4. Conflict Resolution
In case of data conflicts:
1. **Customer-service is always the source of truth** for profile data
2. **Admin-service owns administrative fields** (adminStatus, complianceRating, etc.)
3. **Timestamps are used** to resolve concurrent updates
4. **Conflict events** are logged for manual review

## 5. Event Processing Architecture

### 5.1. Consumer Implementation
```typescript
@Controller()
export class CustomerProfileConsumer {
  @EventPattern('admin.customer.complete.profile.v2_1')
  async handleCompleteProfileSync(data: AdminCustomerCompleteProfileV21Event) {
    // Process complete profile synchronization
  }

  @EventPattern('admin.customer.profile.updated')
  async handleProfileUpdate(data: AdminCustomerProfileUpdatedEvent) {
    // Process incremental profile updates
  }

  @EventPattern('customer.status.changed')
  async handleStatusChange(data: CustomerStatusChangedEvent) {
    // Process customer status changes
  }
}
```

### 5.2. Producer Implementation
```typescript
@Injectable()
export class AdminEventsProducer {
  async emitCustomerValidated(customerId: string, adminId: string, details: any) {
    const event: CustomerAdminActionValidateEvent = {
      customerId,
      action: 'validate',
      adminId,
      validationDetails: details,
      timestamp: new Date().toISOString()
    };
    
    await this.kafkaClient.emit('customer.admin_action.validate', event);
  }
}
```

### 5.3. Error Handling & Retry Logic
- **Dead Letter Queue**: Failed events are sent to DLQ for manual investigation
- **Exponential Backoff**: Retry failed events with increasing delays
- **Circuit Breaker**: Prevent cascade failures during service outages
- **Idempotency**: All event handlers are idempotent to handle duplicate events

## 6. Data Entity Mapping

### 6.1. Customer Service → Admin Service
```typescript
// Customer Service Entity
Customer {
  id: string;
  name: string;
  email: string;
  // ... business fields
}

// Mapped to Admin Service Entity
CustomerDetailedProfile {
  id: string;
  customerId: string;  // References Customer.id
  name: string;
  email: string;
  // ... synchronized business fields
  
  // Admin-specific fields
  adminStatus: AdminStatus;
  complianceRating: ComplianceRating;
  adminNotes: string;
  riskFlags: string[];
  // ... admin fields
}
```

### 6.2. Field Ownership Matrix
| Field Category | Customer Service | Admin Service | Notes |
|---------------|------------------|---------------|-------|
| Basic Profile | ✅ Owner | 📥 Synced | Name, email, phone, address |
| Company Data | ✅ Owner | 📥 Synced | Legal info, structure, finances |
| Institution Data | ✅ Owner | 📥 Synced | Licenses, regulatory info |
| Admin Status | ❌ | ✅ Owner | adminStatus, complianceRating |
| KYC Notes | ❌ | ✅ Owner | adminNotes, riskFlags |
| Sync Metadata | 🔄 Shared | 🔄 Shared | lastSyncAt, needsResync |

## 7. Monitoring & Observability

### 7.1. Key Metrics
- **Event Processing Rate**: Events/second processed by consumers
- **Sync Latency**: Time between customer data change and admin sync
- **Failed Events**: Count of events sent to dead letter queue
- **Profile Completeness**: Distribution of profile completeness scores
- **Admin Actions**: Rate of admin validation/suspension actions

### 7.2. Health Checks
- **Kafka Connectivity**: Regular connectivity tests to Kafka brokers
- **Consumer Lag**: Monitor consumer group lag for each topic
- **Data Consistency**: Periodic validation of synchronized data
- **Event Schema Validation**: Ensure all events match expected schemas

### 7.3. Alerting
- **High Consumer Lag**: Alert when lag exceeds 1000 messages
- **Failed Event Threshold**: Alert when DLQ messages exceed 10
- **Sync Latency**: Alert when sync latency exceeds 5 minutes
- **Schema Violations**: Immediate alert for schema validation failures

## 8. Security & Compliance

### 8.1. Event Security
- **Message Encryption**: All Kafka messages encrypted in transit
- **Authentication**: SASL/SCRAM authentication for Kafka clients
- **Authorization**: ACLs restrict topic access by service
- **Audit Logging**: All events logged for compliance auditing

### 8.2. Data Privacy
- **PII Handling**: Personal data marked and handled according to regulations
- **Data Retention**: Events expired according to compliance requirements
- **Anonymization**: Sensitive data anonymized in non-production environments
- **Access Controls**: Role-based access to admin functions

## 9. Development & Testing

### 9.1. Local Development
- **Docker Compose**: Local Kafka cluster for development
- **Test Data**: Sample events for testing different scenarios
- **Event Simulation**: Tools to simulate customer service events

### 9.2. Testing Strategies
- **Unit Tests**: Test individual event handlers
- **Integration Tests**: Test end-to-end event flow
- **Contract Tests**: Validate event schemas between services
- **Chaos Testing**: Test resilience during failures

This Kafka architecture enables the admin service to provide comprehensive administrative oversight while maintaining clear data ownership boundaries and ensuring real-time data consistency across the platform.