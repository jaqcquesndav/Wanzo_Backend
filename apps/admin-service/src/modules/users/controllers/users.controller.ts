import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express'; // Import Request
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from '../services';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserQueryParamsDto, 
  UserSessionsQueryDto, 
  UserActivityQueryDto,
  ChangePasswordDto,
  ResetPasswordRequestDto,
  ResetPasswordDto,
  RolePermissionsUpdateDto
} from '../dtos/user.dto';
import { JwtBlacklistGuard } from '../../auth/guards/jwt-blacklist.guard'; // Added
import { RolesGuard } from '../../auth/guards/roles.guard'; // Added
import { Roles } from '../../auth/decorators/roles.decorator'; // Added
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'; // Added ApiBearerAuth and ApiTags

@ApiTags('Admin Users') // Added
@ApiBearerAuth() // Added
@UseGuards(JwtBlacklistGuard, RolesGuard) // Added
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query() queryParams: UserQueryParamsDto) {
    return this.usersService.findAll(queryParams);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':userId/reset-password')
  async resetPassword(@Param('userId') userId: string) {
    return this.usersService.adminResetPassword(userId);
  }
  @Post(':userId/toggle-status')
  async toggleStatus(
    @Param('userId') userId: string, 
    @Body() body: { active: boolean, reason?: string },
    @Req() req: Request
  ) {
    if (typeof body.active !== 'boolean') {
      throw new BadRequestException('active field must be a boolean');
    }
    
    // Get the ID of the user making the change
    const changedBy = req.user?.id || 'system';
    
    return this.usersService.toggleUserStatus(userId, body.active, changedBy, body.reason);
  }

  @Get(':id/activities')
  async getUserActivities(
    @Param('id') userId: string, 
    @Query() queryParams: UserActivityQueryDto
  ) {
    return this.usersService.getUserActivities({ ...queryParams, userId });
  }

  @Get(':id/sessions')
  async getUserSessions(
    @Param('id') userId: string,
    @Query() queryParams: UserSessionsQueryDto
  ) {
    return this.usersService.getUserSessions({ ...queryParams, userId });
  }

  @Delete('sessions/:sessionId')
  async terminateSession(@Param('sessionId') sessionId: string) {
    return this.usersService.terminateSession(sessionId);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('id') userId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Here you would process the file, upload to a storage service, etc.
    // For this example, we'll just return a mock URL
    const avatarUrl = `https://example.com/avatars/${userId}-${Date.now()}.jpg`;

    // Update the user's avatar URL
    await this.usersService.update(userId, { avatar: avatarUrl });

    return { avatarUrl };
  }

  @Get('statistics')
  async getUserStatistics() {
    return this.usersService.getUserStatistics();
  }
}

@ApiTags('Users') // Added
@ApiBearerAuth() // Added
@UseGuards(JwtBlacklistGuard, RolesGuard) // Added
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Req() req: Request) { // Type req as Request
    // Assuming the authenticated user's ID is available in the request
    // This would typically be handled by an authentication guard/middleware
    const userId = (req as any).user?.id;
    return this.usersService.getProfile(userId);
  }

  @Put('update')
  async updateProfile(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) { // Type req as Request
    const userId = (req as any).user?.id;
    return this.usersService.updateProfile(userId, updateUserDto);
  }

  @Post('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(changePasswordDto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Req() req: Request, @UploadedFile() file: Express.Multer.File) { // Type req as Request
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = (req as any).user?.id;

    // Here you would process the file, upload to a storage service, etc.
    // For this example, we'll just return a mock URL
    const avatarUrl = `https://example.com/avatars/${userId}-${Date.now()}.jpg`;

    // Update the user's avatar URL
    await this.usersService.updateProfile(userId, { avatar: avatarUrl });

    return { avatarUrl };
  }
}

@ApiTags('Admin Roles') // Added
@ApiBearerAuth() // Added
@UseGuards(JwtBlacklistGuard, RolesGuard) // Added
@Controller('admin/roles')
export class RolesController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllRoles() {
    return this.usersService.getAllRolesWithPermissions();
  }

  @Get(':role')
  async getRolePermissions(@Param('role') role: string) {
    return this.usersService.getRolePermissions(role);
  }

  @Put(':role')
  async updateRolePermissions(
    @Param('role') role: string,
    @Body() updateDto: RolePermissionsUpdateDto
  ) {
    return this.usersService.updateRolePermissions(role, updateDto);
  }
}
