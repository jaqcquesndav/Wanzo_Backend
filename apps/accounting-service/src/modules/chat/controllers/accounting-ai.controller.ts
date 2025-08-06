import { Controller, Post, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Req, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AccountingAIService } from '../../external-ai/accounting-ai.service';
import { ChatService } from '../services/chat.service';
import { ChatAttachmentService } from '../services/chat-attachment.service';
import { CreateMessageDto } from '../dtos/chat.dto';
import { MessageRole, ChatMessage } from '../entities/chat-message.entity';
import { AISingleAttachmentDto } from '../../external-ai/dtos/ai-accounting.dto';

@ApiTags('accounting-ai')
@Controller('accounting-ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AccountingAIController {  constructor(
    private readonly accountingAIService: AccountingAIService,
    private readonly chatService: ChatService,
    private readonly chatAttachmentService: ChatAttachmentService,
    private readonly logger: Logger = new Logger(AccountingAIController.name),
  ) {}

  @Post(':chatId/message')
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Send message to AI for accounting assistance' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'The message to send to the AI' },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Any files to attach to the message (invoices, receipts, etc.)',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 5, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  }))
  @ApiResponse({ status: 201, description: 'Message processed successfully' })
  async sendMessageWithAttachments(
    @Param('chatId') chatId: string,
    @Body('message') message: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {    // Save user message
    const messageDto: CreateMessageDto = {
      content: message,
      role: MessageRole.USER,
    };
    
    const savedMessage = await this.chatService.addMessage(chatId, messageDto, req.user.id);
    
    // Save attachments if any
    const attachments: AISingleAttachmentDto[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const attachment = await this.chatAttachmentService.saveAttachment(
          chatId, // Correct
          savedMessage.id, // Correct: messageId
          file, // Correct: file object
          req.user.id, // Correct: uploadedByUserId
          req.user.companyId, // Correct: companyId
        );
        // Process for AI
        try {
          const processedAttachment = await this.chatAttachmentService.processAttachmentForAI(
            attachment.id,
            req.user.companyId, // Added companyId
          );
          attachments.push(processedAttachment);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Failed to process attachment: ${errorMessage}`);
          // Continue with other attachments
        }
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
      // Save AI response as a message
    const aiMessageDto: CreateMessageDto = {
      content: aiResponse.reply,
      role: MessageRole.ASSISTANT,
      metadata: {
        confidence: aiResponse.confidence,
        needsReview: aiResponse.needsReview,
        suggestions: aiResponse.suggestions, // Changed to suggestions
      },
    };
    
    const aiMessage = await this.chatService.addMessage(chatId, aiMessageDto, req.user.id);
      // Create journal entries if suggested and confidence is high
    const createdJournals: any[] = [];
    if (
      aiResponse.suggestions && // Changed to suggestions
      aiResponse.suggestions.length > 0 && // Changed to suggestions
      aiResponse.confidence > 0.8 &&
      !aiResponse.needsReview
    ) {
      for (const suggestion of aiResponse.suggestions) { // Changed to suggestions
        const journal = await this.accountingAIService.createJournalFromAISuggestion(
          suggestion,
          req.user.companyId,
          req.user.id,
          // req.user.currentFiscalYear, // Removed currentFiscalYear
        );
        if (journal) {
          createdJournals.push(journal);
        }
      }
    }
    
    return {
      success: true,
      message: aiMessage,
      suggestedEntries: aiResponse.suggestions, // Changed to suggestions
      autoCreatedJournals: createdJournals,
    };
  }

  @Post(':chatId/apply-suggestion')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Apply AI suggested journal entry' })
  @ApiResponse({ status: 201, description: 'Journal entry created successfully' })
  async applySuggestedEntry(
    @Param('chatId') chatId: string,
    @Body('suggestionIndex') suggestionIndex: number,
    @Body('messageId') messageId: string,
    @Req() req: any,
  ) {    // Get the message to extract the suggestion
    const message = await this.chatService.findMessageById(messageId);
    
    if (!message || !message.metadata?.suggestions || !message.metadata.suggestions[suggestionIndex]) { // Changed to suggestions
      return {
        success: false,
        message: 'Suggested entry not found',
      };
    }
    
    const suggestion = message.metadata.suggestions[suggestionIndex]; // Changed to suggestions
    
    // Create journal entry
    const journal = await this.accountingAIService.createJournalFromAISuggestion(
      suggestion,
      req.user.companyId,
      req.user.id,
      // req.user.currentFiscalYear, // Removed currentFiscalYear
    );
    
    if (!journal) {
      return {
        success: false,
        message: 'Failed to create journal entry',
      };
    }
      // Update message metadata to mark suggestion as applied
    if (!message.metadata) {
      message.metadata = {};
    }
    
    if (!message.metadata.appliedSuggestions) {
      message.metadata.appliedSuggestions = [];
    }
    
    message.metadata.appliedSuggestions.push({
      index: suggestionIndex,
      journalId: journal.id,
      appliedAt: new Date(),
      appliedBy: req.user.id,
    });
    
    await this.chatService.updateMessage(message);
    
    return {
      success: true,
      journal,
      message: 'Journal entry created successfully',
    };
  }

  @Get(':chatId/attachments')
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Get attachments for a chat' })
  @ApiResponse({ status: 200, description: 'Attachments retrieved successfully' })
  async getChatAttachments(
    @Param('chatId') chatId: string,
    @Query('messageId') messageId?: string,
    @Req() req?: any, // Added req
  ) {
    let attachments;
    
    if (messageId) {
      attachments = await this.chatAttachmentService.getAttachmentsForMessage(messageId, req.user.companyId); // Added companyId
    } else {
      // Assuming getAttachmentsByChatId exists or will be created in ChatAttachmentService
      // This method should fetch all attachments for a given chatId and companyId.
      attachments = await this.chatAttachmentService.getAttachmentsByChatId(chatId, req.user.companyId); // Changed method and added companyId
    }
    
    return {
      success: true,
      attachments,
    };
  }
}
