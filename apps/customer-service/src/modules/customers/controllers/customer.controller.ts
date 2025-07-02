import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpException, UseGuards } from '@nestjs/common';
import { CustomerService } from '../services/customer.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'Returns all customers' })
  @Get()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.customerService.findAll(page, limit);
  }

  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'Returns the customer' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const customer = await this.customerService.findById(id);
    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }
    return customer;
  }

  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @Post()
  async create(@Body() createCustomerDto: any) {
    return this.customerService.create(createCustomerDto);
  }

  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCustomerDto: any) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @ApiOperation({ summary: 'Delete a customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }

  @ApiOperation({ summary: 'Validate a customer' })
  @ApiResponse({ status: 200, description: 'Customer validated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @Put(':id/validate')
  async validate(@Param('id') id: string) {
    return this.customerService.validate(id);
  }

  @ApiOperation({ summary: 'Suspend a customer' })
  @ApiResponse({ status: 200, description: 'Customer suspended successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @Put(':id/suspend')
  async suspend(@Param('id') id: string, @Body() suspensionDto: { reason: string }) {
    return this.customerService.suspend(id, suspensionDto.reason);
  }

  @ApiOperation({ summary: 'Reactivate a customer' })
  @ApiResponse({ status: 200, description: 'Customer reactivated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @Put(':id/reactivate')
  async reactivate(@Param('id') id: string) {
    return this.customerService.reactivate(id);
  }
}
