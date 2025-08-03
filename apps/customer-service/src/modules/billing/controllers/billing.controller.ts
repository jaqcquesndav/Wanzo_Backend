import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, UnauthorizedException, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from '../services/billing.service';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

class CreateInvoiceDto {
  customerId!: string;
  subscriptionId?: string;
  amount!: number;
  currency!: string;
  issueDate!: Date;
  dueDate!: Date;
  notes?: string;
  billingAddress?: string;
  items!: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  metadata?: Record<string, any>;
}

class CreatePaymentDto {
  customerId!: string;
  invoiceId?: string;
  amount!: number;
  currency!: string;
  paymentMethod!: string;
  transactionId?: string;
  paymentGateway?: string;
  paymentDate?: Date;
  notes?: string;
  gatewayResponse?: Record<string, any>;
  metadata?: Record<string, any>;
}

@ApiTags('payments')
@ApiBearerAuth()
@Controller('land/api/v1')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  @ApiOperation({ summary: 'Créer une nouvelle facture' })
  @ApiResponse({ status: 201, description: 'Facture créée avec succès' })
  async createInvoice(@Body() createDto: CreateInvoiceDto): Promise<Invoice> {
    return this.billingService.createInvoice(createDto);
  }

  @Put('invoices/:id/issue')
  @ApiOperation({ summary: 'Publier une facture (changer le statut de DRAFT à ISSUED)' })
  @ApiResponse({ status: 200, description: 'Facture publiée avec succès' })
  async issueInvoice(@Param('id') id: string): Promise<Invoice> {
    return this.billingService.issueInvoice(id);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Récupérer une facture par son ID' })
  @ApiResponse({ status: 200, description: 'Facture récupérée' })
  async getInvoice(@Param('id') id: string): Promise<Invoice> {
    return this.billingService.findInvoiceById(id);
  }

  @Get('invoices/customer/:customerId')
  @ApiOperation({ summary: 'Récupérer les factures d\'un client' })
  @ApiResponse({ status: 200, description: 'Factures récupérées' })
  async getCustomerInvoices(
    @Param('customerId') customerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: InvoiceStatus
  ): Promise<{ invoices: Invoice[], total: number, page: number, limit: number }> {
    const [invoices, total] = await this.billingService.findInvoicesByCustomer(
      customerId,
      +page,
      +limit,
      status
    );
    
    return {
      invoices,
      total,
      page: +page,
      limit: +limit
    };
  }

  @Post('payments')
  @ApiOperation({ summary: 'Enregistrer un paiement' })
  @ApiResponse({ status: 201, description: 'Paiement enregistré avec succès' })
  async recordPayment(@Body() createDto: CreatePaymentDto): Promise<Payment> {
    return this.billingService.recordPayment(createDto);
  }

  @Get('payments/customer/:customerId')
  @ApiOperation({ summary: 'Récupérer les paiements d\'un client' })
  @ApiResponse({ status: 200, description: 'Paiements récupérés' })
  async getCustomerPayments(
    @Param('customerId') customerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ): Promise<{ payments: Payment[], total: number, page: number, limit: number }> {
    const [payments, total] = await this.billingService.findPaymentsByCustomer(
      customerId,
      +page,
      +limit
    );
    
    return {
      payments,
      total,
      page: +page,
      limit: +limit
    };
  }

  @Get('invoices/overdue')
  @ApiOperation({ summary: 'Récupérer les factures en retard de paiement' })
  @ApiResponse({ status: 200, description: 'Factures récupérées' })
  async getOverdueInvoices(): Promise<Invoice[]> {
    return this.billingService.findOverdueInvoices();
  }

  @Post('invoices/mark-overdue')
  @ApiOperation({ summary: 'Marquer les factures en retard' })
  @ApiResponse({ status: 200, description: 'Factures marquées avec succès' })
  async markOverdueInvoices(): Promise<{ affected: number }> {
    const affected = await this.billingService.markOverdueInvoices();
    return { affected };
  }

  // Endpoints selon la documentation frontend

  @Get('payments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer l\'historique des paiements de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Historique des paiements récupéré' })
  async getCurrentUserPayments(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<{ payments: Payment[], total: number, page: number, limit: number }> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    return this.billingService.getPaymentsByAuth0Id(auth0Id, +page, +limit);
  }

  @Get('payments/:id/receipt')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Télécharger le reçu d\'un paiement (PDF)' })
  @ApiResponse({ status: 200, description: 'Reçu téléchargé avec succès' })
  async downloadReceipt(
    @Param('id') paymentId: string,
    @Req() req: any,
    @Res() res: any
  ): Promise<void> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const receiptBuffer = await this.billingService.generatePaymentReceiptPdf(paymentId, auth0Id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${paymentId}.pdf"`,
      'Content-Length': receiptBuffer.length,
    });
    
    res.send(receiptBuffer);
  }

  @Post('payments/manual-proof')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Télécharger une preuve de paiement manuelle' })
  @ApiResponse({ status: 200, description: 'Preuve de paiement téléchargée avec succès' })
  async uploadManualProof(
    @Body() proofData: { 
      paymentId: string; 
      proofUrl: string; 
      description?: string;
      amount: number;
      currency: string;
    },
    @Req() req: any
  ): Promise<{ success: boolean; message: string }> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    await this.billingService.uploadManualPaymentProof(proofData, auth0Id);
    
    return {
      success: true,
      message: 'Preuve de paiement téléchargée avec succès'
    };
  }
}
