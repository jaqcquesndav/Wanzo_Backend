import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
  ParseUUIDPipe,
  Query,
  NotFoundException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';
import { CompanyService } from '../services/company.service';
import { Company } from '../entities/company.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

// DTOs pour les opérations Company de base
class CreateCompanyDto {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  registrationNumber?: string;
  website?: string;
}

class UpdateCompanyDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  registrationNumber?: string;
  website?: string;
}

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all companies',
    description: 'Retrieve all companies with optional filtering'
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for company name or email'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: Number,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Companies retrieved successfully',
    type: [Company]
  })
  async getAllCompanies(
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ companies: Company[]; total: number; page: number; totalPages: number }> {
    return this.companyService.findAll({ search, page, limit });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get company by ID',
    description: 'Retrieve a specific company by its ID'
  })
  @ApiParam({
    name: 'id',
    description: 'Company ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Company retrieved successfully',
    type: Company
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found'
  })
  async getCompanyById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<Company> {
    const company = await this.companyService.findById(id);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new company',
    description: 'Create a new company with the provided information'
  })
  @ApiBody({
    type: CreateCompanyDto,
    description: 'Company information'
  })
  @ApiResponse({
    status: 201,
    description: 'Company created successfully',
    type: Company
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid company data'
  })
  @ApiResponse({
    status: 409,
    description: 'Company with this email already exists'
  })
  async createCompany(
    @Body() createCompanyDto: CreateCompanyDto
  ): Promise<Company> {
    return this.companyService.create(createCompanyDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update company',
    description: 'Update an existing company with the provided information'
  })
  @ApiParam({
    name: 'id',
    description: 'Company ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: UpdateCompanyDto,
    description: 'Company information to update'
  })
  @ApiResponse({
    status: 200,
    description: 'Company updated successfully',
    type: Company
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid company data'
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found'
  })
  async updateCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto
  ): Promise<Company> {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete company',
    description: 'Delete a company by its ID'
  })
  @ApiParam({
    name: 'id',
    description: 'Company ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 204,
    description: 'Company deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found'
  })
  async deleteCompany(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<void> {
    return this.companyService.delete(id);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get company statistics',
    description: 'Get statistical information about a company'
  })
  @ApiParam({
    name: 'id',
    description: 'Company ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Company statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalPortfolios: { type: 'number' },
        activePortfolios: { type: 'number' },
        totalFinancingAmount: { type: 'number' },
        totalPayments: { type: 'number' },
        pendingPayments: { type: 'number' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found'
  })
  async getCompanyStats(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{
    totalPortfolios: number;
    activePortfolios: number;
    totalFinancingAmount: number;
    totalPayments: number;
    pendingPayments: number;
  }> {
    return this.companyService.getStats(id);
  }
}