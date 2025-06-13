import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from '../services/settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UpdateAccountingSettingsDto } from '../dtos/update-accounting-settings.dto';
import { UpdateExchangeRatesDto, SetDefaultCurrencyDto } from '../dtos/update-currency.dto';
import { UpdateDataSharingSettingsDto } from '../dtos/update-data-sharing-settings.dto';
import { UpdateDataSourcesDto } from '../dtos/update-data-sources.dto';
import { Request as ExpressRequest } from 'express';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}
  // Accounting Settings
  @Get('accounting')
  @ApiOperation({ summary: 'Get accounting settings' })
  async getAccountingSettings(@Request() req: ExpressRequest & { user: { companyId: string } }): Promise<any> {
    const settings = await this.settingsService.getAccountingSettings(req.user.companyId);
    return {
      success: true,
      data: settings
    };
  }
  @Put('accounting')
  @ApiOperation({ summary: 'Update accounting settings' })
  async updateAccountingSettings(
    @Body() updateDto: UpdateAccountingSettingsDto, 
    @Request() req: ExpressRequest & { user: { companyId: string } }
  ): Promise<any> {
    const settings = await this.settingsService.updateAccountingSettings(
      req.user.companyId, 
      updateDto
    );
    return {
      success: true,
      data: settings
    };
  }
  // Currencies
  @Get('currencies')
  @ApiOperation({ summary: 'Get all currencies' })
  async getCurrencies(@Request() req: ExpressRequest & { user: { companyId: string } }): Promise<any> {
    const currencies = await this.settingsService.getCurrencies(req.user.companyId);
    return {
      success: true,
      data: currencies
    };
  }
  @Put('currencies/default')
  @ApiOperation({ summary: 'Set default currency' })
  async setDefaultCurrency(
    @Body() dto: SetDefaultCurrencyDto, 
    @Request() req: ExpressRequest & { user: { companyId: string } }
  ): Promise<any> {
    const currency = await this.settingsService.setDefaultCurrency(
      req.user.companyId, 
      dto.currencyCode
    );
    return {
      success: true,
      data: currency
    };
  }
  @Put('currencies/exchange-rates')
  @ApiOperation({ summary: 'Update currency exchange rates' })
  async updateExchangeRates(
    @Body() updateDto: UpdateExchangeRatesDto, 
    @Request() req: ExpressRequest & { user: { companyId: string } }
  ): Promise<any> {
    const currencies = await this.settingsService.updateExchangeRates(
      req.user.companyId, 
      updateDto
    );
    return {
      success: true,
      data: currencies
    };
  }
  // Data Sharing
  @Get('data-sharing')
  @ApiOperation({ summary: 'Get data sharing settings' })
  async getDataSharingSettings(@Request() req: ExpressRequest & { user: { companyId: string } }): Promise<any> {
    const settings = await this.settingsService.getDataSharingSettings(req.user.companyId);
    return {
      success: true,
      data: {
        enabled: settings.status === 'enabled',
        providers: settings.providers
      }
    };
  }
  @Put('data-sharing')
  @ApiOperation({ summary: 'Update data sharing settings' })
  async updateDataSharingSettings(
    @Body() updateDto: UpdateDataSharingSettingsDto, 
    @Request() req: ExpressRequest & { user: { companyId: string, userId: string } } // Added userId to req.user type
  ): Promise<any> {
    const settings = await this.settingsService.updateDataSharingSettings(
      req.user.companyId, 
      updateDto,
      req.user.userId, // Pass userId to the service method
    );
    return {
      success: true,
      data: {
        enabled: settings.status === 'enabled',
        providers: settings.providers,
        // Optionally, return the derived shareWithAll and targetInstitutionTypes if useful for the client
      }
    };
  }
  // Data Sources
  @Get('data-sources')
  @ApiOperation({ summary: 'Get all data sources' })
  async getDataSources(@Request() req: ExpressRequest & { user: { companyId: string } }): Promise<any> {
    const sources = await this.settingsService.getDataSources(req.user.companyId);
    return {
      success: true,
      data: {
        sources
      }
    };
  }
  @Put('data-sources')
  @ApiOperation({ summary: 'Update data sources' })
  async updateDataSources(
    @Body() updateDto: UpdateDataSourcesDto, 
    @Request() req: ExpressRequest & { user: { companyId: string } }
  ): Promise<any> {
    const sources = await this.settingsService.updateDataSources(
      req.user.companyId, 
      updateDto
    );
    return {
      success: true,
      data: {
        sources
      }
    };
  }
}
