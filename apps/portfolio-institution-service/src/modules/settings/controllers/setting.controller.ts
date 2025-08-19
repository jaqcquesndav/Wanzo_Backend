import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SettingService } from '../services/setting.service';
import { 
  CreateSettingDto, 
  UpdateSettingDto, 
  GeneralSettingsDto, 
  SecuritySettingsDto, 
  NotificationSettingsDto 
} from '../dtos/setting.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async findAll(@Req() req: any) {
    const settings = await this.settingService.findAll(req.user.institutionId);
    return {
      success: true,
      settings,
    };
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public settings' })
  @ApiResponse({ status: 200, description: 'Public settings retrieved successfully' })
  async findPublic(@Req() req: any) {
    const settings = await this.settingService.findPublic(req.user.institutionId);
    return {
      success: true,
      settings,
    };
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get setting by key' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async findOne(@Param('key') key: string, @Req() req: any) {
    const setting = await this.settingService.findByKey(req.user.institutionId, key);
    return {
      success: true,
      setting,
    };
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create setting' })
  @ApiResponse({ status: 201, description: 'Setting created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createSettingDto: CreateSettingDto, @Req() req: any) {
    const setting = await this.settingService.create(
      req.user.institutionId,
      createSettingDto,
      req.user.id,
    );
    return {
      success: true,
      setting,
    };
  }

  @Put(':key')
  @Roles('admin')
  @ApiOperation({ summary: 'Update setting' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async update(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @Req() req: any,
  ) {
    const setting = await this.settingService.update(
      req.user.institutionId,
      key,
      updateSettingDto,
    );
    return {
      success: true,
      setting,
    };
  }

  @Delete(':key')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete setting' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting deleted successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async remove(@Param('key') key: string, @Req() req: any) {
    return await this.settingService.delete(req.user.institutionId, key);
  }

  // Endpoints spécifiques par catégorie
  @Get('general')
  @ApiOperation({ summary: 'Get general settings' })
  @ApiResponse({ status: 200, description: 'General settings retrieved successfully' })
  async getGeneralSettings(@Req() req: any) {
    const settings = await this.settingService.getGeneralSettings(req.user.institutionId);
    return {
      success: true,
      settings,
    };
  }

  @Put('general')
  @Roles('admin')
  @ApiOperation({ summary: 'Update general settings' })
  @ApiResponse({ status: 200, description: 'General settings updated successfully' })
  async updateGeneralSettings(@Body() generalSettingsDto: GeneralSettingsDto, @Req() req: any) {
    const settings = await this.settingService.updateGeneralSettings(
      req.user.institutionId,
      generalSettingsDto,
      req.user.id,
    );
    return {
      success: true,
      settings,
    };
  }

  @Get('security')
  @ApiOperation({ summary: 'Get security settings' })
  @ApiResponse({ status: 200, description: 'Security settings retrieved successfully' })
  async getSecuritySettings(@Req() req: any) {
    const settings = await this.settingService.getSecuritySettings(req.user.institutionId);
    return {
      success: true,
      settings,
    };
  }

  @Put('security')
  @Roles('admin')
  @ApiOperation({ summary: 'Update security settings' })
  @ApiResponse({ status: 200, description: 'Security settings updated successfully' })
  async updateSecuritySettings(@Body() securitySettingsDto: SecuritySettingsDto, @Req() req: any) {
    const settings = await this.settingService.updateSecuritySettings(
      req.user.institutionId,
      securitySettingsDto,
      req.user.id,
    );
    return {
      success: true,
      settings,
    };
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings retrieved successfully' })
  async getNotificationSettings(@Req() req: any) {
    const settings = await this.settingService.getNotificationSettings(req.user.institutionId);
    return {
      success: true,
      settings,
    };
  }

  @Put('notifications')
  @Roles('admin')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings updated successfully' })
  async updateNotificationSettings(@Body() notificationSettingsDto: NotificationSettingsDto, @Req() req: any) {
    const settings = await this.settingService.updateNotificationSettings(
      req.user.institutionId,
      notificationSettingsDto,
      req.user.id,
    );
    return {
      success: true,
      settings,
    };
  }
}
