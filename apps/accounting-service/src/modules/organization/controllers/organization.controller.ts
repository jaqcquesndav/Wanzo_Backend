import { Controller, Get, Put, Post, Body, UseGuards, Request, Param, Delete, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiParam, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
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
  async getOrganization(@Request() req: ExpressRequest & { user: { organizationId: string; role: string } }): Promise<any> {
    // Pour les super admins qui n'ont pas d'organisation réelle
    if (!req.user.organizationId || req.user.organizationId === 'default-company') {
      return {
        success: true,
        data: {
          id: null,
          name: 'Wanzo Administration',
          message: 'Super admin account - No organization required'
        }
      };
    }
    
    const organization = await this.organizationService.findById(req.user.organizationId);
    return {
      success: true,
      data: organization
    };
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: "Mettre à Jour les Informations de l'Organisation" })
  @ApiResponse({ status: 200, description: "Les informations de l'organisation ont été mises à jour", type: Organization })
  async updateOrganization(
    @Body() updateOrganizationDto: UpdateOrganizationDto, 
    @Request() req: ExpressRequest & { user: { organizationId: string } }
  ): Promise<any> {
    const organization = await this.organizationService.update(
      req.user.organizationId, 
      updateOrganizationDto
    );
    return {
      success: true,
      data: organization
    };
  }

  @Post('logo')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: "Mettre à Jour le Logo de l'Organisation" })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads/logos',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = file.originalname.split('.').pop();
          cb(null, `logo-${uniqueSuffix}.${extension}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 1024 * 1024 * 2, // 2MB
      },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Le logo de l'organisation a été mis à jour" })
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: ExpressRequest & { user: { organizationId: string } }
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('No logo file uploaded');
    }
    const logoUrl = await this.organizationService.updateLogo(req.user.organizationId, file);
    return {
      success: true,
      data: {
        logo: logoUrl
      }
    };
  }

  @Get('fiscal-settings')
  @ApiOperation({ summary: "Obtenir les Paramètres Fiscaux de l'Organisation" })
  @ApiResponse({ status: 200, description: "Retourne les paramètres fiscaux de l'organisation" })
  async getFiscalSettings(@Request() req: ExpressRequest & { user: { organizationId: string } }): Promise<any> {
    const fiscalSettings = await this.organizationService.getFiscalSettings(req.user.organizationId);
    return {
      success: true,
      data: fiscalSettings
    };
  }

  @Put('fiscal-settings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: "Mettre à Jour les Paramètres Fiscaux de l'Organisation" })
  @ApiResponse({ status: 200, description: "Les paramètres fiscaux de l'organisation ont été mis à jour" })
  async updateFiscalSettings(
    @Body() fiscalSettingsDto: any,
    @Request() req: ExpressRequest & { user: { organizationId: string } }
  ): Promise<any> {
    const fiscalSettings = await this.organizationService.updateFiscalSettings(req.user.organizationId, fiscalSettingsDto);
    return {
      success: true,
      data: fiscalSettings
    };
  }

  @Get('bank-details')
  @ApiOperation({ summary: "Obtenir les Coordonnées Bancaires de l'Organisation" })
  @ApiResponse({ status: 200, description: "Retourne les coordonnées bancaires de l'organisation" })
  async getBankDetails(@Request() req: ExpressRequest & { user: { organizationId: string } }): Promise<any> {
    const bankDetails = await this.organizationService.getBankDetails(req.user.organizationId);
    return {
      success: true,
      data: bankDetails
    };
  }

  @Post('bank-details')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: "Ajouter des Coordonnées Bancaires" })
  @ApiResponse({ status: 201, description: "Nouvelles coordonnées bancaires ajoutées" })
  async addBankDetails(
    @Body() bankDetailsDto: any,
    @Request() req: ExpressRequest & { user: { organizationId: string } }
  ): Promise<any> {
    const bankDetails = await this.organizationService.addBankDetails(req.user.organizationId, bankDetailsDto);
    return {
      success: true,
      data: bankDetails
    };
  }

  @Put('bank-details/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: "Mettre à Jour des Coordonnées Bancaires" })
  @ApiResponse({ status: 200, description: "Coordonnées bancaires mises à jour" })
  async updateBankDetails(
    @Param('id') bankDetailsId: string,
    @Body() bankDetailsDto: any,
    @Request() req: ExpressRequest & { user: { organizationId: string } }
  ): Promise<any> {
    const bankDetails = await this.organizationService.updateBankDetails(
      req.user.organizationId, 
      bankDetailsId, 
      bankDetailsDto
    );
    return {
      success: true,
      data: bankDetails
    };
  }

  @Delete('bank-details/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Supprimer des Coordonnées Bancaires" })
  @ApiResponse({ status: 200, description: "Coordonnées bancaires supprimées" })
  async deleteBankDetails(
    @Param('id') bankDetailsId: string,
    @Request() req: ExpressRequest & { user: { organizationId: string } }
  ): Promise<any> {
    await this.organizationService.deleteBankDetails(req.user.organizationId, bankDetailsId);
    return {
      success: true,
      message: "Bank details successfully deleted"
    };
  }
}
