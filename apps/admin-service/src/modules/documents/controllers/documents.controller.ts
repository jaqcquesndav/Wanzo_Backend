import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { DocumentsService } from '../services';
import {
  DocumentDto,
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentQueryParamsDto,
  DocumentFolderDto,
  CreateDocumentFolderDto,
  UpdateDocumentFolderDto,
  FolderQueryParamsDto,
  DocumentUploadResponseDto,
  DocumentResponseDto,
  DocumentsListResponseDto,
  DocumentFolderResponseDto,
  DocumentFoldersListResponseDto,
  UpdateDocumentStatusDto
} from '../dtos';
import { JwtBlacklistGuard } from '../../auth/guards/jwt-blacklist.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserDto } from '../../users/dtos';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, RolesGuard)
@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // Conform to API Documentation endpoint structure
  @Get('documents')
  @ApiOperation({ summary: 'Get all documents with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Returns a list of documents with pagination info' })
  async findAll(@Query() queryParams: DocumentQueryParamsDto): Promise<DocumentsListResponseDto> {
    const { items, totalCount, page, totalPages } = await this.documentsService.findAll(queryParams);
    
    return {
      data: items,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalCount,
        itemsPerPage: queryParams.limit || 10
      }
    };
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Returns the document' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentResponseDto> {
    const document = await this.documentsService.findOne(id);
    return { data: document };
  }

  // Match API documentation URL structure
  @Get('companies/:companyId/documents')
  @ApiOperation({ summary: 'Get all documents for a company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Returns documents for the company' })
  async findByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query() queryParams: DocumentQueryParamsDto
  ): Promise<DocumentDto[]> {
    const { items } = await this.documentsService.findByCompany(companyId, queryParams);
    // Return just the array of documents as per API documentation
    return items;
  }

  // Match API documentation URL structure for upload
  @Post('companies/:companyId/documents/upload')
  @ApiOperation({ summary: 'Upload a new document for a company' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  async upload(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File
  ): Promise<DocumentUploadResponseDto> {
    // Add companyId from path param to the DTO
    createDocumentDto.companyId = companyId;
    
    // In a real implementation, you'd upload the file to storage and get back a URL
    const fileUrl = `https://storage.wanzo.com/documents/${file.originalname}`;
    const userId = 'user_123'; // This would come from the authentication context
    
    const document = await this.documentsService.create(
      createDocumentDto,
      file.size,
      fileUrl,
      userId,
      file.mimetype
    );
    
    return {
      id: document.id,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      type: document.type,
      status: document.status,
      uploadedAt: document.uploadedAt.toISOString(),
      message: 'Document uploaded successfully'
    };
  }

  // Specific endpoint for updating status as per API docs
  @Patch('documents/:id/status')
  @ApiOperation({ summary: 'Update document status' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiBody({ type: UpdateDocumentStatusDto })
  @ApiResponse({ status: 200, description: 'Document status updated' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateDocumentStatusDto
  ): Promise<DocumentDto> {
    return this.documentsService.updateStatus(id, updateStatusDto);
  }

  @Put('documents/:id')
  @ApiOperation({ summary: 'Update document details' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document updated' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto
  ): Promise<DocumentResponseDto> {
    const document = await this.documentsService.update(id, updateDocumentDto);
    return { data: document };
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 204, description: 'Document deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserDto
  ): Promise<void> {
    await this.documentsService.remove(id, user.id);
  }

  @Put('documents/:id/archive')
  @ApiOperation({ summary: 'Archive a document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document archived' })
  async archive(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentResponseDto> {
    const document = await this.documentsService.archive(id);
    return { data: document };
  }

  // Folder endpoints
  @Get('documents/folders/company/:companyId')
  @ApiOperation({ summary: 'Get document folders for a company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'List of document folders' })
  async findFolders(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query() queryParams: FolderQueryParamsDto
  ): Promise<DocumentFoldersListResponseDto> {
    const folders = await this.documentsService.findAllFolders(companyId, queryParams);
    return { data: folders };
  }

  @Get('documents/folders/:id')
  @ApiOperation({ summary: 'Get a document folder by ID' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({ status: 200, description: 'Document folder details' })
  async findOneFolder(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentFolderResponseDto> {
    const folder = await this.documentsService.findOneFolder(id);
    return { data: folder };
  }

  @Post('documents/folders')
  @ApiOperation({ summary: 'Create a new document folder' })
  @ApiResponse({ status: 201, description: 'Document folder created' })
  async createFolder(@Body() createFolderDto: CreateDocumentFolderDto): Promise<DocumentFolderResponseDto> {
    const folder = await this.documentsService.createFolder(createFolderDto);
    return { data: folder };
  }

  @Put('documents/folders/:id')
  @ApiOperation({ summary: 'Update a document folder' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({ status: 200, description: 'Document folder updated' })
  async updateFolder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFolderDto: UpdateDocumentFolderDto
  ): Promise<DocumentFolderResponseDto> {
    const folder = await this.documentsService.updateFolder(id, updateFolderDto);
    return { data: folder };
  }

  @Delete('documents/folders/:id')
  @ApiOperation({ summary: 'Delete a document folder' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({ status: 204, description: 'Document folder deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFolder(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.documentsService.removeFolder(id);
  }
}
