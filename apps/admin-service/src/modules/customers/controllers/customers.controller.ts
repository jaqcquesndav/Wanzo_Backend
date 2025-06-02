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
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomersService } from '../services';
import {
  CustomerDto,
  CustomerListResponseDto,
  CustomerDetailsResponseDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryParamsDto,
  CustomerDocumentDto,
  VerifyDocumentDto,
  UploadDocumentDto
} from '../dtos';
import { CustomerStatus } from '../entities';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtBlacklistGuard } from '@/modules/auth/guards/jwt-blacklist.guard';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(@Query() queryParams: CustomerQueryParamsDto): Promise<CustomerListResponseDto> {
    const { customers, total, page, limit, pages } = await this.customersService.findAll(queryParams);
    
    return {
      data: customers,
      pagination: {
        currentPage: page,
        totalPages: pages,
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CustomerDetailsResponseDto> {
    const customer = await this.customersService.findOne(id, true);
    return { data: customer as any }; // Cast to any because of documents array
  }

  @Post()
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<{ data: CustomerDto, message: string }> {
    const customer = await this.customersService.create(createCustomerDto);
    return { 
      data: customer, 
      message: 'Customer created successfully' 
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCustomerDto: UpdateCustomerDto
  ): Promise<{ data: CustomerDto, message: string }> {
    const customer = await this.customersService.update(id, updateCustomerDto);
    return { 
      data: customer, 
      message: 'Customer updated successfully' 
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.customersService.remove(id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: CustomerStatus
  ): Promise<{ data: CustomerDto, message: string }> {
    const customer = await this.customersService.updateStatus(id, status);
    return {
      data: customer,
      message: `Customer status updated to ${status}`
    };
  }

  @Get(':id/documents')
  async getDocuments(@Param('id', ParseUUIDPipe) id: string): Promise<{ data: CustomerDocumentDto[] }> {
    const documents = await this.customersService.getDocuments(id);
    return { data: documents };
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File
  ): Promise<{ data: CustomerDocumentDto, message: string }> {
    // In a real implementation, you'd upload the file to storage and get back a URL
    const fileUrl = `https://example.com/uploads/${file.originalname}`;
    
    const document = await this.customersService.uploadDocument(
      id,
      uploadDocumentDto.type,
      file.originalname,
      fileUrl,
      uploadDocumentDto.expiryDate
    );

    return {
      data: document,
      message: 'Document uploaded successfully'
    };
  }

  @Get('documents/:documentId')
  async getDocument(@Param('documentId', ParseUUIDPipe) documentId: string): Promise<{ data: CustomerDocumentDto }> {
    const document = await this.customersService.getDocument(documentId);
    return { data: document };
  }

  @Put('documents/:documentId/verify')
  async verifyDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() verifyDocumentDto: VerifyDocumentDto
  ): Promise<{ data: CustomerDocumentDto, message: string }> {
    const document = await this.customersService.verifyDocument(documentId, verifyDocumentDto);
    return {
      data: document,
      message: `Document ${document.status === 'verified' ? 'verified' : 'rejected'} successfully`
    };
  }

  @Delete('documents/:documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDocument(@Param('documentId', ParseUUIDPipe) documentId: string): Promise<void> {
    await this.customersService.removeDocument(documentId);
  }
}
