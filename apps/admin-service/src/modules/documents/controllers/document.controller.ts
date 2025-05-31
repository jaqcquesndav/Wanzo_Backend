import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { DocumentService } from '../services/document.service';
import { CreateDocumentDto, UpdateDocumentStatusDto, DocumentFilterDto } from '../dtos/document.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Document } from '../entities/document.entity';


interface DocumentResponse {
  success: boolean;
  document?: Document;
  documents?: Document[];
  message?: string;
  page?: number;
  perPage?: number;
  total?: number;
}

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @ApiOperation({ summary: 'Upload document', description: 'Upload a new document' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Body() createDocumentDto: CreateDocumentDto & { cloudinaryId: string; url: string },
  ): Promise<DocumentResponse> {
    const userId = 'user-123'; // This should come from auth context
    const document = await this.documentService.create(
      createDocumentDto,
      createDocumentDto.cloudinaryId,
      createDocumentDto.url,
      userId,
    );
    return {
      success: true,
      document,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get documents', description: 'Retrieve a paginated list of documents' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'per_page', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Query() filters: DocumentFilterDto,
  ): Promise<DocumentResponse> {
    const result = await this.documentService.findAll(filters, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findOne(@Param('id') id: string): Promise<DocumentResponse> {
    const document = await this.documentService.findById(id);
    return {
      success: true,
      document,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update document status' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document status updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDocumentStatusDto: UpdateDocumentStatusDto,
  ): Promise<DocumentResponse> {
    const reviewerId = 'user-123'; // This should come from auth context
    const document = await this.documentService.updateStatus(id, updateDocumentStatusDto, reviewerId);
    return {
      success: true,
      document,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async remove(@Param('id') id: string): Promise<DocumentResponse> {
    return await this.documentService.delete(id);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get company documents' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Document type filter' })
  @ApiResponse({ status: 200, description: 'Company documents retrieved successfully' })
  async findCompanyDocuments(
    @Param('companyId') companyId: string,
    @Query('type') type?: string,
  ): Promise<DocumentResponse> {
    const documents = await this.documentService.findCompanyDocuments(companyId, type);
    return {
      success: true,
      documents,
    };
  }
}