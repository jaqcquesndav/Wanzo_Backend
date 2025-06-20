import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationService } from '../services/organization.service';
import { Organization } from '../entities/organization.entity';
import { UpdateOrganizationDto } from '../dtos/update-organization.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { Request as ExpressRequest } from 'express';

@ApiTags('organization')
@Controller('organization')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @ApiOperation({ summary: "Obtenir les Informations de l'Organisation" })
  @ApiResponse({ status: 200, description: "Retourne les informations de l'organisation connectée", type: Organization })
  async getOrganization(@Request() req: ExpressRequest & { user: { companyId: string } }): Promise<any> {
    const organization = await this.organizationService.findByCompanyId(req.user.companyId);
    return {
      success: true,
      data: organization
    };
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: "Mettre à Jour les Informations de l'Organisation" })
  @ApiResponse({ status: 200, description: "Les informations de l'organisation ont été mises à jour", type: Organization })
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
