import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { UserActivityService } from '../services/user-activity.service';
import { 
  CreateUserDto, 
  ChangeUserStatusDto, 
  UserSearchFilterDto 
} from '../dto/user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('admin/users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class AdminUserController {
  constructor(
    private readonly userService: UserService,
    private readonly userActivityService: UserActivityService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get all users for the institution' })
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

  @Post()
  @ApiOperation({ summary: 'Admin: Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(@Req() req: any, @Body() createUserDto: CreateUserDto) {
    // Set institutionId from authenticated admin
    createUserDto.institutionId = req.user.institutionId;
    
    const user = await this.userService.create(createUserDto, req.user.id);
    return {
      success: true,
      data: user,
      message: 'User created successfully'
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: Change user status' })
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
      data: user,
      message: `User status changed to ${statusDto.status}`
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.userService.delete(req.user.institutionId, id);
    return {
      success: true,
      message: 'User deleted successfully'
    };
  }

  @Get('activities')
  @ApiOperation({ summary: 'Admin: Get all institution user activities' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  async getInstitutionActivities(
    @Req() req: any,
    @Query('limit') limit?: number
  ) {
    const activities = await this.userActivityService.getInstitutionActivities(
      req.user.institutionId,
      limit || 100
    );
    
    return {
      success: true,
      data: activities,
      total: activities.length
    };
  }
}
