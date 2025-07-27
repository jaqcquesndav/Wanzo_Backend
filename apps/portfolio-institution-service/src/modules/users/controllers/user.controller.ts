import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { UserActivityService } from '../services/user-activity.service';
import { UserPreferenceService } from '../services/user-preference.service';
import { UserSessionService } from '../services/user-session.service';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto, 
  UserSearchFilterDto,
  UserActivityResponseDto,
  UserPreferenceDto,
  UserSessionResponseDto,
  ChangeUserStatusDto
} from '../dto/user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PreferenceCategory } from '../entities/user-preference.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userActivityService: UserActivityService,
    private readonly userPreferenceService: UserPreferenceService,
    private readonly userSessionService: UserSessionService
  ) {}

  @Get()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get all users for the institution' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(
    @Req() req: any,
    @Query() filters: UserSearchFilterDto
  ) {
    const [users, total] = await this.userService.findAll(req.user.institutionId, filters);
    return {
      success: true,
      data: users,
      total,
      page: 1,
      limit: users.length
    };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@Req() req: any) {
    const user = await this.userService.findById(req.user.institutionId, req.user.id);
    return {
      success: true,
      data: user
    };
  }

  @Get(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const user = await this.userService.findById(req.user.institutionId, id);
    return {
      success: true,
      data: user
    };
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(@Req() req: any, @Body() createUserDto: CreateUserDto) {
    // Set institutionId from authenticated user
    createUserDto.institutionId = req.user.institutionId;
    
    const user = await this.userService.create(createUserDto, req.user.id);
    return {
      success: true,
      data: user
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    const user = await this.userService.update(req.user.institutionId, id, updateUserDto, req.user.id);
    return {
      success: true,
      data: user
    };
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Change user status' })
  @ApiResponse({ status: 200, description: 'User status changed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changeStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() statusDto: ChangeUserStatusDto
  ) {
    const user = await this.userService.changeStatus(req.user.institutionId, id, statusDto, req.user.id);
    return {
      success: true,
      data: user
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.userService.delete(req.user.institutionId, id);
    return {
      success: true,
      message: 'User deleted successfully'
    };
  }

  // User Activities

  @Get(':id/activities')
  @Roles('admin', 'manager', 'analyst')
  @ApiOperation({ summary: 'Get user activities' })
  @ApiResponse({ status: 200, description: 'User activities retrieved successfully' })
  async getUserActivities(@Req() req: any, @Param('id') id: string) {
    const activities = await this.userActivityService.getUserActivities(req.user.institutionId, id);
    return {
      success: true,
      data: activities
    };
  }

  // User Preferences

  @Get(':id/preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences retrieved successfully' })
  async getUserPreferences(
    @Req() req: any,
    @Param('id') id: string,
    @Query('category') category?: string
  ) {
    if (category) {
      const preferences = await this.userPreferenceService.getPreferencesByCategory(
        req.user.institutionId, 
        id, 
        category as PreferenceCategory
      );
      return {
        success: true,
        data: preferences
      };
    }
    
    const preferences = await this.userPreferenceService.getPreferences(req.user.institutionId, id);
    return {
      success: true,
      data: preferences
    };
  }

  @Post(':id/preferences')
  @ApiOperation({ summary: 'Set user preference' })
  @ApiResponse({ status: 201, description: 'User preference set successfully' })
  async setUserPreference(
    @Req() req: any,
    @Param('id') id: string,
    @Body() preferenceDto: UserPreferenceDto
  ) {
    // Check if user is updating their own preferences or has admin role
    if (id !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
      return {
        success: false,
        message: 'You do not have permission to update preferences for this user'
      };
    }
    
    const preference = await this.userPreferenceService.setPreference(
      req.user.institutionId, 
      id, 
      preferenceDto
    );
    
    return {
      success: true,
      data: preference
    };
  }

  @Delete(':id/preferences/:preferenceId')
  @ApiOperation({ summary: 'Delete user preference' })
  @ApiResponse({ status: 200, description: 'User preference deleted successfully' })
  async deleteUserPreference(
    @Req() req: any,
    @Param('id') id: string,
    @Param('preferenceId') preferenceId: string
  ) {
    // Check if user is deleting their own preferences or has admin role
    if (id !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
      return {
        success: false,
        message: 'You do not have permission to delete preferences for this user'
      };
    }
    
    await this.userPreferenceService.deletePreference(
      req.user.institutionId, 
      id, 
      preferenceId
    );
    
    return {
      success: true,
      message: 'Preference deleted successfully'
    };
  }

  // User Sessions

  @Get(':id/sessions')
  @ApiOperation({ summary: 'Get user active sessions' })
  @ApiResponse({ status: 200, description: 'User sessions retrieved successfully' })
  async getUserSessions(@Req() req: any, @Param('id') id: string) {
    // Check if user is viewing their own sessions or has admin role
    if (id !== req.user.id && !['admin'].includes(req.user.role)) {
      return {
        success: false,
        message: 'You do not have permission to view sessions for this user'
      };
    }
    
    const sessions = await this.userSessionService.getUserSessions(req.user.institutionId, id);
    return {
      success: true,
      data: sessions
    };
  }

  @Delete(':id/sessions/:sessionId')
  @ApiOperation({ summary: 'Terminate user session' })
  @ApiResponse({ status: 200, description: 'User session terminated successfully' })
  async terminateSession(
    @Req() req: any,
    @Param('id') id: string,
    @Param('sessionId') sessionId: string
  ) {
    // Check if user is terminating their own session or has admin role
    if (id !== req.user.id && !['admin'].includes(req.user.role)) {
      return {
        success: false,
        message: 'You do not have permission to terminate sessions for this user'
      };
    }
    
    await this.userSessionService.terminateSession(req.user.institutionId, id, sessionId);
    return {
      success: true,
      message: 'Session terminated successfully'
    };
  }

  @Delete(':id/sessions')
  @ApiOperation({ summary: 'Terminate all user sessions' })
  @ApiResponse({ status: 200, description: 'All user sessions terminated successfully' })
  async terminateAllSessions(
    @Req() req: any,
    @Param('id') id: string,
    @Query('exceptCurrent') exceptCurrent?: boolean
  ) {
    // Check if user is terminating their own sessions or has admin role
    if (id !== req.user.id && !['admin'].includes(req.user.role)) {
      return {
        success: false,
        message: 'You do not have permission to terminate sessions for this user'
      };
    }
    
    const exceptSessionId = exceptCurrent ? req.sessionId : undefined;
    await this.userSessionService.terminateAllSessions(req.user.institutionId, id, exceptSessionId);
    
    return {
      success: true,
      message: 'All sessions terminated successfully'
    };
  }
}
