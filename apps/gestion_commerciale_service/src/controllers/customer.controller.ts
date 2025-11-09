import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  RequireCustomerCreation,
  RequireInvoiceGeneration,
  RequireSalesTransaction,
  RequireDataExport,
  RequireCustomReport 
} from '@wanzobe/shared';
import { CustomerService } from '../services/customer.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from '../dto/customer.dto';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  /**
   * Créer un nouveau client
   * Consomme 1 crédit de client actif
   */
  @Post()
  @RequireCustomerCreation(1)
  @ApiOperation({ 
    summary: 'Créer un nouveau client',
    description: 'Crée un nouveau client. Consomme 1 crédit de client actif selon le plan d\'abonnement.'
  })
  async create(@Body() createDto: CreateCustomerDto) {
    return this.customerService.create(createDto);
  }

  /**
   * Importer des clients en lot
   * Consomme autant de crédits que de clients importés
   */
  @Post('import')
  @RequireCustomerCreation() // Quantité déterminée par le nombre de clients dans le fichier
  @ApiOperation({ 
    summary: 'Importer des clients en lot',
    description: 'Importe plusieurs clients depuis un fichier. Consomme 1 crédit par client importé.'
  })
  async importCustomers(@Body() importData: { customers: CreateCustomerDto[] }) {
    return this.customerService.importCustomers(importData.customers);
  }

  /**
   * Récupérer les clients
   * Lecture gratuite
   */
  @Get()
  @ApiOperation({ summary: 'Récupérer la liste des clients' })
  async findAll(@Query() query: CustomerQueryDto) {
    return this.customerService.findAll(query);
  }

  /**
   * Récupérer un client par ID
   * Lecture gratuite
   */
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un client par ID' })
  async findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  /**
   * Mettre à jour un client
   * Ne consomme pas de crédit supplémentaire
   */
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un client' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateCustomerDto) {
    return this.customerService.update(id, updateDto);
  }

  /**
   * Supprimer un client
   * Libère un crédit de client actif
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un client' })
  async remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }

  /**
   * Exporter les données clients
   * Consomme 1 crédit d'export de données
   */
  @Post('export')
  @RequireDataExport(1)
  @ApiOperation({ 
    summary: 'Exporter les données clients',
    description: 'Exporte les données clients au format spécifié. Consomme 1 crédit d\'export mensuel.'
  })
  async exportCustomers(@Body() exportConfig: any) {
    return this.customerService.exportCustomersData(exportConfig);
  }

  /**
   * Générer un rapport personnalisé sur les clients
   * Consomme 1 crédit de rapport personnalisé
   */
  @Post('reports/custom')
  @RequireCustomReport(1)
  @ApiOperation({ 
    summary: 'Générer un rapport clients personnalisé',
    description: 'Génère un rapport personnalisé sur les clients. Consomme 1 crédit de rapport mensuel.'
  })
  async generateCustomReport(@Body() reportConfig: any) {
    return this.customerService.generateCustomerReport(reportConfig);
  }
}