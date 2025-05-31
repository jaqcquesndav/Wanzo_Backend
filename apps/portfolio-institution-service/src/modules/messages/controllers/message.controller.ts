import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { MessageService } from '../services/message.service';
import { Message } from '../entities/message.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @ApiOperation({ summary: 'Create new message' })
  @ApiResponse({ status: 201, description: 'Message created successfully' })
  async create(@Body() message: Partial<Message>, @Req() req: any) {
    const newMessage = await this.messageService.create({
      ...message,
      senderId: req.user.id,
    });
    return {
      success: true,
      message: newMessage,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get user messages' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Req() req: any,
  ) {
    const result = await this.messageService.findByUser(
      req.user.id,
      +page,
      +perPage,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message by ID' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async findOne(@Param('id') id: string) {
    const message = await this.messageService.findById(id);
    return {
      success: true,
      message,
    };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message marked as read successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async markAsRead(@Param('id') id: string) {
    const message = await this.messageService.markAsRead(id);
    return {
      success: true,
      message,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async remove(@Param('id') id: string) {
    await this.messageService.delete(id);
    return {
      success: true,
      message: 'Message deleted successfully',
    };
  }
}