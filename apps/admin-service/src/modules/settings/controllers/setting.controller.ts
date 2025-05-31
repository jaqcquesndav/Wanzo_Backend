import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SettingService } from '../services/setting.service';
import { CreateSettingDto, UpdateSettingDto } from '../dtos/setting.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Setting } from '../entities/setting.entity';


interface SettingResponse {
  success: boolean;
  setting?: Setting;
  settings?: Setting[];
  message?: string;
}

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings', description: 'Retrieve all system settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async findAll(): Promise<SettingResponse> {
    const settings = await this.settingService.findAll();
    return {
      success: true,
      settings,
    };
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public settings', description: 'Retrieve all public system settings' })
  @ApiResponse({ status: 200, description: 'Public settings retrieved successfully' })
  async findPublic(): Promise<SettingResponse> {
    const settings = await this.settingService.findPublic();
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
  async findOne(@Param('key') key: string): Promise<SettingResponse> {
    const setting = await this.settingService.findByKey(key);
    return {
      success: true,
      setting,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create setting' })
  @ApiResponse({ status: 201, description: 'Setting created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createSettingDto: CreateSettingDto): Promise<SettingResponse> {
    const userId = 'user-123'; // This should come from auth context
    const setting = await this.settingService.create(createSettingDto, userId);
    return {
      success: true,
      setting,
    };
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update setting' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async update(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ): Promise<SettingResponse> {
    const userId = 'user-123'; // This should come from auth context
    const setting = await this.settingService.update(key, updateSettingDto, userId);
    return {
      success: true,
      setting,
    };
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete setting' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting deleted successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async remove(@Param('key') key: string): Promise<SettingResponse> {
    const userId = 'user-123'; // This should come from auth context
    const result = await this.settingService.delete(key, userId);
    return {
      success: true,
      message: result.message,
    };
  }
}