import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  HttpStatus, 
  HttpException, 
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe
} from '@nestjs/common';
import { CustomerService } from '../services/customer.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CustomerType, CustomerStatus } from '../entities/customer.entity';

// DTOs
interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  type: CustomerType;
  address?: string;
  description?: string;
}

interface UpdateCustomerDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
}

interface SuspensionDto {
  reason: string;
  suspendedBy?: string;
}

interface ValidationDto {
  validatedBy?: string;
  reason?: string;
}

/**
 * Controller principal pour la gestion des clients
 * Orchestre les opérations communes et délègue aux sous-modules selon le type
 */
@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  // ==================== OPERATIONS CRUD ====================

  @ApiOperation({ 
    summary: 'Get all customers',
    description: 'Returns paginated list of customers with optional filters'
  })
  @ApiResponse({ status: 200, description: 'Returns paginated customers' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'type', required: false, enum: CustomerType, description: 'Filter by customer type' })
  @ApiQuery({ name: 'status', required: false, enum: CustomerStatus, description: 'Filter by status' })
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('type') type?: CustomerType,
    @Query('status') status?: CustomerStatus,
  ) {
    try {
      return await this.customerService.findAll({
        page: Number(page),
        limit: Number(limit),
        search,
        type,
        status,
      });
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch customers',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiOperation({ 
    summary: 'Get customer by ID',
    description: 'Returns a specific customer with detailed information'
  })
  @ApiResponse({ status: 200, description: 'Returns the customer' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const customer = await this.customerService.findById(id);
      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }
      return customer;
    } catch (error: any) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to fetch customer',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiOperation({ 
    summary: 'Create a new customer',
    description: 'Creates a new customer. This creates the base customer record. Use specific endpoints for companies or institutions.'
  })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Post()
  async create(@Body(ValidationPipe) createCustomerDto: CreateCustomerDto) {
    try {
      // Ensure required fields for the service
      const customerData = {
        name: createCustomerDto.name,
        email: createCustomerDto.email || '',
        type: createCustomerDto.type,
        phone: createCustomerDto.phone,
        address: createCustomerDto.address,
        description: createCustomerDto.description,
      };
      return await this.customerService.create(customerData);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create customer',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @ApiOperation({ 
    summary: 'Update a customer',
    description: 'Updates basic customer information. For specific company or institution data, use specialized endpoints.'
  })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body(ValidationPipe) updateCustomerDto: UpdateCustomerDto
  ) {
    try {
      return await this.customerService.update(id, updateCustomerDto);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to update customer',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @ApiOperation({ 
    summary: 'Delete a customer',
    description: 'Soft deletes a customer and all associated data'
  })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.customerService.remove(id);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to delete customer',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // ==================== LIFECYCLE OPERATIONS ====================

  @ApiOperation({ 
    summary: 'Validate a customer',
    description: 'Validates a customer and changes status to ACTIVE'
  })
  @ApiResponse({ status: 200, description: 'Customer validated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @Put(':id/validate')
  async validate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) validationDto: ValidationDto = {}
  ) {
    try {
      return await this.customerService.validate(id, validationDto.validatedBy, validationDto.reason);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to validate customer',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @ApiOperation({ 
    summary: 'Suspend a customer',
    description: 'Suspends a customer with a reason'
  })
  @ApiResponse({ status: 200, description: 'Customer suspended successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 400, description: 'Reason is required' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @Put(':id/suspend')
  async suspend(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body(ValidationPipe) suspensionDto: SuspensionDto
  ) {
    try {
      if (!suspensionDto.reason) {
        throw new HttpException('Suspension reason is required', HttpStatus.BAD_REQUEST);
      }
      return await this.customerService.suspend(id, suspensionDto.reason, suspensionDto.suspendedBy || 'system');
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to suspend customer',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @ApiOperation({ 
    summary: 'Reactivate a customer',
    description: 'Reactivates a suspended customer'
  })
  @ApiResponse({ status: 200, description: 'Customer reactivated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @Put(':id/reactivate')
  async reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reactivationDto: { reactivatedBy?: string; reason?: string } = {}
  ) {
    try {
      return await this.customerService.reactivate(id, reactivationDto.reactivatedBy, reactivationDto.reason);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to reactivate customer',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // ==================== STATISTICS AND REPORTING ====================

  @ApiOperation({ 
    summary: 'Get customer statistics',
    description: 'Returns aggregated statistics about customers'
  })
  @ApiResponse({ status: 200, description: 'Returns customer statistics' })
  @Get('stats/overview')
  async getStats() {
    try {
      return await this.customerService.getCustomerStats();
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch statistics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Note: Customer activities endpoint removed - functionality moved to shared services

  // ==================== ACCESS VALIDATION ====================

  @ApiOperation({ 
    summary: 'Validate user access to customer',
    description: 'Checks if a user has access to a specific customer'
  })
  @ApiResponse({ status: 200, description: 'Access validation result' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @Get(':id/validate-access/:userId')
  async validateUserAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string
  ) {
    try {
      await this.customerService.validateUserAccess(id, userId);
      return { hasAccess: true, message: 'Access granted' };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Access denied',
        error.status || HttpStatus.FORBIDDEN
      );
    }
  }

  // Note: Bulk operations removed - use individual endpoints for now

  // ==================== SEARCH AND FILTERS ====================

  @ApiOperation({ 
    summary: 'Advanced customer search',
    description: 'Performs advanced search with multiple criteria'
  })
  @ApiResponse({ status: 200, description: 'Search results' })
  @Post('search')
  async advancedSearch(@Body() searchCriteria: {
    query?: string;
    types?: CustomerType[];
    statuses?: CustomerStatus[];
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    try {
      return await this.customerService.searchCustomers(searchCriteria);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Search failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }
}