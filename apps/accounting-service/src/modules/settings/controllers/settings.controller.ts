import { Controller, Get, Put, Post, Body, UseGuards, Request, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from '../services/settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Request as ExpressRequest } from 'express';
import { 
  SettingsDto, 
  UpdateGeneralSettingsDto, 
  UpdateAccountingSettingsDto, 
  UpdateSecuritySettingsDto, 
  UpdateNotificationsSettingsDto, 
  UpdateIntegrationsSettingsDto, 
  UpdateExchangeRatesDto,
  UpdateDataSharingDto, 
  UpdateDataSourceDto, 
  UpdateBankIntegrationDto,
  ValidateSettingsDto,
  ImportSettingsDto
} from '../dtos/settings.dto';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
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

  @Put('exchange-rates')
  @ApiOperation({ summary: 'Update exchange rates' })
  @ApiResponse({ status: 200, description: 'Exchange rates updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid exchange rates data.' })
  async updateExchangeRates(
    @Body() updateDto: UpdateExchangeRatesDto,
    @Request() req: ExpressRequest & { user: { companyId: string, id: string } }
  ): Promise<any> {
    const result = await this.settingsService.updateExchangeRates(req.user.companyId, updateDto);
    return { 
      success: true, 
      message: 'Taux de change mis à jour',
      data: result 
    };
  }

  @Get('data-sharing')
  @Roles('admin')
  @ApiOperation({ summary: 'Get data sharing settings' })
  @ApiResponse({ status: 200, description: 'Data sharing settings retrieved successfully.' })
  async getDataSharingSettings(@Request() req: ExpressRequest & { user: { companyId: string, id: string } }): Promise<any> {
    const result = await this.settingsService.getDataSharingSettings(req.user.companyId);
    return { success: true, data: result };
  }

  @Put('data-sharing')
  @Roles('admin')
  @ApiOperation({ summary: 'Update data sharing settings' })
  @ApiResponse({ status: 200, description: 'Data sharing settings updated successfully.' })
  async updateDataSharingSettings(
    @Body() updateDto: UpdateDataSharingDto,
    @Request() req: ExpressRequest & { user: { companyId: string, id: string, email: string } }
  ): Promise<any> {
    const result = await this.settingsService.updateDataSharingSettings(req.user.companyId, updateDto, req.user.email);
    return { 
      success: true, 
      data: result,
      message: 'Paramètres de partage mis à jour avec succès'
    };
  }

  @Get('data-sources')
  @ApiOperation({ summary: 'Get data sources configuration' })
  @ApiResponse({ status: 200, description: 'Data sources retrieved successfully.' })
  async getDataSources(@Request() req: ExpressRequest & { user: { companyId: string, id: string } }): Promise<any> {
    const result = await this.settingsService.getDataSources(req.user.companyId);
    return { success: true, data: result };
  }

  @Put('data-sources')
  @ApiOperation({ summary: 'Update data source configuration' })
  @ApiResponse({ status: 200, description: 'Data source updated successfully.' })
  async updateDataSource(
    @Body() updateDto: UpdateDataSourceDto,
    @Request() req: ExpressRequest & { user: { companyId: string, id: string } }
  ): Promise<any> {
    const result = await this.settingsService.updateDataSource(req.user.companyId, updateDto);
    return { 
      success: true, 
      data: result,
      message: 'Source de données mise à jour avec succès'
    };
  }

  @Get('integrations/status')
  @ApiOperation({ summary: 'Get all integrations status' })
  @ApiResponse({ status: 200, description: 'Integrations status retrieved successfully.' })
  async getIntegrationsStatus(@Request() req: ExpressRequest & { user: { companyId: string, id: string } }): Promise<any> {
    const result = await this.settingsService.getIntegrationsStatus(req.user.companyId);
    return { success: true, data: result };
  }

  @Get('integrations/banks')
  @ApiOperation({ summary: 'Get bank integrations configuration' })
  @ApiResponse({ status: 200, description: 'Bank integrations retrieved successfully.' })
  async getBankIntegrations(@Request() req: ExpressRequest & { user: { companyId: string, id: string } }): Promise<any> {
    const result = await this.settingsService.getBankIntegrations(req.user.companyId);
    return { success: true, data: result };
  }

  @Put('integrations/banks/:bankId')
  @ApiOperation({ summary: 'Update bank integration configuration' })
  @ApiResponse({ status: 200, description: 'Bank integration updated successfully.' })
  async updateBankIntegration(
    @Param('bankId') bankId: string,
    @Body() updateDto: UpdateBankIntegrationDto,
    @Request() req: ExpressRequest & { user: { companyId: string, id: string } }
  ): Promise<any> {
    const result = await this.settingsService.updateBankIntegration(req.user.companyId, bankId, updateDto);
    return { 
      success: true, 
      data: result,
      message: 'Configuration bancaire mise à jour avec succès'
    };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate settings before saving' })
  @ApiResponse({ status: 200, description: 'Settings validation completed.' })
  async validateSettings(@Body() validateDto: ValidateSettingsDto): Promise<any> {
    const result = await this.settingsService.validateSettings(validateDto);
    return result;
  }

  @Get('export')
  @ApiOperation({ summary: 'Export all organization settings' })
  @ApiResponse({ status: 200, description: 'Settings exported successfully.' })
  async exportSettings(@Request() req: ExpressRequest & { user: { companyId: string, id: string } }): Promise<any> {
    return this.settingsService.getAllSettings(req.user.companyId, req.user.id);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import settings from export file' })
  @ApiResponse({ status: 200, description: 'Settings imported successfully.' })
  async importSettings(
    @Body() importDto: ImportSettingsDto,
    @Request() req: ExpressRequest & { user: { companyId: string, id: string } }
  ): Promise<any> {
    const result = await this.settingsService.importSettings(req.user.companyId, req.user.id, importDto);
    return result;
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset all settings to default' })
  @ApiResponse({ status: 200, description: 'Settings reset successfully.' })
  async resetAllSettings(@Request() req: ExpressRequest & { user: { companyId: string, id: string } }): Promise<any> {
    const result = await this.settingsService.resetSettings(req.user.companyId, req.user.id);
    return result;
  }

  @Post(':category/reset')
  @ApiOperation({ summary: 'Reset specific category to default' })
  @ApiResponse({ status: 200, description: 'Category settings reset successfully.' })
  async resetCategorySettings(
    @Param('category') category: string,
    @Request() req: ExpressRequest & { user: { companyId: string, id: string } }
  ): Promise<any> {
    const result = await this.settingsService.resetCategorySettings(req.user.companyId, req.user.id, category);
    return result;
  }
}
