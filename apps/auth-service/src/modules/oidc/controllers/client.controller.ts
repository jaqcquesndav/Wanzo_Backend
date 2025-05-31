import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ClientService } from '../services/client.service';
import { CreateClientDto, UpdateClientDto } from '../dtos/client.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { OIDCClient } from '../entities/client.entity';

interface ClientResponse {
  success: boolean;
  client: OIDCClient;
}

interface ClientListResponse {
  success: boolean;
  clients: OIDCClient[];
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

interface RegenerateSecretResponse {
  success: boolean;
  clientSecret: string;
}

@ApiTags('clients')
@ApiBearerAuth()
@Controller('oauth/clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all clients', description: 'Retrieve all OIDC clients' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  async findAll(): Promise<ClientListResponse> {
    const clients = await this.clientService.findAll();
    return {
      success: true,
      clients,
    };
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Client retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async findOne(@Param('id') id: string): Promise<ClientResponse> {
    const client = await this.clientService.findById(id);
    return {
      success: true,
      client,
    };
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createClientDto: CreateClientDto): Promise<ClientResponse> {
    const client = await this.clientService.create(createClientDto);
    return {
      success: true,
      client,
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update client' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<ClientResponse> {
    const client = await this.clientService.update(id, updateClientDto);
    return {
      success: true,
      client,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete client' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async remove(@Param('id') id: string): Promise<DeleteResponse> {
    return await this.clientService.delete(id);
  }

  @Post(':id/regenerate-secret')
  @Roles('admin')
  @ApiOperation({ summary: 'Regenerate client secret' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Client secret regenerated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async regenerateSecret(@Param('id') id: string): Promise<RegenerateSecretResponse> {
    return await this.clientService.regenerateSecret(id);
  }
}