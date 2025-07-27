import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { CreateWebhookDto, UpdateWebhookDto, WebhookResponseDto, WebhookTestResponseDto } from '../dtos/webhook.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('settings/webhooks')
@Controller('settings/webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all webhooks' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  async findAll(@Req() req: any) {
    const webhooks = await this.webhookService.findAll(req.user.institutionId);
    return {
      success: true,
      webhooks,
    };
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get webhook by ID' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const webhook = await this.webhookService.findById(req.user.institutionId, id);
    return {
      success: true,
      webhook,
    };
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createWebhookDto: CreateWebhookDto, @Req() req: any) {
    const webhook = await this.webhookService.create(
      req.user.institutionId,
      createWebhookDto,
      req.user.id,
    );
    return {
      success: true,
      webhook,
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async update(
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
    @Req() req: any,
  ) {
    const webhook = await this.webhookService.update(
      req.user.institutionId,
      id,
      updateWebhookDto,
    );
    return {
      success: true,
      webhook,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 204, description: 'Webhook deleted successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.webhookService.delete(req.user.institutionId, id);
    return {
      success: true,
      message: 'Webhook deleted successfully',
    };
  }

  @Post(':id/test')
  @Roles('admin')
  @ApiOperation({ summary: 'Test webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook tested' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async test(@Param('id') id: string, @Req() req: any): Promise<{ success: boolean; result: WebhookTestResponseDto }> {
    const result = await this.webhookService.test(req.user.institutionId, id);
    return {
      success: true,
      result,
    };
  }
}
