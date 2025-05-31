import { Controller, Get, Put, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DataSharingService } from '../services/data-sharing.service';
import { UpdateDataSharingConfigDto, DataSharingStatusDto } from '../dtos/data-sharing.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('data-sharing')
@Controller('data-sharing')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DataSharingController {
  constructor(private readonly dataSharingService: DataSharingService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get data sharing status' })
  @ApiResponse({ status: 200, description: 'Data sharing status retrieved successfully' })
  async getStatus(@Req() req: any): Promise<DataSharingStatusDto> {
    const config = await this.dataSharingService.getConfig(req.user.companyId);
    return {
      sharingEnabled: config.sharingEnabled,
      allowedDataTypes: config.allowedDataTypes,
      institutionId: config.institutionId,
      consentExpiresAt: config.consentExpiresAt,
      sharingPreferences: config.sharingPreferences,
    };
  }

  @Put('config')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update data sharing configuration' })
  @ApiResponse({ status: 200, description: 'Data sharing configuration updated successfully' })
  async updateConfig(
    @Body() updateDto: UpdateDataSharingConfigDto,
    @Req() req: any,
  ) {
    const config = await this.dataSharingService.updateConfig(
      req.user.companyId,
      req.user.id,
      updateDto,
    );
    return {
      success: true,
      config,
    };
  }

  @Delete('consent')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Revoke data sharing consent' })
  @ApiResponse({ status: 200, description: 'Data sharing consent revoked successfully' })
  async revokeConsent(@Req() req: any) {
    await this.dataSharingService.revokeConsent(req.user.companyId, req.user.id);
    return {
      success: true,
      message: 'Data sharing consent revoked successfully',
    };
  }

  @Get('history')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get data sharing history' })
  @ApiResponse({ status: 200, description: 'Data sharing history retrieved successfully' })
  async getHistory(@Req() req: any) {
    const history = await this.dataSharingService.getHistory(req.user.companyId);
    return {
      success: true,
      history,
    };
  }
}