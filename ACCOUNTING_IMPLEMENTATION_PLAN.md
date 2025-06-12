# ACCOUNTING BUSINESS LOGIC IMPLEMENTATION PLAN

## 1. DJANGO SERVICE INTEGRATION
- Create interface between accounting-service and external Django AI service
- Implement API endpoints for sending accounting data to AI model
- Handle responses from AI model and convert to accounting entries

### src/modules/external-ai/dtos/ai-accounting.dto.ts 

```typescript
export class AccountingAIRequestDto {
  message: string;              // User message
  contextData: {
    companyId: string;
    fiscalYear: string;
    accountingStandard: AccountingStandard;
    userId: string;
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

export class AccountingAIResponseDto {
  reply: string;                // Text reply for user
  suggestedEntries?: Array<{
    description: string;
    date: string;
    journalType: string;
    lines: Array<{
      accountCode: string;
      description: string;
      debit: number;
      credit: number;
    }>;
  }>;
  confidence: number;           // Confidence level of AI suggestion
  needsReview: boolean;         // Indicates if human review is recommended
}
```

## 2. ACCOUNTING STANDARDS SUPPORT
- Enhance account entity to support different standards
- Add mapping between standards
- Update reports generation

### src/modules/accounts/entities/account-standard-mapping.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './account.entity';
import { AccountingStandard } from '../../../common/enums/accounting.enum'; // Updated path

@Entity('account_standard_mappings')
export class AccountStandardMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({
    type: 'enum',
    enum: AccountingStandard,
  })
  standard: AccountingStandard;

  @Column()
  standardAccountCode: string;

  @Column()
  standardAccountName: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;
}
```

## 3. AI CONTEXT ENHANCEMENT
- Enhance context generation for accounting-specific AI interactions
- Include metadata about accounting standards

### src/modules/external-ai/accounting-ai.service.ts

```typescript
import { Injectable, HttpService } from '@nestjs/common';
import { AccountingAIRequestDto, AccountingAIResponseDto } from './dtos/ai-accounting.dto'; 
import { AccountingStandard } from '../../common/enums/accounting.enum';
import { ChatService } from '../chat/services/chat.service';
import { CompanyService } from '../../company/services/company.service';
import { JournalService } from '../../journals/services/journal.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AccountingAIService {
  private readonly djangoServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly chatService: ChatService,
    private readonly companyService: CompanyService,
    private readonly journalService: JournalService,
    private readonly configService: ConfigService,
  ) {
    this.djangoServiceUrl = this.configService.get<string>('DJANGO_AI_SERVICE_URL');
  }

  async processAccountingQuery(
    chatId: string,
    message: string,
    companyId: string,
    userId: string,
    attachments?: Array<{ id: string; type: string; content: string }>,
  ): Promise<AccountingAIResponseDto> {
    // Get company details including accounting standard preference
    const company = await this.companyService.findById(companyId);
    const accountingStandard = company.metadata?.accountingStandard || AccountingStandard.SYSCOHADA;
    
    // Get accounting context
    const context = await this.chatService.getAccountingContext(companyId);
    
    // Prepare request
    const aiRequest: AccountingAIRequestDto = {
      message,
      contextData: {
        companyId,
        fiscalYear: company.currentFiscalYear,
        accountingStandard,
        userId,
        accounts: context.accounts,
        recentJournals: context.recentJournals,
        attachments,
      },
    };
    
    try {
      // Send to Django AI service
      const response = await this.httpService.post(
        `${this.djangoServiceUrl}/api/accounting/process`,
        aiRequest,
      ).toPromise();
      
      return response.data;
    } catch (error) {
      console.error('Error communicating with Django AI service:', error);
      // Fallback response
      return {
        reply: 'Je suis désolé, je rencontre des difficultés à traiter votre demande comptable. Veuillez réessayer plus tard.',
        confidence: 0,
        needsReview: true,
      };
    }
  }

  async createJournalFromAISuggestion(
    suggestion: AccountingAIResponseDto['suggestedEntries'][0],
    companyId: string,
    userId: string,
  ) {
    if (!suggestion) return null;

    // Convert AI suggestion to journal entry format
    const journalDto = {
      date: new Date(suggestion.date),
      description: suggestion.description,
      journalType: suggestion.journalType,
      companyId,
      lines: suggestion.lines.map(line => ({
        accountCode: line.accountCode,
        description: line.description,
        debit: line.debit,
        credit: line.credit,
      })),
    };

    // Create journal entry
    return await this.journalService.create(journalDto, userId);
  }
}
```

## 4. FILE ATTACHMENT HANDLING
- Create mechanism for handling file attachments
- Process file contents for AI context

### src/modules/chat/services/chat-attachment.service.ts

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatAttachment } from '../entities/chat-attachment.entity';
import { FileService } from '../../files/services/file.service';

@Injectable()
export class ChatAttachmentService {
  constructor(
    @InjectRepository(ChatAttachment)
    private attachmentRepository: Repository<ChatAttachment>,
    private fileService: FileService,
  ) {}

  async saveAttachment(
    chatId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<ChatAttachment> {
    // Save file to storage
    const fileInfo = await this.fileService.saveFile(file, 'chat-attachments');
    
    // Create attachment record
    const attachment = this.attachmentRepository.create({
      chatId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath: fileInfo.path,
      uploadedBy: userId,
    });
    
    return await this.attachmentRepository.save(attachment);
  }

  async getAttachmentsForMessage(messageId: string): Promise<ChatAttachment[]> {
    return await this.attachmentRepository.find({
      where: { messageId },
    });
  }

  async processAttachmentForAI(attachmentId: string): Promise<{ type: string; content: string }> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId },
    });
    
    if (!attachment) {
      throw new Error(`Attachment with ID ${attachmentId} not found`);
    }
    
    // Read file content
    const content = await this.fileService.readFileAsBase64(attachment.filePath);
    
    // Determine type based on mimetype
    let type = 'unknown';
    if (attachment.mimeType.startsWith('image/')) {
      type = 'image';
    } else if (attachment.mimeType === 'application/pdf') {
      type = 'pdf';
    } else if (
      attachment.mimeType === 'application/vnd.ms-excel' ||
      attachment.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      type = 'spreadsheet';
    }
    
    return { type, content };
  }
}
```

## 5. CONTROLLER IMPLEMENTATION
- Enhance existing chat controller with AI accounting features

### src/modules/chat/controllers/accounting-ai.controller.ts

```typescript
import { Controller, Post, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AccountingAIService } from '../services/accounting-ai.service';
import { ChatAttachmentService } from '../services/chat-attachment.service';
import { JournalService } from '../../journals/services/journal.service';

@ApiTags('accounting-ai')
@Controller('accounting-ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AccountingAIController {
  constructor(
    private readonly accountingAIService: AccountingAIService,
    private readonly chatAttachmentService: ChatAttachmentService,
    private readonly journalService: JournalService,
  ) {}

  @Post(':chatId/query')
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Process accounting query with AI' })
  @UseInterceptors(FilesInterceptor('attachments', 5))
  @ApiResponse({ status: 201, description: 'Query processed successfully' })
  async processAccountingQuery(
    @Param('chatId') chatId: string,
    @Body('message') message: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    // Save attachments
    const attachments = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const attachment = await this.chatAttachmentService.saveAttachment(
          chatId,
          file,
          req.user.id,
        );
        
        // Process for AI
        const processedAttachment = await this.chatAttachmentService.processAttachmentForAI(
          attachment.id,
        );
        
        attachments.push({
          id: attachment.id,
          ...processedAttachment,
        });
      }
    }
    
    // Process query with AI
    const aiResponse = await this.accountingAIService.processAccountingQuery(
      chatId,
      message,
      req.user.companyId,
      req.user.id,
      attachments,
    );
    
    // Create journal entries if suggested
    const createdJournals = [];
    if (aiResponse.suggestedEntries && aiResponse.suggestedEntries.length > 0) {
      for (const suggestion of aiResponse.suggestedEntries) {
        const journal = await this.accountingAIService.createJournalFromAISuggestion(
          suggestion,
          req.user.companyId,
          req.user.id,
        );
        if (journal) {
          createdJournals.push(journal);
        }
      }
    }
    
    return {
      success: true,
      aiResponse,
      createdJournals,
    };
  }

  @Post(':chatId/apply-suggestion')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Apply AI suggested journal entry' })
  @ApiResponse({ status: 201, description: 'Journal entry created successfully' })
  async applySuggestedEntry(
    @Param('chatId') chatId: string,
    @Body('suggestion') suggestion: any,
    @Req() req: any,
  ) {
    const journal = await this.accountingAIService.createJournalFromAISuggestion(
      suggestion,
      req.user.companyId,
      req.user.id,
    );
    
    return {
      success: true,
      journal,
    };
  }
}
```

## Additional Notes

1. **HttpService**: In NestJS v8+, HttpService has been moved to `@nestjs/axios` package. Make sure to update the imports accordingly when implementing.

2. **Accounting Standards**: The `AccountingStandard` enum has been moved to `src/common/enums/accounting.enum.ts`. This plan reflects the new location.

3. **Error Handling**: Implement more robust error handling and logging when communicating with external services.

4. **File Processing**: Consider adding a queue system for processing large files to avoid blocking the request-response cycle.

5. **TypeORM Entities**: Ensure all entity properties have proper types and validations.

6. **Testing**: Create comprehensive unit and integration tests for all components.
