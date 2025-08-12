import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UploadedFile, UseInterceptors, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { InstitutionService } from '../services/institution.service';
import { 
  CreateFinancialInstitutionDto, 
  UpdateFinancialInstitutionDto, 
  FinancialInstitutionResponseDto,
  ApiResponseDto,
  ApiErrorResponseDto,
  PaginationDto,
  BranchDto,
  ExecutiveTeamMemberDto,
  BoardMemberDto
} from '../dto/financial-institution.dto';

// Define MulterFile interface for file uploads
interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  fieldname?: string;
}

@ApiTags('financial-institutions')
@ApiBearerAuth()
@Controller('financial-institutions')
export class FinancialInstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @ApiOperation({ summary: 'Create a new financial institution' })
  @ApiResponse({ 
    status: 201, 
    description: 'Financial institution created successfully',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request',
    type: ApiErrorResponseDto
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createFinancialInstitutionDto: CreateFinancialInstitutionDto): Promise<ApiResponseDto<FinancialInstitutionResponseDto>> {
    const institution = await this.institutionService.create(createFinancialInstitutionDto);
    return {
      success: true,
      data: institution
    };
  }

  @ApiOperation({ summary: 'Get all financial institutions' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all financial institutions',
    type: ApiResponseDto
  })
  @Get()
  async findAll(
    @Query('page') page = 1, 
    @Query('limit') limit = 10
  ): Promise<ApiResponseDto<FinancialInstitutionResponseDto[]>> {
    const [institutions, total] = await this.institutionService.findAll(page, limit);
    
    return {
      success: true,
      data: institutions,
      meta: {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  }

  @ApiOperation({ summary: 'Get a financial institution by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the financial institution',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Financial institution not found',
    type: ApiErrorResponseDto
  })
  @Get(':institutionId')
  async findOne(@Param('institutionId') id: string): Promise<ApiResponseDto<FinancialInstitutionResponseDto>> {
    const institution = await this.institutionService.findById(id);
    return {
      success: true,
      data: institution
    };
  }

  @ApiOperation({ summary: 'Update a financial institution' })
  @ApiResponse({ 
    status: 200, 
    description: 'Financial institution updated successfully',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Financial institution not found',
    type: ApiErrorResponseDto
  })
  @Patch(':institutionId')
  async update(
    @Param('institutionId') id: string, 
    @Body() updateFinancialInstitutionDto: UpdateFinancialInstitutionDto
  ): Promise<ApiResponseDto<FinancialInstitutionResponseDto>> {
    const updatedInstitution = await this.institutionService.update(id, updateFinancialInstitutionDto);
    return {
      success: true,
      data: updatedInstitution
    };
  }

  @ApiOperation({ summary: 'Upload institution logo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Logo uploaded successfully',
    type: ApiResponseDto
  })
  @Post(':institutionId/logo')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @Param('institutionId') id: string,
    @UploadedFile() logo: MulterFile
  ): Promise<ApiResponseDto<{ logo: string; message: string }>> {
    const logoUrl = await this.institutionService.uploadLogo(id, logo);
    return {
      success: true,
      data: {
        logo: logoUrl,
        message: 'Logo téléchargé avec succès'
      }
    };
  }

  @ApiOperation({ summary: 'Upload CEO photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Photo uploaded successfully',
    type: ApiResponseDto
  })
  @Post(':institutionId/ceo/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadCeoPhoto(
    @Param('institutionId') id: string,
    @UploadedFile() photo: MulterFile
  ): Promise<ApiResponseDto<{ photo: string; message: string }>> {
    const photoUrl = await this.institutionService.uploadCeoPhoto(id, photo);
    return {
      success: true,
      data: {
        photo: photoUrl,
        message: 'Photo téléchargée avec succès'
      }
    };
  }

  @ApiOperation({ summary: 'Add a branch' })
  @ApiResponse({ 
    status: 201, 
    description: 'Branch added successfully',
    type: ApiResponseDto
  })
  @Post(':institutionId/branches')
  @HttpCode(HttpStatus.CREATED)
  async addBranch(
    @Param('institutionId') id: string,
    @Body() branchDto: BranchDto
  ): Promise<ApiResponseDto<BranchDto>> {
    const branch = await this.institutionService.addBranch(id, branchDto);
    return {
      success: true,
      data: branch
    };
  }

  @ApiOperation({ summary: 'Delete a branch' })
  @ApiResponse({ 
    status: 200, 
    description: 'Branch deleted successfully',
    type: ApiResponseDto
  })
  @Delete(':institutionId/branches/:branchId')
  async removeBranch(
    @Param('institutionId') institutionId: string,
    @Param('branchId') branchId: string
  ): Promise<ApiResponseDto<{ message: string }>> {
    await this.institutionService.removeBranch(institutionId, branchId);
    return {
      success: true,
      data: {
        message: 'Agence supprimée avec succès'
      }
    };
  }

  @ApiOperation({ summary: 'Add an executive team member' })
  @ApiResponse({ 
    status: 201, 
    description: 'Executive team member added successfully',
    type: ApiResponseDto
  })
  @Post(':institutionId/leadership/executives')
  @HttpCode(HttpStatus.CREATED)
  async addExecutive(
    @Param('institutionId') id: string,
    @Body() executiveDto: ExecutiveTeamMemberDto
  ): Promise<ApiResponseDto<ExecutiveTeamMemberDto>> {
    const executive = await this.institutionService.addExecutive(id, executiveDto);
    return {
      success: true,
      data: executive
    };
  }

  @ApiOperation({ summary: 'Delete an executive team member' })
  @ApiResponse({ 
    status: 200, 
    description: 'Executive team member deleted successfully',
    type: ApiResponseDto
  })
  @Delete(':institutionId/leadership/executives/:executiveId')
  async removeExecutive(
    @Param('institutionId') institutionId: string,
    @Param('executiveId') executiveId: string
  ): Promise<ApiResponseDto<{ message: string }>> {
    await this.institutionService.removeExecutive(institutionId, executiveId);
    return {
      success: true,
      data: {
        message: 'Membre de l\'équipe de direction supprimé avec succès'
      }
    };
  }

  @ApiOperation({ summary: 'Add a board member' })
  @ApiResponse({ 
    status: 201, 
    description: 'Board member added successfully',
    type: ApiResponseDto
  })
  @Post(':institutionId/leadership/board')
  @HttpCode(HttpStatus.CREATED)
  async addBoardMember(
    @Param('institutionId') id: string,
    @Body() boardMemberDto: BoardMemberDto
  ): Promise<ApiResponseDto<BoardMemberDto>> {
    const boardMember = await this.institutionService.addBoardMember(id, boardMemberDto);
    return {
      success: true,
      data: boardMember
    };
  }

  @ApiOperation({ summary: 'Delete a board member' })
  @ApiResponse({ 
    status: 200, 
    description: 'Board member deleted successfully',
    type: ApiResponseDto
  })
  @Delete(':institutionId/leadership/board/:boardMemberId')
  async removeBoardMember(
    @Param('institutionId') institutionId: string,
    @Param('boardMemberId') boardMemberId: string
  ): Promise<ApiResponseDto<{ message: string }>> {
    await this.institutionService.removeBoardMember(institutionId, boardMemberId);
    return {
      success: true,
      data: {
        message: 'Membre du conseil d\'administration supprimé avec succès'
      }
    };
  }

  @ApiOperation({ summary: 'Validate a financial institution' })
  @ApiResponse({ 
    status: 200, 
    description: 'Financial institution validated successfully',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Financial institution not found',
    type: ApiErrorResponseDto
  })
  @Patch(':institutionId/validate')
  async validateInstitution(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Body() data: { validatedBy: string }
  ): Promise<ApiResponseDto<{ message: string }>> {
    await this.institutionService.validate(institutionId, data.validatedBy);
    return {
      success: true,
      data: {
        message: 'Institution financière validée avec succès'
      }
    };
  }

  @ApiOperation({ summary: 'Suspend a financial institution' })
  @ApiResponse({ 
    status: 200, 
    description: 'Financial institution suspended successfully',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Financial institution not found',
    type: ApiErrorResponseDto
  })
  @Patch(':institutionId/suspend')
  async suspendInstitution(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Body() data: { suspendedBy: string; reason: string }
  ): Promise<ApiResponseDto<{ message: string }>> {
    await this.institutionService.suspend(institutionId, data.suspendedBy, data.reason);
    return {
      success: true,
      data: {
        message: 'Institution financière suspendue avec succès'
      }
    };
  }

  @ApiOperation({ summary: 'Reject a financial institution' })
  @ApiResponse({ 
    status: 200, 
    description: 'Financial institution rejected successfully',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Financial institution not found',
    type: ApiErrorResponseDto
  })
  @Patch(':institutionId/reject')
  async rejectInstitution(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Body() data: { rejectedBy: string; reason: string }
  ): Promise<ApiResponseDto<{ message: string }>> {
    await this.institutionService.reject(institutionId, data.rejectedBy, data.reason);
    return {
      success: true,
      data: {
        message: 'Institution financière rejetée avec succès'
      }
    };
  }
}
