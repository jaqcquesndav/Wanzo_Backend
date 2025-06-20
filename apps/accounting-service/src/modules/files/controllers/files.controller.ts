import { Controller, Post, UseGuards, Request, UploadedFile, UseInterceptors, Body, Get, Param, Query, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FilesService } from '../services/files.service';
import { UploadFileDto } from '../dtos/upload-file.dto';
import { File as FileEntity, FileCategory, FileEntityType } from '../entities/file.entity'; // Renamed to avoid conflict
import { Request as ExpressRequest } from 'express';
import { UpdateFileDto } from '../dtos/update-file.dto';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload data',
    type: UploadFileDto,
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully', type: FileEntity })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
    @Request() req: ExpressRequest & { user: { companyId: string, id: string } },
  ) {
    const newFile = await this.filesService.uploadFile(file, uploadFileDto, req.user.companyId, req.user.id);
    return { success: true, data: newFile };
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of files' })
  @ApiQuery({ name: 'entityType', required: false, enum: FileEntityType })
  @ApiQuery({ name: 'entityId', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, enum: FileCategory })
  @ApiResponse({ status: 200, description: 'List of files', type: [FileEntity] })
  async getFiles(
    @Request() req: ExpressRequest & { user: { companyId: string } },
    @Query('entityType') entityType?: FileEntityType,
    @Query('entityId') entityId?: string,
    @Query('category') category?: FileCategory,
  ) {
    const files = await this.filesService.getFiles({ entityType, entityId, category, companyId: req.user.companyId });
    return { success: true, data: files };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file information' })
  @ApiResponse({ status: 200, description: 'File details', type: FileEntity })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { companyId: string } },
  ) {
    const file = await this.filesService.getFile(id, req.user.companyId);
    return { success: true, data: file };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update file information' })
  @ApiResponse({ status: 200, description: 'File updated successfully', type: FileEntity })
  async updateFile(
    @Param('id') id: string,
    @Body() updateFileDto: UpdateFileDto,
    @Request() req: ExpressRequest & { user: { companyId: string } },
  ) {
    const updatedFile = await this.filesService.updateFile(id, updateFileDto, req.user.companyId);
    return { success: true, data: updatedFile };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 204, description: 'File deleted successfully' })
  async deleteFile(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { companyId: string } },
  ) {
    await this.filesService.deleteFile(id, req.user.companyId);
    return { success: true, message: 'File deleted successfully' };
  }
}
