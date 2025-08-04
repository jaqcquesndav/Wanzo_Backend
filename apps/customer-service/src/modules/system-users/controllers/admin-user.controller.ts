import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards, HttpStatus, HttpCode, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto, ApiResponseDto, ApiErrorResponseDto } from '../dto/user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminRoleGuard } from '../../auth/guards/admin-role.guard';
import { MulterFile } from '../../cloudinary/cloudinary.service';

@ApiTags('admin/users')
@ApiBearerAuth()
@Controller('land/api/v1/admin/users')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs (admin)' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée', type: ApiResponseDto })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('customerId') customerId?: string
  ): Promise<ApiResponseDto<{ users: UserResponseDto[], total: number, page: number, limit: number }>> {
    const [users, total] = await this.userService.findAll(page, limit, customerId);
    
    return {
      success: true,
      data: {
        users,
        total,
        page,
        limit
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID (admin)' })
  @ApiResponse({ status: 200, description: 'Utilisateur récupéré', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé', type: ApiErrorResponseDto })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.userService.findOne(id);
    
    return {
      success: true,
      data: user
    };
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel utilisateur (admin)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides', type: ApiErrorResponseDto })
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.userService.create(createUserDto);
    
    return {
      success: true,
      data: user
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur (admin)' })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé', type: ApiErrorResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.userService.update(id, updateUserDto);
    
    return {
      success: true,
      data: user
    };
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activer un utilisateur (admin)' })
  @ApiResponse({ status: 200, description: 'Utilisateur activé', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé', type: ApiErrorResponseDto })
  async activate(@Param('id') id: string): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.userService.activate(id);
    
    return {
      success: true,
      data: user
    };
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Désactiver un utilisateur (admin)' })
  @ApiResponse({ status: 200, description: 'Utilisateur désactivé', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé', type: ApiErrorResponseDto })
  async deactivate(@Param('id') id: string): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.userService.deactivate(id);
    
    return {
      success: true,
      data: user
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un utilisateur (admin)' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé', type: ApiErrorResponseDto })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<{ message: string }>> {
    await this.userService.remove(id);
    
    return {
      success: true,
      data: {
        message: 'Utilisateur supprimé avec succès'
      }
    };
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Récupérer les activités d\'un utilisateur (admin)' })
  @ApiResponse({ status: 200, description: 'Activités récupérées', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé', type: ApiErrorResponseDto })
  async getUserActivities(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<ApiResponseDto<{ activities: any[], total: number, page: number, limit: number }>> {
    const [activities, total] = await this.userService.getUserActivities(id, page, limit);
    
    return {
      success: true,
      data: {
        activities,
        total,
        page,
        limit
      }
    };
  }

  @Post(':id/identity-document')
  @UseInterceptors(FileInterceptor('idDocument'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Télécharger une pièce d\'identité pour un utilisateur (admin)' })
  @ApiResponse({ status: 200, description: 'Document d\'identité téléchargé', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé', type: ApiErrorResponseDto })
  async uploadIdentityDocument(
    @Param('id') id: string,
    @Body('idType') idType: string,
    @UploadedFile() file: MulterFile
  ): Promise<ApiResponseDto<{ idType: string, idStatus: string, message: string }>> {
    const result = await this.userService.uploadIdentityDocument(id, file, idType);
    
    return {
      success: true,
      data: {
        idType: result.idType,
        idStatus: result.idStatus,
        message: 'Document d\'identité téléchargé avec succès et en attente de vérification'
      }
    };
  }
}
