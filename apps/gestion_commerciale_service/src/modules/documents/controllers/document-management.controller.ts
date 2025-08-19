import {
  Controller, Post, Body, Get, Param, Patch, Delete, Query, UseGuards, UploadedFile, UseInterceptors, ParseUUIDPipe,
  ParseFilePipe, MaxFileSizeValidator, HttpCode, HttpStatus
} from '@nestjs/common';
import { DocumentManagementService } from '../services/document-management.service';
import { CreateDocumentDto, UpdateDocumentDto, ListDocumentsDto } from '../dto/document.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../auth/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { Document, RelatedEntityType } from '../entities/document.entity';

@ApiTags('Document Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentManagementController {
  constructor(private readonly documentManagementService: DocumentManagementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a new document and save its metadata' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Document uploaded and metadata saved successfully.', type: Document })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input or file validation failed.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document file and its metadata. DTO fields are sent as form fields alongside the file.',
    schema: {
      type: 'object',
      required: ['file', 'documentType'], // documentType is from DTO, file is the actual file
      properties: {
        file: { type: 'string', format: 'binary', description: 'The document file to upload.' },
        // Properties from CreateDocumentDto that are expected as form fields
        fileName: { type: 'string', example: 'annual_report_2024.pdf', description: 'User-defined name for the document. If not provided, uploaded filename will be used.' },
        documentType: { type: 'string', example: 'Report', description: 'Category or type of the document.' },
        relatedToEntityType: { type: 'string', enum: Object.values(RelatedEntityType), description: 'Type of the entity this document is related to.' },
        relatedToEntityId: { type: 'string', format: 'uuid', description: 'ID of the entity this document is related to.' },
        description: { type: 'string', example: 'Annual financial report for the year 2024.', description: 'Optional description for the document.' },
        tags: { type: 'array', items: { type: 'string' }, example: ['finance', 'report', '2024'], description: 'Tags for searching.' },
      },
    },
  })
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 }), // 25MB
        ],
        fileIsRequired: true,
      }),
    )
    file: any,
    @CurrentUser() user: User,
  ): Promise<Document> {
    if (!createDocumentDto.fileName && file && file.originalname) {
      createDocumentDto.fileName = file.originalname;
    }
    return this.documentManagementService.create(createDocumentDto, user, file);
  }

  @Get()
  @ApiOperation({ summary: 'List all documents for the current user/company with pagination and filtering' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved documents.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async findAll(
    @Query() listDocumentsDto: ListDocumentsDto,
    @CurrentUser() user: User,
  ): Promise<{ data: Document[]; count: number }> {
    return this.documentManagementService.findAll(listDocumentsDto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific document by ID for the current user/company' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved document.', type: Document })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<Document> {
    return this.documentManagementService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document metadata or replace the file' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document updated successfully.', type: Document })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input or file validation failed.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document metadata to update and optionally a new file. DTO fields are sent as form data.',
    schema: {
      type: 'object',
      // No 'required' array here, as all fields are optional for PATCH
      properties: {
        file: { type: 'string', format: 'binary', description: 'Optional: New file to replace the existing one.' },
        fileName: { type: 'string', example: 'updated_report.pdf', description: 'New user-defined name for the document.' },
        documentType: { type: 'string', example: 'Archive', description: 'New category or type.' },
        relatedToEntityType: { type: 'string', enum: Object.values(RelatedEntityType), description: 'New related entity type.' },
        relatedToEntityId: { type: 'string', format: 'uuid', description: 'New related entity ID.' },
        description: { type: 'string', example: 'Updated annual financial report.', description: 'New description.' },
        tags: { type: 'array', items: { type: 'string' }, example: ['finance', 'updated'], description: 'New tags.' },
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: any,
  ): Promise<Document> {
    return this.documentManagementService.update(id, updateDocumentDto, user, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document for the current user/company' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Document deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.documentManagementService.remove(id, user);
  }
}
