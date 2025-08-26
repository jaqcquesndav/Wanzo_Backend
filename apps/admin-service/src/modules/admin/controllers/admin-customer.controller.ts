import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminCustomerService } from '../services/admin-customer.service';
import { AdminRoleGuard } from '../../auth/guards/admin-role.guard';
import { AdminCustomerActionDto } from '../dto/admin-customer.dto';

@ApiTags('admin-customers')
@Controller('admin/customers')
@UseGuards(AdminRoleGuard)
export class AdminCustomerController {
  constructor(private readonly adminCustomerService: AdminCustomerService) {}

  @Get()
  @ApiOperation({ summary: 'Liste tous les clients' })
  @ApiResponse({ status: 200, description: 'Liste des clients récupérée avec succès' })
  async findAllCustomers() {
    return this.adminCustomerService.findAllCustomers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupère un client par ID' })
  @ApiResponse({ status: 200, description: 'Client récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async findCustomerById(@Param('id') id: string) {
    return this.adminCustomerService.findCustomerById(id);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Valide un client' })
  @ApiResponse({ status: 200, description: 'Client validé avec succès' })
  async validateCustomer(
    @Param('id') id: string,
    @Body() actionDto: AdminCustomerActionDto,
  ) {
    return this.adminCustomerService.performCustomerAction({
      ...actionDto,
      customerId: id,
      action: 'validate',
    });
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend un client' })
  @ApiResponse({ status: 200, description: 'Client suspendu avec succès' })
  async suspendCustomer(
    @Param('id') id: string,
    @Body() actionDto: AdminCustomerActionDto,
  ) {
    return this.adminCustomerService.performCustomerAction({
      ...actionDto,
      customerId: id,
      action: 'suspend',
    });
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Réactive un client' })
  @ApiResponse({ status: 200, description: 'Client réactivé avec succès' })
  async reactivateCustomer(
    @Param('id') id: string,
    @Body() actionDto: AdminCustomerActionDto,
  ) {
    return this.adminCustomerService.performCustomerAction({
      ...actionDto,
      customerId: id,
      action: 'reactivate',
    });
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Liste tous les utilisateurs d\'un client' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée avec succès' })
  async getCustomerUsers(@Param('id') id: string) {
    return this.adminCustomerService.getCustomerUsers(id);
  }

  @Get(':id/subscriptions')
  @ApiOperation({ summary: 'Liste tous les abonnements d\'un client' })
  @ApiResponse({ status: 200, description: 'Liste des abonnements récupérée avec succès' })
  async getCustomerSubscriptions(@Param('id') id: string) {
    return this.adminCustomerService.getCustomerSubscriptions(id);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Récupère l\'utilisation des services par un client' })
  @ApiResponse({ status: 200, description: 'Statistiques d\'utilisation récupérées avec succès' })
  async getCustomerUsage(@Param('id') id: string) {
    return this.adminCustomerService.getCustomerUsage(id);
  }
}
