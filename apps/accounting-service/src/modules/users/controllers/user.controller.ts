import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto, InviteUserDto } from '../dtos/user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User with email already exists' })
  async create(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    try {
      const user = await this.userService.create(createUserDto);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user'
      };
    }
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new user' })
  @ApiResponse({ status: 201, description: 'User invited successfully' })
  @ApiResponse({ status: 409, description: 'User with email already exists' })
  async invite(@Body() inviteUserDto: InviteUserDto, @Req() req: Request) {
    try {
      const organizationId = (req.user as any).organizationId;
      const invitedBy = (req.user as any).sub;
      const user = await this.userService.inviteUser(organizationId, inviteUserDto, invitedBy);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to invite user'
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all users for the organization' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Query() query: UserQueryDto, @Req() req: Request) {
    try {
      const organizationId = (req.user as any).organizationId;
      const result = await this.userService.findAll(organizationId, query);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get users'
      };
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics for the organization' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getStats(@Req() req: Request) {
    try {
      const organizationId = (req.user as any).organizationId;
      const stats = await this.userService.getUserStats(organizationId);
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user statistics'
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    try {
      const organizationId = (req.user as any).organizationId;
      const user = await this.userService.findOne(id, organizationId);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user'
      };
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request
  ) {
    try {
      const organizationId = (req.user as any).organizationId;
      const user = await this.userService.update(id, organizationId, updateUserDto);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user'
      };
    }
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async activate(@Param('id') id: string, @Req() req: Request) {
    try {
      const user = await this.userService.activateUser(id);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate user'
      };
    }
  }

  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivate(@Param('id') id: string, @Req() req: Request) {
    try {
      const organizationId = (req.user as any).organizationId;
      const user = await this.userService.deactivateUser(id, organizationId);
      return {
        success: true,
        message: 'Utilisateur désactivé avec succès'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate user'
      };
    }
  }

  @Post(':id/reinvite')
  @ApiOperation({ summary: 'Reinvite a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User reinvited successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async reinvite(@Param('id') id: string, @Req() req: Request) {
    try {
      const organizationId = (req.user as any).organizationId;
      const invitedBy = (req.user as any).sub;
      await this.userService.reinviteUser(id, organizationId, invitedBy);
      return {
        success: true,
        message: 'Invitation renvoyée avec succès'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reinvite user'
      };
    }
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get available permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async getPermissions() {
    try {
      const permissions = await this.userService.getAvailablePermissions();
      return {
        success: true,
        data: { permissions }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get permissions'
      };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    try {
      const organizationId = (req.user as any).organizationId;
      await this.userService.remove(id, organizationId);
      return {
        success: true,
        data: { message: 'User deleted successfully' }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user'
      };
    }
  }
}
