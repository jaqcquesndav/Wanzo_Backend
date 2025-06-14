import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { CreateChatDto, CreateMessageDto, ChatFilterDto } from '../dtos/chat.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AccountingStandard } from '../../../common/enums/accounting.enum';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Create new chat session' })
  @ApiResponse({ status: 201, description: 'Chat session created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createChatDto: CreateChatDto, @Req() req: any) {
    const chat = await this.chatService.create(createChatDto, req.user.id);
    return {
      success: true,
      chat,
    };
  }

  @Get()
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Get all chat sessions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'company_id', required: false })
  @ApiQuery({ name: 'user_id', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Chat sessions retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 20,
    @Query() filters: ChatFilterDto,
    @Req() req: any,
  ) {
    // Si l'utilisateur n'est pas admin, forcer le filtrage par son entreprise
    if (req.user.role !== 'admin') {
      filters.companyId = req.user.companyId;
    }

    const result = await this.chatService.findAll(filters, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Get chat session by ID' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Chat session retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async findOne(@Param('id') id: string) {
    const chat = await this.chatService.findById(id);
    return {
      success: true,
      chat,
    };
  }

  @Post(':id/message')
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Add message to chat' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 201, description: 'Message added successfully' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async addMessage(
    @Param('id') id: string,
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: any,
  ) {
    const message = await this.chatService.addMessage(id, createMessageDto, req.user.id);
    return {
      success: true,
      message,
    };
  }

  @Get(':id/history')
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Get chat history' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Chat history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async getHistory(@Param('id') id: string) {
    const messages = await this.chatService.getHistory(id);
    return {
      success: true,
      messages,
    };
  }

  @Delete(':id')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Delete chat session' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Chat session deleted successfully' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async remove(@Param('id') id: string) {
    return await this.chatService.delete(id);
  }

  @Get(':id/usage')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Get token usage statistics' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Token usage statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async getTokenUsage(@Param('id') id: string) {
    const usage = await this.chatService.getTokenUsage(id);
    return {
      success: true,
      usage,
    };
  }

  @Get('context/:companyId')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Get accounting context for AI' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiQuery({ name: 'fiscalYear', required: true, type: String, description: 'Fiscal Year' })
  @ApiQuery({ name: 'accountingStandard', required: true, enum: AccountingStandard, description: 'Accounting Standard', type: String })
  @ApiResponse({ status: 200, description: 'Accounting context retrieved successfully' })
  async getAccountingContext(
    @Param('companyId') companyId: string,
    @Query('fiscalYear') fiscalYear: string,
    @Query('accountingStandard') accountingStandard: AccountingStandard,
  ) {
    const context = await this.chatService.getAccountingContext(companyId, fiscalYear, accountingStandard);
    return {
      success: true,
      context,
    };
  }
}