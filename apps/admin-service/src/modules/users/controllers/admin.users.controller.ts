import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UsersService } from '../services';
import { CreateUserDto, UpdateUserDto, UserFilterDto, UserDto, ToggleStatusDto, ResetPasswordDto } from '../dtos';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../entities/enums';

@ApiTags('Admin Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List users' })
  @ApiResponse({ status: 200, description: 'List of users.', type: [UserDto] })
  findAll(@Query() filterDto: UserFilterDto) {
    return this.usersService.findAll(filterDto);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.', type: UserDto })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'The user.', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'The user has been successfully updated.', type: UserDto })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 204, description: 'The user has been successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':userId/reset-password')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Reset a user's password" })
  @ApiResponse({ status: 200, description: 'Password reset initiated.' })
  resetPassword(@Param('userId') userId: string) {
    return this.usersService.resetPassword(userId);
  }

  @Post(':userId/toggle-status')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle user status (activate/deactivate)' })
  @ApiResponse({ status: 200, description: 'User status has been updated.', type: UserDto })
  toggleUserStatus(@Param('userId') userId: string, @Body() toggleStatusDto: ToggleStatusDto) {
    return this.usersService.toggleUserStatus(userId, toggleStatusDto);
  }

  @Get(':id/activities')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get user activities' })
  @ApiResponse({ status: 200, description: 'List of user activities.' })
  getUserActivities(@Param('id') id: string) {
    return this.usersService.getUserActivities(id);
  }

  @Get(':id/sessions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get user sessions' })
  @ApiResponse({ status: 200, description: 'List of user sessions.' })
  getUserSessions(@Param('id') id: string) {
    return this.usersService.getUserSessions(id);
  }
}
