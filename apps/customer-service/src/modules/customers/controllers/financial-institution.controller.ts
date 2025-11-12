import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UploadedFile, UseInterceptors, HttpCode, HttpStatus, ParseUUIDPipe, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { InstitutionService } from '../services/institution.service';
import { 
  CreateFinancialInstitutionDto, 
  UpdateFinancialInstitutionDto, 
  FinancialInstitutionResponseDto,
  BranchDto,
  ExecutiveTeamMemberDto,
  BoardMemberDto
} from '../dto/financial-institution.dto';
import { 
  BaseCustomerController, 
  ApiResponseDto, 
  ApiErrorResponseDto, 
  PaginationDto,
  MulterFile
} from '../shared';

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
  async findAll(): Promise<ApiResponseDto<FinancialInstitutionResponseDto[]>> {
    const institutions = await this.institutionService.findAll();
    
    return {
      success: true,
      data: institutions
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
    @Body() updateFinancialInstitutionDto: UpdateFinancialInstitutionDto,
    @Req() req: any
  ): Promise<ApiResponseDto<FinancialInstitutionResponseDto>> {
    const auth0Id = req.user?.sub;
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
    // TODO: Implémenter l'upload de logo
    throw new Error('Upload de logo non implémenté');
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
    // TODO: Implémenter l'upload de photo CEO
    throw new Error('Upload de photo CEO non implémenté');
  }

  // TODO: Implémenter addBranch dans InstitutionService
  // @ApiOperation({ summary: 'Add a new branch to the institution' })
  // @ApiResponse({ 
  //   status: 201, 
  //   description: 'Branch added successfully',
  //   type: ApiResponseDto
  // })
  // @Post(':institutionId/branches')
  // @HttpCode(HttpStatus.CREATED)
  // async addBranch(
  //   @Param('institutionId') id: string,
  //   @Body() branchDto: BranchDto,
  //   @Req() req: any
  // ): Promise<ApiResponseDto<FinancialInstitutionResponseDto>> {
  //   const auth0Id = req.user?.sub;
  //   const institution = await this.institutionService.addBranch(id, branchDto, auth0Id);
  //   return {
  //     success: true,
  //     data: institution
  //   };
  // }

  // TODO: Implémenter removeBranch dans InstitutionService
  // @ApiOperation({ summary: 'Delete a branch' })
  // @ApiResponse({ 
  //   status: 200, 
  //   description: 'Branch deleted successfully',
  //   type: ApiResponseDto
  // })
  // @Delete(':institutionId/branches/:branchId')
  // async removeBranch(
  //   @Param('institutionId') institutionId: string,
  //   @Param('branchId') branchId: string,
  //   @Req() req: any
  // ): Promise<ApiResponseDto<FinancialInstitutionResponseDto>> {
  //   const auth0Id = req.user?.sub;
  //   const institution = await this.institutionService.removeBranch(institutionId, branchId, auth0Id);
  //   return {
  //     success: true,
  //     data: institution
  //   };
  // }

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
    // TODO: Implémenter l'ajout d'executives
    throw new Error('Ajout d\'executives non implémenté');
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
    // TODO: Implémenter la suppression d'executives
    throw new Error('Suppression d\'executives non implémenté');
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
    // TODO: Implémenter l'ajout de membres du conseil
    throw new Error('Ajout de membres du conseil non implémenté');
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
    // TODO: Implémenter la suppression de membres du conseil
    throw new Error('Suppression de membres du conseil non implémenté');
  }
}
