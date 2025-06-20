import { Controller, Get, Put, Body, UseGuards, Request, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from '../services/settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { SettingsDto } from '../dtos/settings.dto';
import { UpdateGeneralSettingsDto } from '../dtos/update-general-settings.dto';
import { UpdateAccountingSettingsDto } from '../dtos/update-accounting-settings.dto';
import { UpdateSecuritySettingsDto } from '../dtos/update-security-settings.dto';
import { UpdateNotificationsSettingsDto } from '../dtos/update-notifications-settings.dto';
import { UpdateIntegrationsSettingsDto } from '../dtos/update-integrations-settings.dto';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  @ApiResponse({ status: 200, description: 'All settings retrieved successfully.', type: SettingsDto })
  async getAllSettings(@Request() req: ExpressRequest & { user: { companyId: string, id: string } }): Promise<SettingsDto> {
    return this.settingsService.getAllSettings(req.user.companyId, req.user.id);
  }

  @Put(':category')
  @ApiOperation({ summary: 'Update settings for a specific category' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid category specified.' })
  async updateSettingsCategory(
    @Param('category') category: string,
    @Body() updateDto: any,
    @Request() req: ExpressRequest & { user: { companyId: string, id: string } }
  ): Promise<any> {
    let result;
    switch (category) {
      case 'general':
        result = await this.settingsService.updateGeneralSettings(req.user.id, updateDto as UpdateGeneralSettingsDto);
        break;
      case 'accounting':
        result = await this.settingsService.updateAccountingSettings(req.user.companyId, updateDto as UpdateAccountingSettingsDto);
        break;
      case 'security':
        result = await this.settingsService.updateSecuritySettings(req.user.id, updateDto as UpdateSecuritySettingsDto);
        break;
      case 'notifications':
        result = await this.settingsService.updateNotificationsSettings(req.user.id, updateDto as UpdateNotificationsSettingsDto);
        break;
      case 'integrations':
        result = await this.settingsService.updateIntegrationsSettings(req.user.companyId, updateDto as UpdateIntegrationsSettingsDto);
        break;
      default:
        throw new HttpException('Invalid settings category', HttpStatus.BAD_REQUEST);
    }
    return { success: true, data: result };
  }
}
