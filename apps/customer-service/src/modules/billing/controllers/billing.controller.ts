import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, UnauthorizedException, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BillingService } from '../services/billing.service';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/payment.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

// DTOs alignés avec le frontend
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

// Adapté aux attentes du frontend
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

// Structure pour le téléchargement manuel de preuve de paiement
class ManualPaymentProofDto {
  planId?: string;
  tokenAmount?: number;
  referenceNumber!: string;
  amount!: number;
  paymentDate!: string;
}

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('payments')
@ApiBearerAuth()
@Controller()
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

  // Endpoint adapté pour correspondre au frontend: /payments
  @Get('payments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer l\'historique des paiements de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Historique des paiements récupéré' })
  async getCurrentUserPayments(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<{ 
    success: boolean;
    data: any[];
    meta: { pagination: { page: number; limit: number; total: number; pages: number } }
  }> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const { payments, total, page: resultPage, limit: resultLimit } = await this.billingService.getPaymentsByAuth0Id(auth0Id, +page, +limit);
    
    // Format adapté pour le frontend
    return {
      success: true,
      data: payments.map(payment => ({
        id: payment.id,
        date: payment.paymentDate?.toISOString(),
        amount: payment.amount,
        currency: payment.currency,
        method: this.mapPaymentMethodToFrontend(payment.paymentMethod),
        plan: payment.invoice?.subscription?.plan?.name || 'N/A',
        status: this.mapPaymentStatusToFrontend(payment.status),
        receiptUrl: `/payments/${payment.id}/receipt`
      })),
      meta: { 
        pagination: { 
          page: resultPage, 
          limit: resultLimit, 
          total, 
          pages: Math.ceil(total / resultLimit) 
        } 
      }
    };
  }

  // Endpoint pour télécharger un reçu de paiement
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

  // Endpoint pour télécharger une preuve de paiement manuel adapté au frontend
  @Post('payments/manual')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('proofFile'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Télécharger une preuve de paiement manuelle' })
  @ApiResponse({ status: 200, description: 'Preuve de paiement téléchargée avec succès' })
  async uploadManualPaymentProof(
    @UploadedFile() proofFile: MulterFile,
    @Body() body: ManualPaymentProofDto,
    @Req() req: any
  ): Promise<{ success: boolean; data: { message: string; referenceId: string } }> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const result = await this.billingService.uploadManualPaymentWithFile(
      proofFile,
      {
        planId: body.planId,
        tokenAmount: body.tokenAmount ? +body.tokenAmount : undefined,
        referenceNumber: body.referenceNumber,
        amount: +body.amount,
        paymentDate: new Date(body.paymentDate),
      },
      auth0Id
    );
    
    return {
      success: true,
      data: {
        message: 'Preuve de paiement téléchargée avec succès',
        referenceId: result.id
      }
    };
  }
  
  // Méthodes utilitaires pour adapter au frontend
  private mapPaymentMethodToFrontend(method: string): string {
    const methodMap = {
      'credit_card': 'Carte bancaire',
      'bank_transfer': 'Virement bancaire',
      'mobile_money': 'Mobile Money',
      'manual': 'Paiement manuel',
      'crypto': 'Cryptomonnaie',
      'paypal': 'PayPal',
    };
    return methodMap[method] || method;
  }
  
  private mapPaymentStatusToFrontend(status: PaymentStatus): 'Payé' | 'En attente' | 'Échoué' {
    switch(status) {
      case PaymentStatus.COMPLETED:
        return 'Payé';
      case PaymentStatus.PENDING:
        return 'En attente';
      case PaymentStatus.FAILED:
      case PaymentStatus.CANCELLED:
        return 'Échoué';
      default:
        return 'En attente';
    }
  }
}
