import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SettingService } from '../services/setting.service';
import { CreateSettingDto, UpdateSettingDto } from '../dtos/setting.dto';
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
}