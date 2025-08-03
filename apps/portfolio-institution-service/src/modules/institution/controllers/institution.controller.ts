import { Controller, Get, Post, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InstitutionService } from '../services/institution.service';
import { CreateInstitutionDto, UpdateInstitutionDto } from '../dtos/institution.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('institution')
@Controller('institution')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Post('profile')
  @ApiOperation({ summary: 'Complete institution profile' })
  @ApiResponse({ status: 201, description: 'Institution profile created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createProfile(@Body() createInstitutionDto: CreateInstitutionDto, @Req() req: any) {
    const institution = await this.institutionService.create(createInstitutionDto, req.user.id);
    return {
      success: true,
      institution,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get institution information' })
  @ApiResponse({ status: 200, description: 'Institution information retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  async getInstitution(@Req() req: any) {
    const institution = await this.institutionService.findById(req.user.institutionId);
    return {
      success: true,
      data: institution,
    };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get institution profile' })
  @ApiResponse({ status: 200, description: 'Institution profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  async getProfile(@Req() req: any) {
    const institution = await this.institutionService.findById(req.user.institutionId);
    return {
      success: true,
      institution,
    };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update institution profile' })
  @ApiResponse({ status: 200, description: 'Institution profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  async updateProfile(
    @Body() updateInstitutionDto: UpdateInstitutionDto,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new Error('User ID not found in request. Ensure authentication is working correctly.');
    }
    const institution = await this.institutionService.update(
      req.user.institutionId,
      updateInstitutionDto,
      req.user.id,
    );
    return {
      success: true,
      institution,
    };
  }

  @Post('documents')
  @ApiOperation({ summary: 'Add institution document' })
  @ApiResponse({ status: 201, description: 'Document added successfully' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  async addDocument(
    @Body() document: {
      name: string;
      type: string;
      cloudinaryUrl: string;
      description?: string;
      validUntil?: Date;
    },
    @Req() req: any,
  ) {
    const newDocument = await this.institutionService.addDocument(
      req.user.institutionId,
      document,
      req.user.id,
    );
    return {
      success: true,
      document: newDocument,
    };
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get institution documents' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  async getDocuments(@Req() req: any) {
    const documents = await this.institutionService.getDocuments(req.user.institutionId);
    return {
      success: true,
      documents,
    };
  }
}