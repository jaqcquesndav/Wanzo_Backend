import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtBlacklistGuard } from '@/modules/auth/guards/jwt-blacklist.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomersService } from '../services';
import { User } from '@/modules/users/entities/user.entity';
import {
  CustomerDto,
  CustomerListResponseDto,
  CustomerDetailsResponseDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryParamsDto,
  CustomerDocumentDto,
  UploadDocumentDto,
  ApproveDocumentDto,
  RejectDocumentDto,
  SuspendCustomerDto,
  CustomerActivityDto,
  CustomerStatisticsDto
} from '../dtos';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  @ApiResponse({ status: 200, description: 'Returns a list of customers with pagination', type: CustomerListResponseDto })
  async findAll(@Query() queryParams: CustomerQueryParamsDto): Promise<CustomerListResponseDto> {
    return this.customersService.findAll(queryParams);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully', type: CustomerDto })
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<CustomerDto> {
    return this.customersService.create(createCustomerDto);
  }

  @Get(':customerId')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'Returns customer details', type: CustomerDetailsResponseDto })
  async findOne(@Param('customerId', ParseUUIDPipe) customerId: string): Promise<CustomerDetailsResponseDto> {
    return this.customersService.findOne(customerId);
  }

  @Put(':customerId')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully', type: CustomerDto })
  async update(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() updateCustomerDto: UpdateCustomerDto
  ): Promise<CustomerDto> {
    return this.customersService.update(customerId, updateCustomerDto);
  }

  @Put(':customerId/validate')
  @ApiOperation({ summary: 'Validate a customer' })
  @ApiResponse({ status: 200, description: 'Customer validated successfully', type: CustomerDto })
  async validate(@Param('customerId', ParseUUIDPipe) customerId: string): Promise<CustomerDto> {
    return this.customersService.validateCustomer(customerId);
  }

  @Put(':customerId/suspend')
  @ApiOperation({ summary: 'Suspend a customer' })
  @ApiResponse({ status: 200, description: 'Customer suspended successfully', type: CustomerDto })
  async suspend(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() suspendCustomerDto: SuspendCustomerDto
  ): Promise<CustomerDto> {
    return this.customersService.suspendCustomer(customerId, suspendCustomerDto.reason);
  }

  @Put(':customerId/reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended customer' })
  @ApiResponse({ status: 200, description: 'Customer reactivated successfully', type: CustomerDto })
  async reactivate(@Param('customerId', ParseUUIDPipe) customerId: string): Promise<CustomerDto> {
    return this.customersService.reactivateCustomer(customerId);
  }

  @Delete(':customerId')
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiResponse({ status: 204, description: 'Customer deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('customerId', ParseUUIDPipe) customerId: string): Promise<void> {
    await this.customersService.remove(customerId);
  }

  // Documents
  @Post(':customerId/documents')
  @ApiOperation({ summary: 'Upload a document for a customer' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/customer-documents',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|jpg|jpeg|png|doc|docx)$/)) {
          return cb(new BadRequestException('Only PDF, JPG, JPEG, PNG, DOC, DOCX files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiResponse({ status: 201, description: 'Document uploaded successfully', type: CustomerDocumentDto })
  async uploadDocument(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDocumentDto: UploadDocumentDto
  ): Promise<CustomerDocumentDto> {
    return this.customersService.uploadDocument(
      customerId,
      uploadDocumentDto.type,
      file.filename,
      file.path,
      file.originalname
    );
  }

  @Get(':customerId/documents')
  @ApiOperation({ summary: 'Get all documents for a customer' })
  @ApiResponse({ status: 200, description: 'Returns customer documents', type: [CustomerDocumentDto] })
  async getDocuments(@Param('customerId', ParseUUIDPipe) customerId: string): Promise<CustomerDocumentDto[]> {
    return this.customersService.getDocuments(customerId);
  }

  @Put(':customerId/documents/:documentId/approve')
  @ApiOperation({ summary: 'Approve a customer document' })
  @ApiResponse({ status: 200, description: 'Document approved successfully', type: CustomerDocumentDto })
  async approveDocument(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() approveDocumentDto: ApproveDocumentDto,
    @CurrentUser() user: User
  ): Promise<CustomerDocumentDto> {
    return this.customersService.approveDocument(customerId, documentId, approveDocumentDto, user);
  }

  @Put(':customerId/documents/:documentId/reject')
  @ApiOperation({ summary: 'Reject a customer document' })
  @ApiResponse({ status: 200, description: 'Document rejected successfully', type: CustomerDocumentDto })
  async rejectDocument(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() rejectDocumentDto: RejectDocumentDto,
    @CurrentUser() user: User
  ): Promise<CustomerDocumentDto> {
    return this.customersService.rejectDocument(customerId, documentId, rejectDocumentDto, user);
  }

  // Activities
  @Get(':customerId/activities')
  @ApiOperation({ summary: 'Get customer activities' })
  @ApiResponse({ status: 200, description: 'Returns customer activities', type: [CustomerActivityDto] })
  async getActivities(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<CustomerActivityDto[]> {
    return this.customersService.getActivities(customerId, { page, limit });
  }

  // Statistics
  @Get('statistics')
  @ApiOperation({ summary: 'Get customer statistics' })
  @ApiResponse({ status: 200, description: 'Returns customer statistics', type: CustomerStatisticsDto })
  async getStatistics(): Promise<CustomerStatisticsDto> {
    return this.customersService.getStatistics();
  }
}
