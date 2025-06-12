# Wanzo Accounting AI Integration - Architecture & Implementation

## Overview

This document outlines the architecture and implementation for integrating AI-assisted accounting capabilities into the Wanzo backend system. The solution enables:

1. Creating accounting transactions from both manual entries and AI-assisted entries
2. Supporting multiple accounting standards (SYSCOHADA and IFRS)
3. Processing attached documents for automated data extraction
4. Coordinating data flow between mobile app, accounting service, and external AI processing

## Architecture Components

### 1. Core Services

- **Accounting Service**: Handles all accounting business logic
- **App Mobile Service**: Provides API endpoints for mobile app interactions
- **External Django AI Service**: Processes natural language and performs OCR on documents

### 2. Key Modules

- **AccountingAIService**: Orchestrates communication with the Django AI service
- **ChatAttachmentService**: Manages file uploads and processing
- **AccountStandardMappingService**: Manages mappings between different accounting standards
- **AccountingAIController**: Provides API endpoints for AI-assisted accounting

### 3. Data Flow

The system follows a well-defined flow for processing accounting queries:

1. **User Input**: Users submit queries through mobile app or web interface with optional attachments
2. **Context Collection**: System gathers relevant accounting context (accounts, recent journals, etc.)
3. **AI Processing**: External Django service processes the query with full context
4. **Transaction Creation**: AI-suggested journal entries are created based on confidence level
5. **Response Handling**: Results are formatted and returned to the appropriate client

## Implementation Details

### 1. Accounting Standards Support

The system supports both SYSCOHADA and IFRS accounting standards through:

- Account standard mapping entity to track equivalent accounts across standards
- Report generation with standard-specific formatting
- AI context awareness of the active accounting standard

```typescript
export enum AccountingStandard {
  SYSCOHADA = 'SYSCOHADA',
  IFRS = 'IFRS'
}

@Entity('account_standard_mappings')
export class AccountStandardMapping {
  @Column()
  accountId!: string;

  @Column({
    type: 'enum',
    enum: AccountingStandard,
  })
  standard!: AccountingStandard;

  @Column()
  standardAccountCode!: string;
}
```

### 2. Document Processing

The system handles documents through:

- Multi-part form uploads from both mobile and web clients
- Document storage in a structured file hierarchy
- Base64 encoding for transfer to AI service
- OCR processing for data extraction from receipts, invoices, etc.

```typescript
@Entity('chat_attachments')
export class ChatAttachment {
  @Column()
  fileName!: string;

  @Column()
  mimeType!: string;

  @Column()
  filePath!: string;

  @Column({
    type: 'enum',
    enum: AttachmentStatus,
    default: AttachmentStatus.PENDING
  })
  status!: AttachmentStatus;

  @Column('jsonb', { nullable: true })
  extractedData?: Record<string, any>;
}
```

### 3. AI Integration

The AI integration is built on:

- RESTful API communication with Django service
- Comprehensive context preparation including accounting standards
- Confidence scoring for journal entry suggestions
- Automated journal creation for high-confidence suggestions

```typescript
export interface AccountingAIRequestDto {
  message: string;
  contextData: {
    companyId: string;
    fiscalYear: string;
    accountingStandard: AccountingStandard;
    accounts: Array<{
      code: string;
      name: string;
      type: string;
    }>;
    recentJournals: Array<{
      type: string;
      description: string;
      amount: number;
    }>;
    attachments?: Array<{
      id: string;
      type: string;
      content: string; // Base64 encoded content
    }>;
  };
}
```

## API Endpoints

### Accounting AI Controller

| Endpoint | Method | Description |
|---------|--------|-------------|
| `/accounting-ai/:chatId/message` | POST | Send message with optional attachments for accounting assistance |
| `/accounting-ai/:chatId/apply-suggestion` | POST | Apply an AI-suggested journal entry |
| `/accounting-ai/:chatId/attachments` | GET | Retrieve attachments for a chat |

## Configuration

The system requires the following environment variables:

```
DJANGO_AI_SERVICE_URL=http://django-ai-service:8000
DJANGO_AI_SERVICE_API_KEY=your_api_key_here
UPLOAD_DIR=/path/to/uploads
```

## Deployment Considerations

1. **Database Migrations**: New entities require database migrations
2. **File Storage**: Ensure adequate storage for document attachments
3. **API Gateway Updates**: Update routes for new endpoints
4. **Django Service Setup**: Deploy the Django service with required ML models

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Role-based access control for accounting operations
3. **File Validation**: Strict validation of uploaded files
4. **API Keys**: Secure communication with Django service through API keys

## Future Enhancements

1. **Real-time Processing**: WebSockets for real-time updates on AI processing
2. **Enhanced OCR**: Improved document understanding for complex invoices
3. **Accounting Rules Engine**: More sophisticated rules for transaction validation
4. **User Feedback Loop**: Learning from user corrections to improve AI suggestions
