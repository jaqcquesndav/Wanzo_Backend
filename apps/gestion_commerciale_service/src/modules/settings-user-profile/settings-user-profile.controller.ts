import { Controller, Get, Put, Body, UseGuards, Param, Delete, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { SettingsUserProfileService } from './settings-user-profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { CreateBusinessSectorDto, UpdateBusinessSectorDto } from './dto/business-sector.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UserProfile } from './entities/user-profile.entity';
import { AppSettings } from './entities/app-settings.entity';
import { NotificationSettings } from './entities/notification-settings.entity';
import { BusinessSector } from './entities/business-sector.entity';

@ApiTags('User Profile & Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SettingsUserProfileController {
  constructor(private readonly settingsUserProfileService: SettingsUserProfileService) {}

  // --- User Profile Endpoints ---
  @Get('user/profile')
  @ApiOperation({ summary: "Get current user's profile" })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully.', type: UserProfile })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User or profile not found.' })
  async getUserProfile(@CurrentUser() user: User): Promise<UserProfile> {
    return this.settingsUserProfileService.findUserProfileByUserId(user.id);
  }

  @Put('user/profile')
  @ApiOperation({ summary: "Update current user's profile" })
  @ApiResponse({ status: 200, description: 'User profile updated successfully.', type: UserProfile })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User, profile or related entity (e.g. Business Sector) not found.' })
  async updateUserProfile(
    @CurrentUser() user: User,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserProfile> {
    return this.settingsUserProfileService.updateUserProfile(user.id, updateUserProfileDto);
  }

  // --- App Settings Endpoints ---
  @Get('settings/app')
  @ApiOperation({ summary: "Get current user's application settings" })
  @ApiResponse({ status: 200, description: 'App settings retrieved successfully.', type: AppSettings })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User or settings not found.' })
  async getAppSettings(@CurrentUser() user: User): Promise<AppSettings> {
    return this.settingsUserProfileService.findAppSettingsByUserId(user.id);
  }

  @Put('settings/app')
  @ApiOperation({ summary: "Update current user's application settings" })
  @ApiResponse({ status: 200, description: 'App settings updated successfully.', type: AppSettings })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User or settings not found.' })
  async updateAppSettings(
    @CurrentUser() user: User,
    @Body() updateAppSettingsDto: UpdateAppSettingsDto,
  ): Promise<AppSettings> {
    return this.settingsUserProfileService.updateAppSettings(user.id, updateAppSettingsDto);
  }

  // --- Notification Settings Endpoints ---
  @Get('settings/notifications')
  @ApiOperation({ summary: "Get current user's notification settings" })
  @ApiResponse({ status: 200, description: 'Notification settings retrieved successfully.', type: NotificationSettings })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User or settings not found.' })
  async getNotificationSettings(@CurrentUser() user: User): Promise<NotificationSettings> {
    return this.settingsUserProfileService.findNotificationSettingsByUserId(user.id);
  }

  @Put('settings/notifications')
  @ApiOperation({ summary: "Update current user's notification settings" })
  @ApiResponse({ status: 200, description: 'Notification settings updated successfully.', type: NotificationSettings })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User or settings not found.' })
  async updateNotificationSettings(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
    return this.settingsUserProfileService.updateNotificationSettings(user.id, updateDto);
  }

  // --- Business Sector Endpoints (Admin-focused) ---
  // TODO: Add RolesGuard for admin access
  @Post('settings/business-sectors')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new business sector (Admin)' })
  @ApiResponse({ status: 201, description: 'Business sector created successfully.', type: BusinessSector })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., name already exists).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createBusinessSector(@Body() createDto: CreateBusinessSectorDto): Promise<BusinessSector> {
    return this.settingsUserProfileService.createBusinessSector(createDto);
  }

  @Get('settings/business-sectors')
  @ApiOperation({ summary: 'List all business sectors (Admin/Public)' })
  @ApiResponse({ status: 200, description: 'Business sectors retrieved successfully.', type: [BusinessSector] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAllBusinessSectors(): Promise<BusinessSector[]> {
    return this.settingsUserProfileService.findAllBusinessSectors();
  }

  @Get('settings/business-sectors/:id')
  @ApiOperation({ summary: 'Get a specific business sector by ID (Admin/Public)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Business Sector ID' })
  @ApiResponse({ status: 200, description: 'Business sector retrieved successfully.', type: BusinessSector })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Business sector not found.' })
  async findOneBusinessSector(@Param('id') id: string): Promise<BusinessSector> {
    return this.settingsUserProfileService.findOneBusinessSector(id);
  }

  @Put('settings/business-sectors/:id')
  @ApiOperation({ summary: 'Update a business sector (Admin)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Business Sector ID' })
  @ApiResponse({ status: 200, description: 'Business sector updated successfully.', type: BusinessSector })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., name already exists).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Business sector not found.' })
  async updateBusinessSector(
    @Param('id') id: string,
    @Body() updateDto: UpdateBusinessSectorDto,
  ): Promise<BusinessSector> {
    return this.settingsUserProfileService.updateBusinessSector(id, updateDto);
  }

  @Delete('settings/business-sectors/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a business sector (Admin)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Business Sector ID' })
  @ApiResponse({ status: 204, description: 'Business sector deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., sector in use).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Business sector not found.' })
  async deleteBusinessSector(@Param('id') id: string): Promise<void> {
    return this.settingsUserProfileService.deleteBusinessSector(id);
  }
}
