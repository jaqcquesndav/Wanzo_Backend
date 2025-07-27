import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  Put, 
  Delete, 
  UseInterceptors, 
  UploadedFile, 
  Res, 
  HttpStatus, 
  BadRequestException,
  Req,
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentService } from '../services/document.service';
import { 
  CreateDocumentDto, 
  UpdateDocumentDto, 
  DocumentFilterDto, 
  DocumentResponseDto 
} from '../dtos/document.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Créer un nouveau document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        name: { type: 'string' },
        type: { type: 'string', enum: ['CONTRACT', 'INVOICE', 'ID_PROOF', 'FUNDING_AGREEMENT', 'DISBURSEMENT_PROOF', 'REPAYMENT_PROOF', 'OTHER'] },
        description: { type: 'string' },
        funding_request_id: { type: 'string' },
        contract_id: { type: 'string' },
        disbursement_id: { type: 'string' },
        repayment_id: { type: 'string' },
        metadata: {
          type: 'object',
          properties: {
            tags: { type: 'array', items: { type: 'string' } },
            expiry_date: { type: 'string', format: 'date-time' },
            custom_fields: { type: 'object' }
          }
        }
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document créé avec succès', type: DocumentResponseDto })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }
    
    const userId = req.user?.id || 'system';
    return this.documentService.create(file, createDocumentDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les documents' })
  @ApiResponse({ status: 200, description: 'Liste des documents', type: [DocumentResponseDto] })
  async findAll(@Query() filters: DocumentFilterDto) {
    return this.documentService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un document par ID' })
  @ApiResponse({ status: 200, description: 'Document trouvé', type: DocumentResponseDto })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Télécharger un document' })
  @ApiResponse({ status: 200, description: 'Fichier téléchargé' })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const { buffer, document } = await this.documentService.getDocumentContent(id);
    
    res.set({
      'Content-Type': document.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename=${document.name}`,
      'Content-Length': buffer.length,
    });
    
    res.end(buffer);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un document' })
  @ApiResponse({ status: 200, description: 'Document mis à jour', type: DocumentResponseDto })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentService.update(id, updateDocumentDto);
  }

  @Put(':id/file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Remplacer le fichier d\'un document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Fichier remplacé', type: DocumentResponseDto })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async replaceFile(
    @Param('id') id: string, 
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }
    
    const userId = req.user?.id || 'system';
    return this.documentService.replaceFile(id, file, userId);
  }

  @Put(':id/archive')
  @ApiOperation({ summary: 'Archiver un document' })
  @ApiResponse({ status: 200, description: 'Document archivé', type: DocumentResponseDto })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async archive(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || 'system';
    return this.documentService.archive(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer logiquement un document' })
  @ApiResponse({ status: 200, description: 'Document supprimé logiquement' })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async softDelete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || 'system';
    return this.documentService.softDelete(id, userId);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Supprimer définitivement un document' })
  @ApiResponse({ status: 204, description: 'Document supprimé définitivement' })
  @ApiResponse({ status: 404, description: 'Document non trouvé' })
  async hardDelete(@Param('id') id: string, @Res() res: Response, @Req() req: any) {
    const userId = req.user?.id || 'system';
    await this.documentService.hardDelete(id, userId);
    res.status(HttpStatus.NO_CONTENT).send();
  }
}
