import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminAccountingService } from '../services/admin-accounting.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@ApiTags('Admin - Accounting')
@ApiBearerAuth()
@Controller('admin/accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AdminAccountingController {
  constructor(private readonly adminAccountingService: AdminAccountingService) {}

  @Get('entries')
  @ApiOperation({ summary: 'Récupérer les entrées comptables (Admin)' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Liste des entrées comptables' })
  async getAccountingEntries(@Query() params: any) {
    return this.adminAccountingService.getAccountingEntries(params);
  }

  @Get('entries/:entryId')
  @ApiOperation({ summary: 'Récupérer une entrée comptable par ID (Admin)' })
  @ApiParam({ name: 'entryId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Détails de l\'entrée comptable' })
  async getAccountingEntryById(@Param('entryId', ParseUUIDPipe) entryId: string) {
    return this.adminAccountingService.getAccountingEntryById(entryId);
  }

  @Post('entries/adjustment')
  @ApiOperation({ summary: 'Créer un ajustement comptable manuel (Admin)' })
  @ApiResponse({ status: 201, description: 'Ajustement créé avec succès' })
  async createManualAdjustment(@Body() data: {
    customerId: string;
    amount: number;
    currency: string;
    type: 'debit' | 'credit';
    description: string;
    reason: string;
    createdBy: string;
    metadata?: Record<string, any>;
  }) {
    return this.adminAccountingService.createManualAdjustment(data);
  }

  @Get('reports/financial')
  @ApiOperation({ summary: 'Récupérer un rapport financier (Admin)' })
  @ApiQuery({ name: 'customerId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'Rapport financier' })
  async getFinancialReport(@Query() params: any) {
    return this.adminAccountingService.getFinancialReport(params);
  }

  @Post('reconciliation')
  @ApiOperation({ summary: 'Réconcilier un paiement avec une facture (Admin)' })
  @ApiResponse({ status: 201, description: 'Réconciliation effectuée' })
  async reconcilePayment(@Body() data: {
    invoiceId: string;
    paymentId: string;
    amount: number;
    reconciledBy: string;
    notes?: string;
  }) {
    return this.adminAccountingService.reconcilePayment(data);
  }

  @Get('customers/:customerId/balance')
  @ApiOperation({ summary: 'Récupérer le solde d\'un client (Admin)' })
  @ApiParam({ name: 'customerId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Solde du client' })
  async getCustomerBalance(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.adminAccountingService.getCustomerBalance(customerId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Récupérer les transactions (Admin)' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Liste des transactions' })
  async getCustomerTransactions(@Query() params: any) {
    return this.adminAccountingService.getCustomerTransactions(params);
  }

  @Post('export')
  @ApiOperation({ summary: 'Exporter les données comptables (Admin)' })
  @ApiResponse({ status: 200, description: 'Données exportées' })
  async exportAccountingData(@Body() params: {
    customerId?: string;
    startDate: string;
    endDate: string;
    format: 'csv' | 'xlsx' | 'pdf';
  }) {
    return this.adminAccountingService.exportAccountingData(params);
  }

  @Post('invoices/:invoiceId/validate')
  @ApiOperation({ summary: 'Valider une facture (Admin)' })
  @ApiParam({ name: 'invoiceId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Facture validée' })
  async validateInvoice(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() data: { validatedBy: string; notes?: string }
  ) {
    return this.adminAccountingService.validateInvoice(invoiceId, data.validatedBy, data.notes);
  }
}
