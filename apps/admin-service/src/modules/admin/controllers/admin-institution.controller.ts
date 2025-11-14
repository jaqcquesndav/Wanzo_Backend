import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminInstitutionService } from '../services/admin-institution.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/enums/user-role.enum';

@ApiTags('Admin - Institutions')
@Controller('institutions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminInstitutionController {
  constructor(private readonly adminInstitutionService: AdminInstitutionService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Récupérer toutes les institutions financières' })
  @ApiResponse({ status: 200, description: 'Liste des institutions récupérée avec succès' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    try {
      return await this.adminInstitutionService.findAllInstitutions(page, limit, {
        status,
        type,
        search,
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch institutions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Récupérer une institution par ID' })
  @ApiResponse({ status: 200, description: 'Institution récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Institution non trouvée' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.adminInstitutionService.findInstitutionById(id);
    } catch (error) {
      throw new HttpException(
        'Institution not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get(':id/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Récupérer les utilisateurs d\'une institution' })
  @ApiResponse({ status: 200, description: 'Utilisateurs récupérés avec succès' })
  async getUsers(@Param('id') id: string) {
    try {
      return await this.adminInstitutionService.getInstitutionUsers(id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch institution users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/portfolios')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.FINANCIAL_ADMIN)
  @ApiOperation({ summary: 'Récupérer les portefeuilles d\'une institution' })
  @ApiResponse({ status: 200, description: 'Portefeuilles récupérés avec succès' })
  async getPortfolios(@Param('id') id: string) {
    try {
      return await this.adminInstitutionService.getInstitutionPortfolios(id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch institution portfolios',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.FINANCIAL_ADMIN)
  @ApiOperation({ summary: 'Récupérer les statistiques d\'une institution' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getStatistics(@Param('id') id: string) {
    try {
      return await this.adminInstitutionService.getInstitutionStatistics(id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch institution statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/subscription')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.FINANCIAL_ADMIN)
  @ApiOperation({ summary: 'Récupérer l\'abonnement d\'une institution' })
  @ApiResponse({ status: 200, description: 'Abonnement récupéré avec succès' })
  async getSubscription(@Param('id') id: string) {
    try {
      return await this.adminInstitutionService.getInstitutionSubscription(id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch institution subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Mettre à jour une institution' })
  @ApiResponse({ status: 200, description: 'Institution mise à jour avec succès' })
  async update(
    @Param('id') id: string,
    @Body() updateData: {
      name?: string;
      status?: string;
      institutionType?: string;
      regulatoryLicenseNumber?: string;
      contacts?: any;
    },
  ) {
    try {
      return await this.adminInstitutionService.updateInstitution(id, updateData);
    } catch (error) {
      throw new HttpException(
        'Failed to update institution',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Suspendre une institution' })
  @ApiResponse({ status: 200, description: 'Institution suspendue avec succès' })
  async suspend(
    @Param('id') id: string,
    @Body() data: { reason: string },
  ) {
    try {
      return await this.adminInstitutionService.suspendInstitution(id, data.reason);
    } catch (error) {
      throw new HttpException(
        'Failed to suspend institution',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/reactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Réactiver une institution' })
  @ApiResponse({ status: 200, description: 'Institution réactivée avec succès' })
  async reactivate(@Param('id') id: string) {
    try {
      return await this.adminInstitutionService.reactivateInstitution(id);
    } catch (error) {
      throw new HttpException(
        'Failed to reactivate institution',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/users/:userId/suspend')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Suspendre un utilisateur d\'une institution' })
  @ApiResponse({ status: 200, description: 'Utilisateur suspendu avec succès' })
  async suspendUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() data: { reason: string },
  ) {
    try {
      return await this.adminInstitutionService.suspendInstitutionUser(id, userId, data.reason);
    } catch (error) {
      throw new HttpException(
        'Failed to suspend institution user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/users/:userId/reactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Réactiver un utilisateur d\'une institution' })
  @ApiResponse({ status: 200, description: 'Utilisateur réactivé avec succès' })
  async reactivateUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    try {
      return await this.adminInstitutionService.reactivateInstitutionUser(id, userId);
    } catch (error) {
      throw new HttpException(
        'Failed to reactivate institution user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/tokens/allocate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Allouer des tokens à une institution' })
  @ApiResponse({ status: 200, description: 'Tokens alloués avec succès' })
  async allocateTokens(
    @Param('id') id: string,
    @Body() data: {
      amount: number;
      reason: string;
      expiryDate?: string;
      metadata?: Record<string, any>;
    },
  ) {
    try {
      return await this.adminInstitutionService.allocateTokensToInstitution(id, data);
    } catch (error) {
      throw new HttpException(
        'Failed to allocate tokens to institution',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/subscriptions/:subscriptionId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.FINANCIAL_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour l\'abonnement d\'une institution' })
  @ApiResponse({ status: 200, description: 'Abonnement mis à jour avec succès' })
  async updateSubscription(
    @Param('id') id: string,
    @Param('subscriptionId') subscriptionId: string,
    @Body() updates: {
      status?: string;
      tokensIncluded?: number;
      tokensRemaining?: number;
      endDate?: string;
    },
  ) {
    try {
      return await this.adminInstitutionService.updateInstitutionSubscription(
        id,
        subscriptionId,
        updates,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to update institution subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/subscriptions/:subscriptionId/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Annuler l\'abonnement d\'une institution' })
  @ApiResponse({ status: 200, description: 'Abonnement annulé avec succès' })
  async cancelSubscription(
    @Param('id') id: string,
    @Param('subscriptionId') subscriptionId: string,
    @Body() data: { reason: string },
  ) {
    try {
      return await this.adminInstitutionService.cancelInstitutionSubscription(
        id,
        subscriptionId,
        data.reason,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to cancel institution subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/subscriptions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Créer un abonnement pour une institution' })
  @ApiResponse({ status: 201, description: 'Abonnement créé avec succès' })
  async createSubscription(
    @Param('id') id: string,
    @Body() data: {
      planId: string;
      startDate: string;
      billingCycle: string;
      autoRenew?: boolean;
    },
  ) {
    try {
      return await this.adminInstitutionService.createInstitutionSubscription(id, data);
    } catch (error) {
      throw new HttpException(
        'Failed to create institution subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
