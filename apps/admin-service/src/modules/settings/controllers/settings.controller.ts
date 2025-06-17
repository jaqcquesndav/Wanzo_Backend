import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  NotFoundException,
  HttpCode
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from '../services/settings.service';
import {
  AllSettingsDto,
  GeneralSettingsDto,
  SecuritySettingsDto,
  NotificationSettingsDto,
  BillingSettingsDto,
  AppearanceSettingsDto,
  UpdateSettingDto,
  UserProfileDto,
  UpdateUserProfileDto,
  ChangePasswordDto,
  TwoFactorSettingsDto,
  ActiveSessionsResponseDto,
  LoginHistoryResponseDto,
  NotificationPreferencesResponseDto,
  UpdateNotificationPreferenceDto,
  UpdateAllNotificationPreferencesDto,
  AppSettingsResponseDto
} from '../dtos/settings.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /* System Settings Endpoints */

  @ApiOperation({ summary: 'Get all settings' })
  @ApiResponse({ status: 200, description: 'Return all system settings', type: AllSettingsDto })
  @Get()
  @Roles('admin:settings:read')
  async getAllSettings(): Promise<AllSettingsDto> {
    return this.settingsService.getAllSettings();
  }

  @ApiOperation({ summary: 'Get general settings' })
  @ApiResponse({ status: 200, description: 'Return general settings', type: GeneralSettingsDto })
  @Get('general')
  @Roles('admin:settings:read')
  async getGeneralSettings(): Promise<GeneralSettingsDto> {
    return this.settingsService.getSettingsBySection('general');
  }

  @ApiOperation({ summary: 'Get security settings' })
  @ApiResponse({ status: 200, description: 'Return security settings', type: SecuritySettingsDto })
  @Get('security')
  @Roles('admin:settings:read')
  async getSecuritySettings(): Promise<SecuritySettingsDto> {
    return this.settingsService.getSettingsBySection('security');
  }

  @ApiOperation({ summary: 'Get notification settings' })
  @ApiResponse({ status: 200, description: 'Return notification settings', type: NotificationSettingsDto })
  @Get('notifications')
  @Roles('admin:settings:read')
  async getNotificationSettings(): Promise<NotificationSettingsDto> {
    return this.settingsService.getSettingsBySection('notifications');
  }

  @ApiOperation({ summary: 'Get billing settings' })
  @ApiResponse({ status: 200, description: 'Return billing settings', type: BillingSettingsDto })
  @Get('billing')
  @Roles('admin:settings:read')
  async getBillingSettings(): Promise<BillingSettingsDto> {
    return this.settingsService.getSettingsBySection('billing');
  }

  @ApiOperation({ summary: 'Get appearance settings' })
  @ApiResponse({ status: 200, description: 'Return appearance settings', type: AppearanceSettingsDto })
  @Get('appearance')
  @Roles('admin:settings:read')
  async getAppearanceSettings(): Promise<AppearanceSettingsDto> {
    return this.settingsService.getSettingsBySection('appearance');
  }

  @ApiOperation({ summary: 'Update settings for a specific section' })
  @ApiParam({ name: 'section', enum: ['general', 'security', 'notifications', 'billing', 'appearance'] })
  @ApiBody({ description: 'Updated settings for the specified section' })
  @ApiResponse({ status: 200, description: 'Return updated settings for the specified section' })
  @Put(':section')
  @Roles('admin:settings:write')
  async updateSettings(
    @Param('section') section: string,
    @Body() updateDto: Record<string, any>
  ): Promise<any> {
    return this.settingsService.updateSettings(section, updateDto);
  }

  /* App-level Settings */

  @ApiOperation({ summary: 'Get app-level settings' })
  @ApiResponse({ status: 200, description: 'Return app-level settings', type: AppSettingsResponseDto })
  @Get('app')
  @Roles('admin:settings:read')
  async getAppSettings(): Promise<AppSettingsResponseDto> {
    const settings = await this.settingsService.getApplicationSettings();
    if (!settings) {
      throw new NotFoundException('App settings not found.');
    }
    return settings;
  }

  @ApiOperation({ summary: 'Update an application setting' })
  @ApiResponse({ status: 200, description: 'App setting updated successfully' })
  @HttpCode(200)
  @Put('app/:id')
  @Roles('admin:settings:write')
  async updateApplicationSetting(
    @Param('id') settingId: string,
    @Body() updateDto: UpdateSettingDto,
  ) {
    return this.settingsService.updateApplicationSetting(settingId, updateDto);
  }
}
