import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { CreateChatDto, CreateMessageDto, ChatFilterDto } from '../dtos/chat.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Roles('admin', 'institution-user')
  @ApiOperation({ summary: 'Create new portfolio chat session' })
  @ApiResponse({ status: 201, description: 'Chat session created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createChatDto: CreateChatDto, @Req() req: any) {
    // Supposons que req.user contient id et institutionId
    const chat = await this.chatService.create(createChatDto, req.user.id, req.user.institutionId);
    return {
      success: true,
      chat,
    };
  }

  @Get()
  @Roles('admin', 'institution-user')
  @ApiOperation({ summary: 'Get all portfolio chat sessions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'institution_id', required: false })
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
    if (req.user.role !== 'admin') {
      filters.institutionId = req.user.institutionId;
    }

    const result = await this.chatService.findAll(filters, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @Roles('admin', 'institution-user')
  @ApiOperation({ summary: 'Get portfolio chat session by ID' })
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
  @Roles('admin', 'institution-user')
  @ApiOperation({ summary: 'Add message to portfolio chat' })
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
  @Roles('admin', 'institution-user')
  @ApiOperation({ summary: 'Get portfolio chat history' })
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
  @Roles('admin')
  @ApiOperation({ summary: 'Delete portfolio chat session' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Chat session deleted successfully' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async remove(@Param('id') id: string) {
    return await this.chatService.delete(id);
  }

  @Get(':id/usage')
  @Roles('admin')
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

  @Get('context/:institutionId')
  @Roles('admin', 'institution-user')
  @ApiOperation({ summary: 'Get aggregated portfolio and prospection context' })
  @ApiParam({ name: 'institutionId', description: 'Institution ID' })
  @ApiResponse({ status: 200, description: 'Aggregated context retrieved successfully' })
  async getAggregatedContext(@Param('institutionId') institutionId: string) {
    const context = await this.chatService.getAggregatedContext(institutionId);
    return {
      success: true,
      context,
    };
  }
}
