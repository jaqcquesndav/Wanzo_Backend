import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from '../services';
import {
  UserProfileDto,
  UpdateUserProfileDto,
  ChangePasswordDto,
  TwoFactorSettingsDto,
  SessionSettingsDto,
  NotificationChannelsDto,
  NotificationPreferencesDto,
  SystemSettingsResponseDto,
  SystemSettingSection,
  UpdateSystemSettingDto
} from '../dtos';
import { JwtBlacklistGuard } from '../../auth/guards/jwt-blacklist.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // User Profile Endpoints
  @Get('users/me/profile')
  async getUserProfile(@Query('userId') userId: string): Promise<UserProfileDto> {
    return this.settingsService.getUserProfile(userId);
  }

  @Put('users/me/profile')
  async updateUserProfile(
    @Query('userId') userId: string,
    @Body() updateDto: UpdateUserProfileDto
  ): Promise<UserProfileDto> {
    return this.settingsService.updateUserProfile(userId, updateDto);
  }

  @Post('users/me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadUserAvatar(
    @Query('userId') userId: string,
    @UploadedFile() file: Express.Multer.File
  ): Promise<{ avatarUrl: string }> {
    // In a real implementation, the file would be uploaded to a storage service like S3
    // and the URL would be returned

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Mock avatar URL
    const avatarUrl = `https://example.com/avatars/${userId}_${Date.now()}.jpg`;
    
    return this.settingsService.updateUserAvatar(userId, avatarUrl);
  }

  // Security Settings Endpoints
  @Post('users/me/security/change-password')
  async changePassword(
    @Query('userId') userId: string,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    return this.settingsService.changePassword(userId, changePasswordDto);
  }

  @Put('users/me/security/two-factor')
  async updateTwoFactorSettings(
    @Query('userId') userId: string,
    @Body() twoFactorDto: TwoFactorSettingsDto
  ) {
    return this.settingsService.updateTwoFactorSettings(userId, twoFactorDto);
  }

  @Put('users/me/security/session')
  async updateSessionSettings(
    @Query('userId') userId: string,
    @Body() sessionDto: SessionSettingsDto
  ) {
    return this.settingsService.updateSessionSettings(userId, sessionDto);
  }

  // Notification Settings Endpoints
  @Get('users/me/notifications')
  async getNotificationSettings(@Query('userId') userId: string) {
    return this.settingsService.getNotificationSettings(userId);
  }

  @Put('users/me/notifications/channels')
  async updateNotificationChannels(
    @Query('userId') userId: string,
    @Body() channelsDto: NotificationChannelsDto
  ) {
    return this.settingsService.updateNotificationChannels(userId, channelsDto);
  }

  @Put('users/me/notifications/preferences')
  async updateNotificationPreferences(
    @Query('userId') userId: string,
    @Body() preferencesDto: NotificationPreferencesDto
  ) {
    return this.settingsService.updateNotificationPreferences(userId, preferencesDto);
  }

  // System Settings Endpoints
  @Get('system')
  async getAllSystemSettings(): Promise<SystemSettingsResponseDto> {
    return this.settingsService.getAllSystemSettings();
  }

  @Get('system/:section')
  async getSystemSettingsBySection(@Param('section') section: SystemSettingSection) {
    return this.settingsService.getSystemSettingsBySection(section);
  }

  @Put('system/:section')
  async updateSystemSettings(
    @Param('section') section: SystemSettingSection,
    @Body() updateDto: UpdateSystemSettingDto
  ) {
    return this.settingsService.updateSystemSettings(section, updateDto);
  }
}
