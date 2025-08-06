import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { DeclarationService } from './services/declaration.service';
import { 
  CreateDeclarationDto, 
  UpdateDeclarationDto, 
  UpdateDeclarationStatusDto,
  DeclarationFilterDto
} from './dtos/declaration.dto';

@ApiTags('Declarations')
@Controller('declarations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeclarationController {
  constructor(private readonly declarationService: DeclarationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tax declaration' })
  @ApiResponse({ status: 201, description: 'Declaration created successfully' })
  async create(@Body() createDeclarationDto: CreateDeclarationDto, @Req() req: Request) {
    try {
      const userId = (req.user as any).sub;
      const declaration = await this.declarationService.create(createDeclarationDto, userId);
      return {
        success: true,
        data: declaration
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create declaration'
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all tax declarations' })
  @ApiResponse({ status: 200, description: 'Declarations retrieved successfully' })
  async findAll(@Query() query: DeclarationFilterDto, @Req() req: Request) {
    try {
      const result = await this.declarationService.findAll(query);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get declarations'
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific tax declaration' })
  @ApiResponse({ status: 200, description: 'Declaration retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Declaration not found' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    try {
      const declaration = await this.declarationService.findById(id);
      return {
        success: true,
        data: declaration
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get declaration'
      };
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tax declaration' })
  @ApiResponse({ status: 200, description: 'Declaration updated successfully' })
  @ApiResponse({ status: 404, description: 'Declaration not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDeclarationDto: UpdateDeclarationDto,
    @Req() req: Request
  ) {
    try {
      const userId = (req.user as any).sub;
      const declaration = await this.declarationService.update(id, updateDeclarationDto, userId);
      return {
        success: true,
        data: declaration
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update declaration'
      };
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update declaration status' })
  @ApiResponse({ status: 200, description: 'Declaration status updated successfully' })
  @ApiResponse({ status: 404, description: 'Declaration not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateDeclarationStatusDto,
    @Req() req: Request
  ) {
    try {
      const userId = (req.user as any).sub;
      const declaration = await this.declarationService.updateStatus(id, updateStatusDto, userId);
      return {
        success: true,
        data: declaration
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update declaration status'
      };
    }
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Upload an attachment to a declaration' })
  @ApiResponse({ status: 200, description: 'Attachment uploaded successfully' })
  @UseInterceptors(FileInterceptor('attachment'))
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
    @Req() req: Request
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Fichier manquant');
      }
      
      const userId = (req.user as any).sub;
      const attachment = await this.declarationService.addAttachment(id, file, type, userId);
      
      return {
        success: true,
        data: attachment
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload attachment'
      };
    }
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'Get all attachments for a declaration' })
  @ApiResponse({ status: 200, description: 'Attachments retrieved successfully' })
  async getAttachments(@Param('id') id: string) {
    try {
      const attachments = await this.declarationService.getAttachments(id);
      return {
        success: true,
        data: attachments
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get attachments'
      };
    }
  }

  @Post(':id/justification')
  @ApiOperation({ summary: 'Upload justification document' })
  @ApiResponse({ status: 200, description: 'Justification uploaded successfully' })
  @UseInterceptors(FileInterceptor('justification'))
  async uploadJustification(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Fichier manquant');
      }
      
      const userId = (req.user as any).sub;
      const attachment = await this.declarationService.addAttachment(id, file, 'justification', userId);
      
      // Mettre à jour le champ justificationDocument dans la déclaration
      await this.declarationService.update(id, { justificationDocument: attachment.url }, userId);
      
      return {
        success: true,
        data: { url: attachment.url }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload justification'
      };
    }
  }

  @Post(':id/declaration-form')
  @ApiOperation({ summary: 'Upload declaration form' })
  @ApiResponse({ status: 200, description: 'Form uploaded successfully' })
  @UseInterceptors(FileInterceptor('declaration_form'))
  async uploadDeclarationForm(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Fichier manquant');
      }
      
      const userId = (req.user as any).sub;
      const attachment = await this.declarationService.addAttachment(id, file, 'declaration_form', userId);
      
      // Mettre à jour le champ declarationForm dans la déclaration
      await this.declarationService.update(id, { declarationForm: attachment.url }, userId);
      
      return {
        success: true,
        data: { url: attachment.url }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload form'
      };
    }
  }
  
  @Get('statistics')
  @ApiOperation({ summary: 'Get declaration statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(@Query('period') period?: string) {
    try {
      const stats = await this.declarationService.getStatistics(period);
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get statistics'
      };
    }
  }
}
