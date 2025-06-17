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
  UserProfileDto,
  UpdateUserProfileDto,
  ChangePasswordDto,
  TwoFactorSettingsDto,
  ActiveSessionsResponseDto,
  LoginHistoryResponseDto,
  NotificationPreferencesResponseDto,
  UpdateNotificationPreferenceDto,
  UpdateAllNotificationPreferencesDto,
} from '../dtos/settings.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { Express } from 'express';

@ApiTags('Admin Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /* User Profile Endpoints */

  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Return user profile', type: UserProfileDto })
  @Get('profile')
  async getProfile(@CurrentUser() user: User): Promise<UserProfileDto> {
    return this.settingsService.getUserProfile(user.id);
  }

  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UserProfileDto })
  @Put('profile')
  async updateProfile(@CurrentUser() user: User, @Body() updateUserProfileDto: UpdateUserProfileDto): Promise<UserProfileDto> {
    return this.settingsService.updateUserProfile(user.id, updateUserProfileDto);
  }

  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('')
        cb(null, `${randomName}${extname(file.originalname)}`)
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  @Post('profile/avatar')
  async uploadAvatar(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File) {
    return this.settingsService.updateAvatar(user.id, file);
  }

  /* Security Settings */

  @ApiOperation({ summary: 'Get user security settings' })
  @ApiResponse({ status: 200, description: 'Return security settings for the user', type: TwoFactorSettingsDto })
  @Get('security/settings')
  async getSecuritySettings(@CurrentUser() user: User): Promise<TwoFactorSettingsDto> {
    return this.settingsService.getTwoFactorSettings(user.id);
  }

  @ApiOperation({ summary: 'Update two-factor authentication settings' })
  @ApiResponse({ status: 200, description: '2FA settings updated' })
  @Put('security/settings/2fa')
  async updateTwoFactorSettings(@CurrentUser() user: User, @Body() twoFactorSettingsDto: TwoFactorSettingsDto) {
    return this.settingsService.updateTwoFactorSettings(user.id, twoFactorSettingsDto);
  }

  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @Put('security/password')
  async changePassword(@CurrentUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
    return this.settingsService.changePassword(user.id, changePasswordDto);
  }

  @ApiOperation({ summary: 'Get active sessions' })
  @ApiResponse({ status: 200, description: 'Return active sessions', type: ActiveSessionsResponseDto })
  @Get('security/sessions')
  async getActiveSessions(@CurrentUser() user: User): Promise<ActiveSessionsResponseDto> {
    return this.settingsService.getActiveSessions(user.id);
  }

  @ApiOperation({ summary: 'Revoke a session' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @Delete('security/sessions/:id')
  async revokeSession(@CurrentUser() user: User, @Param('id') sessionId: string) {
    return this.settingsService.revokeSession(user.id, sessionId);
  }

  @ApiOperation({ summary: 'Revoke all other sessions' })
  @ApiResponse({ status: 200, description: 'All other sessions revoked' })
  @Delete('security/sessions/all-other')
  async revokeAllOtherSessions(@CurrentUser() user: User) {
    return this.settingsService.terminateAllOtherSessions(user.id);
  }

  @ApiOperation({ summary: 'Get login history' })
  @ApiResponse({ status: 200, description: 'Return login history', type: LoginHistoryResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('security/login-history')
  async getLoginHistory(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<LoginHistoryResponseDto> {
    return this.settingsService.getLoginHistory(user.id, { page, limit });
  }

  /* Notification Settings */

  @ApiOperation({ summary: 'Get all notification preferences for a user' })
  @ApiResponse({ status: 200, description: 'Return all notification preferences', type: NotificationPreferencesResponseDto })
  @Get('settings/notifications')
  async getNotificationPreferences(@CurrentUser() user: User): Promise<NotificationPreferencesResponseDto> {
    return this.settingsService.getNotificationPreferences(user.id);
  }

  @ApiOperation({ summary: 'Update a specific notification preference' })
  @ApiResponse({ status: 200, description: 'Preference updated successfully' })
  @Put('settings/notifications/:id')
  async updateNotificationPreference(
    @CurrentUser() user: User,
    @Param('id') preferenceId: string,
    @Body() updateDto: UpdateNotificationPreferenceDto,
  ) {
    return this.settingsService.updateNotificationPreference(user.id, preferenceId, updateDto.isEnabled);
  }

  @ApiOperation({ summary: 'Update all notification preferences' })
  @ApiResponse({ status: 200, description: 'All preferences updated successfully' })
  @Put('settings/notifications')
  async updateAllNotificationPreferences(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateAllNotificationPreferencesDto,
  ) {
    return this.settingsService.updateAllNotificationPreferences(user.id, updateDto);
  }
}
