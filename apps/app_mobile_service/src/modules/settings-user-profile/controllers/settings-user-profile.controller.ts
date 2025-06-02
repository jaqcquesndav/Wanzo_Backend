import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpStatus } from '@nestjs/common';
import { SettingsUserProfileService } from '../services/settings-user-profile.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, User } from '../../auth/entities/user.entity';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';
import { CreateBusinessSectorDto } from '../dto/create-business-sector.dto';
import { UpdateBusinessSectorDto } from '../dto/update-business-sector.dto';
import { UpdateUserByAdminDto } from '../dto/update-user-by-admin.dto';
import { ChangeUserRoleDto } from '../dto/change-user-role.dto';
import { ApplicationSettingsDto } from '../dto/application-settings.dto';
import { BusinessSector } from '../entities/business-sector.entity'; // Import BusinessSector entity for Swagger response types
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface'; // Import AuthenticatedRequest
import { ApplicationSettings } from '../entities/application-settings.entity'; // Import ApplicationSettings entity for Swagger response types

@ApiTags('Settings, User Profile & Business Sectors')
@ApiBearerAuth() // Indicates all endpoints in this controller require Bearer token (handled by global JwtAuthGuard)
@UseGuards(RolesGuard) // Apply RolesGuard to the entire controller
@Controller('settings-user-profile')
export class SettingsUserProfileController {
  constructor(private readonly settingsUserProfileService: SettingsUserProfileService) {}

  // --- User Profile (Self-service) ---
  @Get('profile/me')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.CASHIER, UserRole.SALES, UserRole.INVENTORY_MANAGER, UserRole.STAFF, UserRole.CUSTOMER_SUPPORT)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User profile retrieved successfully.', type: User }) 
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  async getMyProfile(@Req() req: AuthenticatedRequest): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'> | null> { 
    return this.settingsUserProfileService.getMyProfile(req.user.id);
  }

  @Patch('profile/me')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.CASHIER, UserRole.SALES, UserRole.INVENTORY_MANAGER, UserRole.STAFF, UserRole.CUSTOMER_SUPPORT)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User profile updated successfully.', type: User })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  async updateMyProfile(@Req() req: AuthenticatedRequest, @Body() updateUserProfileDto: UpdateUserProfileDto): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'> | null> { 
    return this.settingsUserProfileService.updateMyProfile(req.user.id, updateUserProfileDto);
  }

  // --- User Management (Admin/Owner) ---
  @Get('users')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users (Admin/Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users listed successfully.', type: [User] })
  async getAllUsers(@Req() req: AuthenticatedRequest): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'>[]> {
    // If the user is an ADMIN, only return users from their company.
    // If the user is an OWNER, they can see all users (companyId will be undefined).
    const companyId = req.user.role === UserRole.ADMIN ? req.user.companyId : undefined;
    return this.settingsUserProfileService.getAllUsers(companyId);
  }

  @Get('users/:userId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin/Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully.', type: User })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  async getUserById(@Param('userId') userId: string, @Req() req: AuthenticatedRequest): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'> | null> {
    // TODO: Add logic to ensure an ADMIN can only get users from their own company.
    return this.settingsUserProfileService.getUserById(userId);
  }

  @Patch('users/:userId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user by ID (Admin/Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully.', type: User })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already exists.' })
  async updateUserById(@Param('userId') userId: string, @Body() updateUserByAdminDto: UpdateUserByAdminDto, @Req() req: AuthenticatedRequest): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'> | null> {
    // TODO: Add logic to ensure an ADMIN can only update users from their own company.
    return this.settingsUserProfileService.updateUserById(userId, updateUserByAdminDto);
  }

  @Patch('users/:userId/role')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Change user role (Admin/Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User role updated successfully.', type: User })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid role change request (e.g., permission denied).' })
  async changeUserRole(
    @Param('userId') userId: string, 
    @Body() changeUserRoleDto: ChangeUserRoleDto,
    @Req() req: AuthenticatedRequest, // Inject AuthenticatedRequest
  ): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'> | null> {
    // The req.user contains the authenticated user performing the action
    return this.settingsUserProfileService.changeUserRole(userId, changeUserRoleDto, req.user);
  }

  @Delete('users/:userId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user by ID (Admin/Owner)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  async deleteUser(@Param('userId') userId: string, @Req() req: AuthenticatedRequest): Promise<void> {
    // TODO: Add logic to ensure an ADMIN can only delete users from their own company.
    await this.settingsUserProfileService.deleteUser(userId);
  }

  // --- Business Sector Management ---
  @Post('business-sectors')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new business sector (Admin/Owner)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Business sector created successfully.', type: BusinessSector })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Business sector with this name already exists.' })
  async createBusinessSector(@Body() createBusinessSectorDto: CreateBusinessSectorDto): Promise<BusinessSector> {
    return this.settingsUserProfileService.createBusinessSector(createBusinessSectorDto);
  }

  @Get('business-sectors')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List all business sectors (Owner/Admin/Manager)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Business sectors listed successfully.', type: [BusinessSector] })
  async getAllBusinessSectors(): Promise<BusinessSector[]> {
    return this.settingsUserProfileService.findAllBusinessSectors();
  }

  @Get('business-sectors/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get business sector by ID (Owner/Admin/Manager)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Business sector retrieved successfully.', type: BusinessSector })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Business sector not found.' })
  async getBusinessSectorById(@Param('id') id: string): Promise<BusinessSector> {
    return this.settingsUserProfileService.findBusinessSectorById(id);
  }

  @Patch('business-sectors/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update business sector by ID (Admin/Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Business sector updated successfully.', type: BusinessSector })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Business sector not found.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Another business sector with this name already exists.' })
  async updateBusinessSector(@Param('id') id: string, @Body() updateBusinessSectorDto: UpdateBusinessSectorDto): Promise<BusinessSector> {
    return this.settingsUserProfileService.updateBusinessSector(id, updateBusinessSectorDto);
  }

  @Delete('business-sectors/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete business sector by ID (Admin/Owner)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Business sector deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Business sector not found.' })
  async deleteBusinessSector(@Param('id') id: string): Promise<void> {
    await this.settingsUserProfileService.deleteBusinessSector(id); // Ensure await for void promise
  }

  // --- General Application Settings ---
  @Get('application-settings')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get application settings (Admin/Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application settings retrieved successfully.', type: ApplicationSettings })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Application settings not found.' })
  async getApplicationSettings(): Promise<ApplicationSettings | null> {
    return this.settingsUserProfileService.getApplicationSettings();
  }

  @Patch('application-settings')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update application settings (Admin/Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application settings updated successfully.', type: ApplicationSettings })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Application settings not found (will be created).' }) // Or handle creation differently
  async updateApplicationSettings(@Body() applicationSettingsDto: ApplicationSettingsDto): Promise<ApplicationSettings> {
    return this.settingsUserProfileService.updateApplicationSettings(applicationSettingsDto);
  }
}
