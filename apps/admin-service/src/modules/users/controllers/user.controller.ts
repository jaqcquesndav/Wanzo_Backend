import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ActivityService } from '../../activities/services/activity.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly activityService: ActivityService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users', description: 'Retrieve a paginated list of users' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'per_page', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for filtering users' })
  @ApiQuery({ name: 'company_id', required: false, type: String, description: 'Filter by company ID' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Query('search') search?: string,
    @Query('company_id') companyId?: string,
    @Req() req?: any
  ) {
    // Si l'utilisateur est un superadmin d'entreprise, filtrer par son entreprise
    if (req.user.role === 'superadmin' && !req.user.isSystemAdmin) {
      companyId = req.user.companyId;
    }
    
    const result = await this.userService.findAll(+page, +perPage, search, companyId);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string, @Req() req?: any) {
    const user = await this.userService.findById(id);
    
    // Vérifier que l'utilisateur a le droit de voir cet utilisateur
    if (req.user.role !== 'admin' && req.user.id !== id) {
      // Si c'est un superadmin, vérifier qu'il appartient à la même entreprise
      if (req.user.role === 'superadmin' && user.companyId !== req.user.companyId) {
        throw new UnauthorizedException('You are not authorized to view this user');
      }
    }
    
    return {
      success: true,
      user,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createUserDto: CreateUserDto, @Req() req?: any) {
    // Si l'utilisateur est un superadmin d'entreprise, forcer l'entreprise
    if (req.user.role === 'superadmin' && !req.user.isSystemAdmin) {
      createUserDto.companyId = req.user.companyId;
    }
    
    // Vérifier que le rôle est valide selon le rôle de l'utilisateur actuel
    if (req.user.role === 'superadmin' && !req.user.isSystemAdmin) {
      // Un superadmin d'entreprise ne peut pas créer d'admin système ou de superadmin
      if (['admin', 'superadmin'].includes(createUserDto.role)) {
        throw new UnauthorizedException('You are not authorized to create this type of user');
      }
    }
    
    const user = await this.userService.create(createUserDto);
    
    // Journaliser l'activité
    await this.activityService.logUserActivity(
      req.user.id,
      'USER_CREATED',
      `User ${user.name} was created`,
      { userId: user.id }
    );
    
    return {
      success: true,
      user,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req?: any
  ) {
    const existingUser = await this.userService.findById(id);
    
    // Vérifier que l'utilisateur a le droit de modifier cet utilisateur
    if (req.user.role !== 'admin') {
      // Si c'est un superadmin, vérifier qu'il appartient à la même entreprise
      if (req.user.role === 'superadmin') {
        if (existingUser.companyId !== req.user.companyId) {
          throw new UnauthorizedException('You are not authorized to update this user');
        }
        
        // Un superadmin ne peut pas changer le rôle vers admin ou superadmin
        if (updateUserDto.role && ['admin', 'superadmin'].includes(updateUserDto.role)) {
          throw new UnauthorizedException('You are not authorized to assign this role');
        }
      } else if (req.user.id !== id) {
        // Un utilisateur normal ne peut modifier que son propre profil
        throw new UnauthorizedException('You are not authorized to update this user');
      }
    }
    
    const user = await this.userService.update(id, updateUserDto);
    
    // Journaliser l'activité
    await this.activityService.logUserActivity(
      req.user.id,
      'USER_UPDATED',
      `User ${user.name} was updated`,
      { userId: user.id }
    );
    
    return {
      success: true,
      user,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string, @Req() req?: any) {
    const existingUser = await this.userService.findById(id);
    
    // Vérifier que l'utilisateur a le droit de supprimer cet utilisateur
    if (req.user.role !== 'admin') {
      // Si c'est un superadmin, vérifier qu'il appartient à la même entreprise
      if (req.user.role === 'superadmin' && existingUser.companyId !== req.user.companyId) {
        throw new UnauthorizedException('You are not authorized to delete this user');
      }
    }
    
    // Journaliser l'activité avant la suppression
    await this.activityService.logUserActivity(
      req.user.id,
      'USER_DELETED',
      `User ${existingUser.name} was deleted`,
      { userId: existingUser.id }
    );
    
    return await this.userService.delete(id);
  }

  @Post(':id/verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification token' })
  async verifyEmail(@Body('token') token: string) {
    const user = await this.userService.verifyEmail(token);
    return {
      success: true,
      user,
    };
  }

  @Post(':id/invite')
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Invite new user to company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'name', 'role'],
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
        role: { type: 'string' },
        permissions: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              application: { type: 'string' },
              access: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'User invited successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async inviteUser(
    @Param('id') companyId: string,
    @Body() inviteData: { email: string; name: string; role: string; permissions?: any[] },
    @Req() req?: any
  ) {
    // Vérifier que l'utilisateur a le droit d'inviter des utilisateurs pour cette entreprise
    if (req.user.role !== 'admin') {
      if (req.user.role === 'superadmin' && req.user.companyId !== companyId) {
        throw new UnauthorizedException('You are not authorized to invite users to this company');
      }
    }
    
    // Vérifier que le rôle est valide
    if (req.user.role === 'superadmin' && !req.user.isSystemAdmin) {
      if (['admin', 'superadmin'].includes(inviteData.role)) {
        throw new UnauthorizedException('You are not authorized to assign this role');
      }
    }
    
    const user = await this.userService.inviteUser({
      ...inviteData,
      companyId,
      invitedBy: req.user.id
    });
    
    // Journaliser l'activité
    await this.activityService.logUserActivity(
      req.user.id,
      'USER_INVITED',
      `User ${inviteData.name} was invited`,
      { userId: user.id, companyId }
    );
    
    return {
      success: true,
      message: 'User invited successfully',
      user,
    };
  }
}