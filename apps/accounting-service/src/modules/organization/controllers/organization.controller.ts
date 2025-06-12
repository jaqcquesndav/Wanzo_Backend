import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationService } from '../services/organization.service';
import { Organization } from '../entities/organization.entity';
import { UpdateOrganizationDto } from '../dtos/update-organization.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@ApiTags('organization')
@Controller('organization')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}
  @Get()
  @ApiOperation({ summary: 'Get organization details' })
  @ApiResponse({ status: 200, description: 'Return the organization details', type: Organization })
  async getOrganization(@Request() req: ExpressRequest & { user: { companyId: string } }): Promise<any> {
    const organization = await this.organizationService.findByCompanyId(req.user.companyId);
    return {
      success: true,
      data: organization
    };
  }
  @Put()
  @ApiOperation({ summary: 'Update organization details' })
  @ApiResponse({ status: 200, description: 'The organization has been updated', type: Organization })
  async updateOrganization(
    @Body() updateOrganizationDto: UpdateOrganizationDto, 
    @Request() req: ExpressRequest & { user: { companyId: string } }
  ): Promise<any> {
    const organization = await this.organizationService.update(
      req.user.companyId, 
      updateOrganizationDto
    );
    return {
      success: true,
      data: organization
    };
  }
}
