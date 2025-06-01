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
  HttpCode
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
  DocumentFoldersListResponseDto
} from '../dtos';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async findAll(@Query() queryParams: DocumentQueryParamsDto): Promise<DocumentsListResponseDto> {
    const { documents, total, page, limit, pages } = await this.documentsService.findAll(queryParams);
    
    return {
      data: documents,
      pagination: {
        currentPage: page,
        totalPages: pages,
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentResponseDto> {
    const document = await this.documentsService.findOne(id);
    return { data: document };
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File
  ): Promise<DocumentUploadResponseDto> {
    // In a real implementation, you'd upload the file to storage and get back a URL
    // For this example, we're simulating with a hardcoded URL
    const fileUrl = `https://storage.example.com/documents/${file.originalname}`;
    const userId = 'user_123'; // This would come from the authentication context
    
    const document = await this.documentsService.create(
      createDocumentDto,
      file.size,
      fileUrl,
      userId,
      file.mimetype
    );
    
    return {
      data: document,
      message: 'Document uploaded successfully'
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto
  ): Promise<DocumentResponseDto> {
    const document = await this.documentsService.update(id, updateDocumentDto);
    return { data: document };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.documentsService.remove(id);
  }

  @Put(':id/archive')
  async archive(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentResponseDto> {
    const document = await this.documentsService.archive(id);
    return { data: document };
  }

  @Get('company/:companyId')
  async findByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query() queryParams: DocumentQueryParamsDto
  ): Promise<DocumentsListResponseDto> {
    const { documents, total, page, limit, pages } = await this.documentsService.findByCompany(companyId, queryParams);
    
    return {
      data: documents,
      pagination: {
        currentPage: page,
        totalPages: pages,
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  // Folder endpoints
  @Get('folders/company/:companyId')
  async findFolders(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query() queryParams: FolderQueryParamsDto
  ): Promise<DocumentFoldersListResponseDto> {
    const folders = await this.documentsService.findAllFolders(companyId, queryParams);
    return { data: folders };
  }

  @Get('folders/:id')
  async findOneFolder(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentFolderResponseDto> {
    const folder = await this.documentsService.findOneFolder(id);
    return { data: folder };
  }

  @Post('folders')
  async createFolder(@Body() createFolderDto: CreateDocumentFolderDto): Promise<DocumentFolderResponseDto> {
    const folder = await this.documentsService.createFolder(createFolderDto);
    return { data: folder };
  }

  @Put('folders/:id')
  async updateFolder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFolderDto: UpdateDocumentFolderDto
  ): Promise<DocumentFolderResponseDto> {
    const folder = await this.documentsService.updateFolder(id, updateFolderDto);
    return { data: folder };
  }

  @Delete('folders/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFolder(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.documentsService.removeFolder(id);
  }
}
