import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminCompanyService } from '../services/admin-company.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/enums/user-role.enum';

@ApiTags('Admin - Companies')
@Controller('admin/companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminCompanyController {
  constructor(private readonly adminCompanyService: AdminCompanyService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Récupérer toutes les entreprises (SME/Company)' })
  @ApiResponse({ status: 200, description: 'Liste des entreprises récupérée avec succès' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    try {
      return await this.adminCompanyService.findAllCompanies(page, limit, {
        status,
        category,
        search,
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch companies',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Récupérer une entreprise par ID' })
  @ApiResponse({ status: 200, description: 'Entreprise récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Entreprise non trouvée' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.adminCompanyService.findCompanyById(id);
    } catch (error) {
      throw new HttpException(
        'Company not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get(':id/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Récupérer les utilisateurs d\'une entreprise' })
  @ApiResponse({ status: 200, description: 'Utilisateurs récupérés avec succès' })
  async getUsers(@Param('id') id: string) {
    try {
      return await this.adminCompanyService.getCompanyUsers(id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch company users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/sales')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.FINANCIAL_ADMIN)
  @ApiOperation({ summary: 'Récupérer les ventes d\'une entreprise' })
  @ApiResponse({ status: 200, description: 'Ventes récupérées avec succès' })
  async getSales(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    try {
      return await this.adminCompanyService.getCompanySales(id, {
        startDate,
        endDate,
        status,
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch company sales',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/expenses')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.FINANCIAL_ADMIN)
  @ApiOperation({ summary: 'Récupérer les dépenses d\'une entreprise' })
  @ApiResponse({ status: 200, description: 'Dépenses récupérées avec succès' })
  async getExpenses(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string,
  ) {
    try {
      return await this.adminCompanyService.getCompanyExpenses(id, {
        startDate,
        endDate,
        category,
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch company expenses',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/inventory')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Récupérer l\'inventaire d\'une entreprise' })
  @ApiResponse({ status: 200, description: 'Inventaire récupéré avec succès' })
  async getInventory(@Param('id') id: string) {
    try {
      return await this.adminCompanyService.getCompanyInventory(id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch company inventory',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/customers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Récupérer les clients d\'une entreprise' })
  @ApiResponse({ status: 200, description: 'Clients récupérés avec succès' })
  async getCustomers(@Param('id') id: string) {
    try {
      return await this.adminCompanyService.getCompanyCustomers(id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch company customers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/suppliers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Récupérer les fournisseurs d\'une entreprise' })
  @ApiResponse({ status: 200, description: 'Fournisseurs récupérés avec succès' })
  async getSuppliers(@Param('id') id: string) {
    try {
      return await this.adminCompanyService.getCompanySuppliers(id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch company suppliers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/financial-stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.FINANCIAL_ADMIN)
  @ApiOperation({ summary: 'Récupérer les statistiques financières d\'une entreprise' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getFinancialStats(
    @Param('id') id: string,
    @Query('period') period?: string,
  ) {
    try {
      return await this.adminCompanyService.getCompanyFinancialStats(id, period);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch company financial stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/subscription')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.FINANCIAL_ADMIN)
  @ApiOperation({ summary: 'Récupérer l\'abonnement d\'une entreprise' })
  @ApiResponse({ status: 200, description: 'Abonnement récupéré avec succès' })
  async getSubscription(@Param('id') id: string) {
    try {
      return await this.adminCompanyService.getCompanySubscription(id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch company subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Mettre à jour une entreprise' })
  @ApiResponse({ status: 200, description: 'Entreprise mise à jour avec succès' })
  async update(
    @Param('id') id: string,
    @Body() updateData: {
      name?: string;
      status?: string;
      category?: string;
      address?: string;
      phone?: string;
      email?: string;
    },
  ) {
    try {
      return await this.adminCompanyService.updateCompany(id, updateData);
    } catch (error) {
      throw new HttpException(
        'Failed to update company',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Suspendre une entreprise' })
  @ApiResponse({ status: 200, description: 'Entreprise suspendue avec succès' })
  async suspend(
    @Param('id') id: string,
    @Body() data: { reason: string },
  ) {
    try {
      return await this.adminCompanyService.suspendCompany(id, data.reason);
    } catch (error) {
      throw new HttpException(
        'Failed to suspend company',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/reactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Réactiver une entreprise' })
  @ApiResponse({ status: 200, description: 'Entreprise réactivée avec succès' })
  async reactivate(@Param('id') id: string) {
    try {
      return await this.adminCompanyService.reactivateCompany(id);
    } catch (error) {
      throw new HttpException(
        'Failed to reactivate company',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/users/:userId/suspend')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Suspendre un utilisateur d\'une entreprise' })
  @ApiResponse({ status: 200, description: 'Utilisateur suspendu avec succès' })
  async suspendUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() data: { reason: string },
  ) {
    try {
      return await this.adminCompanyService.suspendCompanyUser(id, userId, data.reason);
    } catch (error) {
      throw new HttpException(
        'Failed to suspend company user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/users/:userId/reactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.CUSTOMER_MANAGER)
  @ApiOperation({ summary: 'Réactiver un utilisateur d\'une entreprise' })
  @ApiResponse({ status: 200, description: 'Utilisateur réactivé avec succès' })
  async reactivateUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    try {
      return await this.adminCompanyService.reactivateCompanyUser(id, userId);
    } catch (error) {
      throw new HttpException(
        'Failed to reactivate company user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/tokens/allocate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Allouer des tokens à une entreprise' })
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
      return await this.adminCompanyService.allocateTokensToCompany(id, data);
    } catch (error) {
      throw new HttpException(
        'Failed to allocate tokens to company',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/subscriptions/:subscriptionId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.FINANCIAL_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour l\'abonnement d\'une entreprise' })
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
      return await this.adminCompanyService.updateCompanySubscription(
        id,
        subscriptionId,
        updates,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to update company subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/subscriptions/:subscriptionId/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Annuler l\'abonnement d\'une entreprise' })
  @ApiResponse({ status: 200, description: 'Abonnement annulé avec succès' })
  async cancelSubscription(
    @Param('id') id: string,
    @Param('subscriptionId') subscriptionId: string,
    @Body() data: { reason: string },
  ) {
    try {
      return await this.adminCompanyService.cancelCompanySubscription(
        id,
        subscriptionId,
        data.reason,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to cancel company subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/subscriptions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CTO)
  @ApiOperation({ summary: 'Créer un abonnement pour une entreprise' })
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
      return await this.adminCompanyService.createCompanySubscription(id, data);
    } catch (error) {
      throw new HttpException(
        'Failed to create company subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
