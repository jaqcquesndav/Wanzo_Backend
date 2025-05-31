import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InstitutionUserService } from '../services/institution-user.service';
import { CreateInstitutionUserDto, UpdateInstitutionUserDto } from '../dtos/institution-user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('institution-users')
@Controller('institution/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InstitutionUserController {
  constructor(private readonly userService: InstitutionUserService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new institution user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createUserDto: CreateInstitutionUserDto, @Req() req: any) {
    const user = await this.userService.create(
      req.user.institutionId,
      createUserDto,
      req.user.id,
    );
    return {
      success: true,
      user,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all institution users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Req() req: any,
  ) {
    const result = await this.userService.findAll(
      req.user.institutionId,
      +page,
      +perPage,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return {
      success: true,
      user,
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateInstitutionUserDto,
  ) {
    const user = await this.userService.update(id, updateUserDto);
    return {
      success: true,
      user,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string) {
    return await this.userService.delete(id);
  }

  @Post(':id/2fa/enable')
  @ApiOperation({ summary: 'Enable 2FA for user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async enable2FA(@Param('id') id: string, @Body('secret') secret: string) {
    const user = await this.userService.enable2FA(id, secret);
    return {
      success: true,
      user,
    };
  }

  @Post(':id/2fa/disable')
  @ApiOperation({ summary: 'Disable 2FA for user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async disable2FA(@Param('id') id: string) {
    const user = await this.userService.disable2FA(id);
    return {
      success: true,
      user,
    };
  }
}