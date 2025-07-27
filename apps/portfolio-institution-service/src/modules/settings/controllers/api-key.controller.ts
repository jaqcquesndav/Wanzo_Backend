import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ApiKeyService } from '../services/api-key.service';
import { CreateApiKeyDto, UpdateApiKeyDto, ApiKeyResponseDto } from '../dtos/api-key.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('settings/api-keys')
@Controller('settings/api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all API keys' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  async findAll(@Req() req: any) {
    const apiKeys = await this.apiKeyService.findAll(req.user.institutionId);
    return {
      success: true,
      apiKeys,
    };
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get API key by ID' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key retrieved successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const apiKey = await this.apiKeyService.findById(req.user.institutionId, id);
    return {
      success: true,
      apiKey,
    };
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'API key with this name already exists' })
  async create(@Body() createApiKeyDto: CreateApiKeyDto, @Req() req: any): Promise<{ success: boolean; apiKey: ApiKeyResponseDto }> {
    const apiKey = await this.apiKeyService.create(
      req.user.institutionId,
      createApiKeyDto,
      req.user.id,
    );
    return {
      success: true,
      apiKey,
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update API key' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key updated successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async update(
    @Param('id') id: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
    @Req() req: any,
  ) {
    const apiKey = await this.apiKeyService.update(
      req.user.institutionId,
      id,
      updateApiKeyDto,
    );
    return {
      success: true,
      apiKey,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Revoke API key' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 204, description: 'API key revoked successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async revoke(@Param('id') id: string, @Req() req: any) {
    await this.apiKeyService.revoke(req.user.institutionId, id);
    return {
      success: true,
      message: 'API key revoked successfully',
    };
  }
}
