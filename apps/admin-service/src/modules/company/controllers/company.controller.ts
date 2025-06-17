import {
  Controller, 
  Get, 
  Put, 
  Post, 
  Delete,
  Body, 
  Param,
  UseInterceptors, 
  UploadedFile, 
  UseGuards,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompanyService } from '../services';
import { 
  CompanyProfileResponseDto,
  CompanyUpdateResponseDto,
  UpdateCompanyProfileDto,
  LogoResponseDto,
  DocumentResponseDto,
  AddLocationDto,
  UpdateLocationDto,
  LocationResponseDto
} from '../dtos/company.dto';
import { 
  ApiBearerAuth, 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiConsumes, 
  ApiBody,
  ApiParam
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/enums';

@ApiTags('Company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('profile')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get Company Profile', description: 'Retrieves the profile information for Wanzo' })
  @ApiResponse({ status: 200, description: 'Company profile retrieved successfully', type: CompanyProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid' })
  @ApiResponse({ status: 403, description: 'Authenticated user does not have permission to view company profile' })
  @ApiResponse({ status: 404, description: 'Company profile not found' })
  async getCompanyProfile(): Promise<CompanyProfileResponseDto> {
    const data = await this.companyService.getCompanyProfile();
    return { data };
  }

  @Put('profile')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Update Company Profile', description: 'Updates the profile information for Wanzo' })
  @ApiResponse({ status: 200, description: 'Company profile updated successfully', type: CompanyUpdateResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid' })
  @ApiResponse({ status: 403, description: 'Authenticated user does not have permission to update company profile' })
  @ApiResponse({ status: 404, description: 'Company profile not found' })
  async updateCompanyProfile(
    @Body() updateDto: UpdateCompanyProfileDto
  ): Promise<CompanyUpdateResponseDto> {
    const data = await this.companyService.updateCompanyProfile(updateDto);
    return {
      message: 'Company profile updated successfully',
      data
    };
  }

  @Post('logo')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiOperation({ summary: 'Upload Company Logo', description: 'Uploads a new logo for the company' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Logo image file'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Logo uploaded successfully', type: LogoResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid' })
  @ApiResponse({ status: 403, description: 'Authenticated user does not have permission to update company logo' })
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File
  ): Promise<LogoResponseDto> {
    const result = await this.companyService.uploadLogo(
      file.buffer,
      file.originalname
    );
    return {
      message: 'Logo uploaded successfully',
      data: {
        logoUrl: result.logoUrl
      }
    };
  }

  @Post('documents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload Company Document', description: 'Uploads a company document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file'
        },
        type: {
          type: 'string',
          description: 'Document type',
          enum: ['rccmFile', 'nationalIdFile', 'taxNumberFile', 'cnssFile']
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully', type: DocumentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid' })
  @ApiResponse({ status: 403, description: 'Authenticated user does not have permission to upload company documents' })
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string
  ): Promise<DocumentResponseDto> {
    const result = await this.companyService.uploadDocument(
      file.buffer,
      file.originalname,
      type
    );
    return {
      message: 'Document uploaded successfully',
      data: result
    };
  }

  @Get('documents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List Company Documents', description: 'Retrieves a list of all company documents' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid' })
  @ApiResponse({ status: 403, description: 'Authenticated user does not have permission to view company documents' })
  async getDocuments() {
    const data = await this.companyService.listDocuments();
    return { data };
  }

  @Post('locations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Add Company Location', description: 'Adds a new location for the company' })
  @ApiResponse({ status: 201, description: 'Location added successfully', type: LocationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid' })
  @ApiResponse({ status: 403, description: 'Authenticated user does not have permission to add company locations' })
  @HttpCode(HttpStatus.CREATED)
  async addLocation(
    @Body() locationDto: AddLocationDto
  ): Promise<LocationResponseDto> {
    const result = await this.companyService.addLocation(locationDto);
    return {
      message: 'Location added successfully',
      data: {
        id: result.id,
        address: result.address,
        coordinates: result.coordinates,
        type: result.type,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      }
    };
  }

  @Put('locations/:locationId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Update Company Location', description: 'Updates an existing company location' })
  @ApiParam({ name: 'locationId', description: 'ID of the location to update' })
  @ApiResponse({ status: 200, description: 'Location updated successfully', type: LocationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid' })
  @ApiResponse({ status: 403, description: 'Authenticated user does not have permission to update company locations' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async updateLocation(
    @Param('locationId') locationId: string,
    @Body() updateDto: UpdateLocationDto
  ): Promise<LocationResponseDto> {
    const result = await this.companyService.updateLocation(locationId, updateDto);
    return {
      message: 'Location updated successfully',
      data: {
        id: result.id,
        address: result.address,
        coordinates: result.coordinates,
        type: result.type,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      }
    };
  }

  @Delete('locations/:locationId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Delete Company Location', description: 'Deletes a company location' })
  @ApiParam({ name: 'locationId', description: 'ID of the location to delete' })
  @ApiResponse({ status: 200, description: 'Location deleted successfully' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid' })
  @ApiResponse({ status: 403, description: 'Authenticated user does not have permission to delete company locations' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async deleteLocation(
    @Param('locationId') locationId: string
  ): Promise<{ message: string }> {
    await this.companyService.deleteLocation(locationId);
    return { message: 'Location deleted successfully' };
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.GROWTH_FINANCE)
  @ApiOperation({ summary: 'Get Company Statistics', description: 'Retrieves statistics about the company' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Authentication token is missing or invalid' })
  @ApiResponse({ status: 403, description: 'Authenticated user does not have permission to view company statistics' })
  async getCompanyStatistics() {
    const data = await this.companyService.getCompanyStatistics();
    return { data };
  }
}
