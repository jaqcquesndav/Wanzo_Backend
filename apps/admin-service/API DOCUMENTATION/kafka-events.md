# 📚 API KAFKA - DOCUMENTATION COMPLÈTE

Cette documentation décrit tous les événements Kafka utilisés dans l'écosystème Wanzo Backend, leurs structures de données, exemples d'utilisation et relations entre services.

## 🎯 Vue d'Ensemble

L'architecture événementielle de Wanzo Backend utilise Apache Kafka pour la communication asynchrone entre microservices, permettant :

## Overview

The Admin Service uses Apache Kafka for asynchronous, event-driven communication with other microservices in the Wanzo platform. This enables:

- **Decoupled architecture**: Services communicate without direct dependencies
- **Event sourcing**: All significant state changes are recorded as events
- **Scalability**: Asynchronous processing handles high volumes
- **Reliability**: Event replay and guaranteed delivery
- **Audit trail**: Complete history of system events

**Kafka Configuration:**
- Bootstrap servers: `localhost:9092`
- Client ID: `admin-service`
- Consumer Group ID: `admin-service-group`
- Auto-commit: `true`
- Retry policy: 3 attempts with exponential backoff

---

## 1. Events Emitted by Admin Service

The Admin Service publishes events to notify other services about important state changes.

### 1.1. Subscription Events

#### subscription.created
**Description:** Emitted when a new subscription is created

**Event Pattern:** `subscription.created`

**Payload:**
```typescript
{
  eventId: string;              // Unique event identifier
  timestamp: string;            // ISO 8601 timestamp
  eventType: 'subscription.created';
  data: {
    subscriptionId: string;
    customerId: string;
    planId: string;
    planName: string;
    startDate: string;
    endDate?: string;
    amount: number;
    currency: string;
    billingCycle: 'monthly' | 'annually' | 'quarterly' | 'biennially' | 'one_time';
    status: 'active' | 'trial' | 'pending_activation';
    tokensIncluded: number;
    autoRenew: boolean;
    trialEndsAt?: string;
    metadata?: Record<string, any>;
  };
  actor: {
    userId: string;
    userName: string;
    role: string;
  };
}
```

**Example:**
```json
{
  "eventId": "evt_abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "eventType": "subscription.created",
  "data": {
    "subscriptionId": "sub_789",
    "customerId": "cust_abc",
    "planId": "plan_premium",
    "planName": "Premium Plan",
    "startDate": "2024-01-15T00:00:00Z",
    "amount": 99.99,
    "currency": "USD",
    "billingCycle": "monthly",
    "status": "active",
    "tokensIncluded": 10000,
    "autoRenew": true
  },
  "actor": {
    "userId": "admin_123",
    "userName": "John Admin",
    "role": "SUPER_ADMIN"
  }
}
```

**Consumers:** Customer Service, Analytics Service, Notification Service

---

#### subscription.updated
**Description:** Emitted when a subscription is modified

**Event Pattern:** `subscription.updated`

**Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'subscription.updated';
  data: {
    subscriptionId: string;
    customerId: string;
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
    updatedFields: string[];
  };
  actor: {
    userId: string;
    userName: string;
    role: string;
  };
}
```

**Example:**
```json
{
  "eventId": "evt_def456",
  "timestamp": "2024-01-16T14:20:00Z",
  "eventType": "subscription.updated",
  "data": {
    "subscriptionId": "sub_789",
    "customerId": "cust_abc",
    "changes": [
      {
        "field": "autoRenew",
        "oldValue": true,
        "newValue": false
      }
    ],
    "updatedFields": ["autoRenew"]
  },
  "actor": {
    "userId": "admin_123",
    "userName": "John Admin",
    "role": "SUPER_ADMIN"
  }
}
```

**Consumers:** Customer Service, Analytics Service, Billing Service

---

#### subscription.cancelled
**Description:** Emitted when a subscription is cancelled

**Event Pattern:** `subscription.cancelled`

**Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'subscription.cancelled';
  data: {
    subscriptionId: string;
    customerId: string;
    planId: string;
    reason: string;
    cancelledAt: string;
    effectiveEndDate: string;
    refundAmount?: number;
  };
  actor: {
    userId: string;
    userName: string;
    role: string;
  };
}
```

**Consumers:** Customer Service, Accounting Service, Notification Service

---

#### subscription.expired
**Description:** Emitted when a subscription expires

**Event Pattern:** `subscription.expired`

**Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'subscription.expired';
  data: {
    subscriptionId: string;
    customerId: string;
    planId: string;
    expiredAt: string;
    autoRenewal: boolean;
    reason: 'end_of_term' | 'payment_failed' | 'cancelled';
  };
  actor: {
    userId: 'system';
    userName: 'System';
    role: 'SYSTEM';
  };
}
```

**Consumers:** Customer Service, Notification Service

---

#### subscription.renewed
**Description:** Emitted when a subscription is successfully renewed

**Event Pattern:** `subscription.renewed`

**Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'subscription.renewed';
  data: {
    subscriptionId: string;
    customerId: string;
    planId: string;
    newPeriodStart: string;
    newPeriodEnd: string;
    amount: number;
    currency: string;
    tokensIncluded: number;
    invoiceId?: string;
  };
  actor: {
    userId: 'system';
    userName: 'System';
    role: 'SYSTEM';
  };
}
```

**Consumers:** Customer Service, Accounting Service, Analytics Service

---

#### subscription.plan_changed
**Description:** Emitted when a customer changes subscription plans

**Event Pattern:** `subscription.plan_changed`

**Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'subscription.plan_changed';
  data: {
    subscriptionId: string;
    customerId: string;
    oldPlanId: string;
    oldPlanName: string;
    newPlanId: string;
    newPlanName: string;
    oldAmount: number;
    newAmount: number;
    effectiveDate: string;
    prorationAmount?: number;
  };
  actor: {
    userId: string;
    userName: string;
    role: string;
  };
}
```

**Consumers:** Customer Service, Accounting Service, Analytics Service

---

#### subscription.status_changed
**Description:** Emitted when subscription status changes

**Event Pattern:** `subscription.status_changed`

**Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'subscription.status_changed';
  data: {
    subscriptionId: string;
    customerId: string;
    oldStatus: string;
    newStatus: string;
    reason?: string;
    changedAt: string;
  };
  actor: {
    userId: string;
    userName: string;
    role: string;
  };
}
```

**Consumers:** Customer Service, Analytics Service, Notification Service

---

## 2. Events Consumed by Admin Service

The Admin Service listens to events from other microservices to trigger automated workflows and maintain system consistency.

### 2.1. Customer Validation Events

#### customer.validation.requested
**Description:** Triggered when a customer requests validation

**Event Pattern:** `customer.validation.requested`

**Expected Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'customer.validation.requested';
  data: {
    customerId: string;
    customerName: string;
    customerType: 'pme' | 'financial';
    documents: Array<{
      type: string;
      fileUrl: string;
      uploadedAt: string;
    }>;
    requestedBy: string;
    urgency: 'low' | 'normal' | 'high';
  };
}
```

**Handler Action:**
1. Retrieve customer details from Customer Service
2. Verify all required documents are uploaded
3. Perform automated validation checks
4. If all checks pass, auto-validate customer
5. If manual review needed, notify admin team
6. Log validation attempt in system

**Response Event:** `customer.validation.completed` or `customer.validation.failed`

---

### 2.2. Accounting Events

#### accounting.invoice.generation.requested
**Description:** Request to generate an invoice for a customer

**Event Pattern:** `accounting.invoice.generation.requested`

**Expected Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'accounting.invoice.generation.requested';
  data: {
    customerId: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    dueDate: string;
    description?: string;
    items?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
  };
}
```

**Handler Action:**
1. Validate customer exists and is active
2. Create invoice in Finance Service with proper items
3. If subscription-related, link to subscription
4. Generate invoice number
5. Emit `invoice.created` event
6. Send invoice notification to customer

---

### 2.3. Token Management Events

#### token.low.alert
**Description:** Alert when customer token balance is low

**Event Pattern:** `token.low.alert`

**Expected Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'token.low.alert';
  data: {
    customerId: string;
    customerName: string;
    currentBalance: number;
    threshold: number;
    tokenType: string;
    subscriptionId?: string;
  };
}
```

**Handler Action:**
1. Log alert in system
2. Check if customer has auto-reload enabled
3. If yes, trigger token allocation
4. Send notification to customer
5. Alert admin team for potential upgrade opportunity
6. Update customer engagement metrics

---

### 2.4. Payment Events

#### subscription.payment.failed
**Description:** Notification that subscription payment failed

**Event Pattern:** `subscription.payment.failed`

**Expected Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'subscription.payment.failed';
  data: {
    subscriptionId: string;
    customerId: string;
    amount: number;
    currency: string;
    attemptNumber: number;
    maxAttempts: number;
    reason: string;
    nextAttemptDate?: string;
  };
}
```

**Handler Action:**
1. Update subscription status to `payment_failed`
2. If max attempts reached, change status to `suspended`
3. Send payment failure notification to customer
4. Create dunning task for admin team
5. If critical customer, escalate to account manager
6. Log payment failure in analytics

---

#### subscription.renewal.due
**Description:** Notification that subscription renewal is approaching

**Event Pattern:** `subscription.renewal.due`

**Expected Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'subscription.renewal.due';
  data: {
    subscriptionId: string;
    customerId: string;
    planId: string;
    currentPeriodEnd: string;
    renewalDate: string;
    amount: number;
    currency: string;
    autoRenew: boolean;
  };
}
```

**Handler Action:**
1. Verify customer payment method is valid
2. If autoRenew is true:
   - Generate renewal invoice
   - Process payment if auto-payment enabled
   - Extend subscription period
   - Emit `subscription.renewed` event
3. If autoRenew is false:
   - Send renewal reminder to customer
   - Create renewal task for admin team
4. Update subscription analytics

---

### 2.5. Security Events

#### user.activity.suspicious
**Description:** Alert for suspicious user activity detected

**Event Pattern:** `user.activity.suspicious`

**Expected Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'user.activity.suspicious';
  data: {
    userId: string;
    customerId: string;
    activityType: string;
    suspicionLevel: 'low' | 'medium' | 'high' | 'critical';
    details: {
      ipAddress?: string;
      location?: string;
      action?: string;
      frequency?: number;
    };
    detectedAt: string;
  };
}
```

**Handler Action:**
1. Log security event in audit trail
2. If suspicionLevel is 'high' or 'critical':
   - Suspend user account immediately
   - Notify security team
   - Send security alert to customer admin
3. If suspicionLevel is 'low' or 'medium':
   - Flag for manual review
   - Monitor user closely
4. Update security metrics

---

### 2.6. System Health Events

#### system.health.critical
**Description:** Critical system health issue detected

**Event Pattern:** `system.health.critical`

**Expected Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'system.health.critical';
  data: {
    service: string;
    component: string;
    severity: 'warning' | 'error' | 'critical';
    message: string;
    metrics: {
      cpu?: number;
      memory?: number;
      disk?: number;
      responseTime?: number;
    };
    affectedUsers?: number;
  };
}
```

**Handler Action:**
1. Log critical alert in system
2. Notify on-call engineer via PagerDuty/Slack
3. Send alert to SUPER_ADMIN and CTO roles
4. If service is down, activate maintenance mode
5. Update system status page
6. Create incident ticket

---

### 2.7. Compliance Events

#### compliance.check.required
**Description:** Compliance check required for customer or transaction

**Event Pattern:** `compliance.check.required`

**Expected Payload:**
```typescript
{
  eventId: string;
  timestamp: string;
  eventType: 'compliance.check.required';
  data: {
    entityType: 'customer' | 'transaction' | 'subscription';
    entityId: string;
    checkType: 'kyc' | 'aml' | 'sanctions' | 'tax' | 'regulatory';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    metadata?: Record<string, any>;
  };
}
```

**Handler Action:**
1. Retrieve entity details
2. Run automated compliance checks
3. If checks pass, emit `compliance.check.completed`
4. If manual review needed, create compliance task
5. Notify compliance team
6. Update compliance status in database
7. Log compliance check in audit trail

---

## 3. Event Handling Patterns

### 3.1. Event Processing Flow

```typescript
@Controller()
export class AdminEventsController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly financeService: FinanceService,
    private readonly eventsService: EventsService,
    private readonly logger: Logger,
  ) {}

  @EventPattern('customer.validation.requested')
  async handleCustomerValidationRequest(@Payload() message: any) {
    try {
      this.logger.log(`Handling customer validation request: ${message.value}`);
      const data = JSON.parse(message.value);
      
      // Retrieve customer
      const customer = await this.customersService.findOne(data.customerId);
      
      // Perform validation logic
      const validationResult = await this.validateCustomer(customer, data.documents);
      
      if (validationResult.approved) {
        await this.customersService.validate(data.customerId);
        this.logger.log(`Customer ${data.customerId} validated successfully`);
      } else {
        this.logger.warn(`Customer ${data.customerId} requires manual review`);
      }
    } catch (error) {
      this.logger.error(`Error handling customer validation: ${error.message}`);
    }
  }
}
```

### 3.2. Error Handling

All event handlers implement robust error handling:

1. **Try-catch blocks**: Wrap all event processing logic
2. **Logging**: Log all events, successes, and errors
3. **Dead letter queue**: Failed events are moved to DLQ after max retries
4. **Alerting**: Critical errors trigger admin alerts
5. **Graceful degradation**: System continues operating even if event processing fails

### 3.3. Idempotency

Event handlers are designed to be idempotent:

- Check if event has already been processed (using `eventId`)
- Store processed event IDs in cache/database
- Skip processing if event was already handled
- Prevents duplicate operations from replayed events

---

## 4. Event Monitoring & Debugging

### 4.1. Event Logging

All events are logged with:
- Event ID
- Timestamp
- Event type
- Payload (sanitized)
- Processing result
- Processing time

### 4.2. Metrics Tracked

- Events emitted per type (counter)
- Events consumed per type (counter)
- Event processing time (histogram)
- Event processing errors (counter)
- Event lag (gauge)
- Consumer group lag (gauge)

### 4.3. Debugging Tools

**View recent events:**
```bash
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic subscription.created \
  --from-beginning \
  --max-messages 10
```

**Monitor consumer group lag:**
```bash
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group admin-service-group \
  --describe
```

**Reset consumer offset (dev only):**
```bash
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group admin-service-group \
  --topic subscription.created \
  --reset-offsets --to-earliest \
  --execute
```

---

## 5. Best Practices

1. **Always validate event payload** before processing
2. **Use structured logging** with correlation IDs
3. **Implement circuit breakers** for external service calls
4. **Keep event handlers lightweight** - delegate heavy processing to queues
5. **Version your events** to handle schema evolution
6. **Test event handlers** with unit and integration tests
7. **Monitor event processing metrics** to detect issues early
8. **Document all event contracts** to prevent breaking changes
9. **Use event replay** for debugging and recovery
10. **Implement proper error handling** and alerting

---

## 6. Event Schema Versioning

Events follow semantic versioning:

```typescript
{
  eventVersion: '1.0.0',
  eventType: 'subscription.created',
  // ... rest of event
}
```

**Version Changes:**
- **Major (1.x.x → 2.x.x)**: Breaking changes to event structure
- **Minor (x.1.x → x.2.x)**: New fields added (backwards compatible)
- **Patch (x.x.1 → x.x.2)**: Bug fixes, no schema changes

---

## 7. Security Considerations

1. **Event payload encryption**: Sensitive data is encrypted before publishing
2. **Access control**: Only authorized services can publish/consume events
3. **Audit trail**: All event processing is logged for compliance
4. **Data retention**: Events are retained per compliance requirements
5. **PII handling**: Personal data is anonymized where possible

---

## 8. Performance Optimization

1. **Batch processing**: Events are processed in batches when possible
2. **Parallel consumption**: Multiple consumer instances for high throughput
3. **Message compression**: Events are compressed to reduce network overhead
4. **Partition strategy**: Events are partitioned by customer ID for better distribution
5. **Connection pooling**: Reuse Kafka connections to reduce overhead

---

## 9. Testing Events

### Unit Test Example
```typescript
describe('AdminEventsController', () => {
  it('should handle customer validation request', async () => {
    const mockEvent = {
      value: JSON.stringify({
        customerId: 'cust_123',
        documents: [{ type: 'rccm', fileUrl: '...' }]
      })
    };
    
    await controller.handleCustomerValidationRequest(mockEvent);
    
    expect(customersService.validate).toHaveBeenCalledWith('cust_123');
  });
});
```

### Integration Test Example
```typescript
describe('Kafka Integration', () => {
  it('should emit and consume subscription.created event', async () => {
    // Emit event
    await eventsService.publishSubscriptionCreated({
      subscriptionId: 'sub_123',
      customerId: 'cust_abc',
      // ...
    });
    
    // Wait for event to be consumed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify event was processed
    const subscription = await financeService.findById('sub_123');
    expect(subscription).toBeDefined();
  });
});
```

---

## 10. Troubleshooting

### Common Issues

**Event not being consumed:**
- Check consumer group status: `kafka-consumer-groups --describe`
- Verify topic exists: `kafka-topics --list`
- Check consumer logs for errors
- Verify Kafka connection string

**Event processing slow:**
- Check consumer lag: `kafka-consumer-groups --describe`
- Increase number of consumer instances
- Optimize event handler logic
- Check database query performance

**Duplicate event processing:**
- Verify idempotency implementation
- Check event ID storage
- Review consumer offset management
- Ensure proper transaction handling

**Event payload errors:**
- Validate event schema
- Check event versioning
- Review serialization/deserialization
- Verify JSON parsing logic

---

## Appendix: Complete Event List

### Emitted Events (35)

**User Events (6)**
1. `user.created` - UserEventTopics.USER_CREATED
2. `user.updated` - UserEventTopics.USER_UPDATED
3. `user.deleted` - UserEventTopics.USER_DELETED
4. `user.status.changed` - UserEventTopics.USER_STATUS_CHANGED
5. `user.role.changed` - UserEventTopics.USER_ROLE_CHANGED
6. `user.password.reset` - UserEventTopics.USER_PASSWORD_RESET

**Customer Events (7)**
7. `customer.created` - CustomerEventTopics.CUSTOMER_CREATED
8. `customer.updated` - CustomerEventTopics.CUSTOMER_UPDATED
9. `customer.deleted` - CustomerEventTopics.CUSTOMER_DELETED
10. `customer.status.changed` - CustomerEventTopics.CUSTOMER_STATUS_CHANGED
11. `customer.validated` - CustomerEventTopics.CUSTOMER_VALIDATED
12. `customer.suspended` - CustomerEventTopics.CUSTOMER_SUSPENDED
13. `customer.reactivated` - CustomerEventTopics.CUSTOMER_REACTIVATED

**Finance Events (3)**
14. `invoice.created` - FinanceEventTopics.INVOICE_CREATED
15. `invoice.status.changed` - FinanceEventTopics.INVOICE_STATUS_CHANGED
16. `payment.received` - FinanceEventTopics.PAYMENT_RECEIVED

**Subscription Events (7)**
17. `subscription.created` - SubscriptionEventTopics.SUBSCRIPTION_CREATED
18. `subscription.updated` - SubscriptionEventTopics.SUBSCRIPTION_UPDATED
19. `subscription.cancelled` - SubscriptionEventTopics.SUBSCRIPTION_CANCELLED
20. `subscription.expired` - SubscriptionEventTopics.SUBSCRIPTION_EXPIRED
21. `subscription.renewed` - SubscriptionEventTopics.SUBSCRIPTION_RENEWED
22. `subscription.plan.changed` - SubscriptionEventTopics.SUBSCRIPTION_PLAN_CHANGED
23. `subscription.status.changed` - SubscriptionEventTopics.SUBSCRIPTION_STATUS_CHANGED

**Token Events (4)**
24. `token.purchase` - TokenEventTopics.TOKEN_PURCHASE
25. `token.usage` - TokenEventTopics.TOKEN_USAGE
26. `token.allocated` - TokenEventTopics.TOKEN_ALLOCATED
27. `token.alert` - TokenEventTopics.TOKEN_ALERT

**Document Events (3)**
28. `document.uploaded` - DocumentEventTopics.DOCUMENT_UPLOADED
29. `document.deleted` - DocumentEventTopics.DOCUMENT_DELETED
30. `document.analysis.completed` - DocumentEventTopics.DOCUMENT_ANALYSIS_COMPLETED

**Institution Events (3)**
31. `institution.created` - InstitutionEventTopics.INSTITUTION_CREATED
32. `institution.profile.updated` - InstitutionEventTopics.INSTITUTION_PROFILE_UPDATED
33. `institution.status.changed` - InstitutionEventTopics.INSTITUTION_STATUS_CHANGED

### Consumed Events (8)
1. `customer.validation.requested` - Triggers customer validation workflow
2. `accounting.invoice.generation.requested` - Generates invoices
3. `token.low.alert` - Handles low token balance alerts
4. `subscription.payment.failed` - Updates subscription on payment failure
5. `token.adjustment.requested` - Adjusts customer token balance
6. `subscription.plan.change.requested` - Handles plan change requests
7. `subscription.renewal.due` - Processes subscription renewals
8. `subscription.expiring.soon` - Sends expiration notifications

**Total Events: 43** (35 emitted, 8 consumed)

**Note:** All emitted events use topic constants from `@wanzobe/shared` package for consistency across microservices.
