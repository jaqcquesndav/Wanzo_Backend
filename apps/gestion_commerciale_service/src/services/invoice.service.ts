import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceResponseDto, InvoiceQueryDto } from '../dto/invoice.dto';

/**
 * Service de gestion des factures
 * Mock implementation pour le développement
 */
@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  /**
   * Créer une nouvelle facture
   */
  async create(createDto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    // Mock implementation
    const mockInvoice: InvoiceResponseDto = {
      id: `invoice_${Date.now()}`,
      invoiceNumber: this.generateInvoiceNumber(),
      customerId: createDto.customerId,
      issueDate: createDto.issueDate || new Date(),
      dueDate: createDto.dueDate,
      items: createDto.items,
      subtotal: createDto.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
      taxAmount: 0, // Will be calculated
      discountAmount: createDto.discountAmount || 0,
      totalAmount: 0, // Will be calculated
      currency: createDto.currency || 'USD',
      status: 'draft',
      paymentStatus: 'pending',
      notes: createDto.notes || '',
      tags: createDto.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Calculate tax and total
    mockInvoice.taxAmount = mockInvoice.subtotal * (createDto.taxRate || 0.16); // 16% VAT by default
    mockInvoice.totalAmount = mockInvoice.subtotal + mockInvoice.taxAmount - mockInvoice.discountAmount;

    return mockInvoice;
  }

  /**
   * Récupérer toutes les factures avec filtres
   */
  async findAll(query: InvoiceQueryDto = {}): Promise<{
    invoices: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Mock implementation
    const mockInvoices: InvoiceResponseDto[] = [
      {
        id: 'invoice_1',
        invoiceNumber: 'INV-2024-001',
        customerId: 'customer_1',
        issueDate: new Date(Date.now() - 86400000 * 10),
        dueDate: new Date(Date.now() + 86400000 * 20),
        items: [
          {
            id: 'item_1',
            description: 'Service de consultation',
            quantity: 10,
            unitPrice: 500,
            total: 5000
          }
        ],
        subtotal: 5000,
        taxAmount: 800,
        discountAmount: 0,
        totalAmount: 5800,
        currency: 'USD',
        status: 'sent',
        paymentStatus: 'paid',
        notes: 'Facture pour services de consultation Q4 2024',
        tags: ['consulting', 'q4'],
        createdAt: new Date(Date.now() - 86400000 * 10),
        updatedAt: new Date(Date.now() - 86400000 * 5)
      },
      {
        id: 'invoice_2',
        invoiceNumber: 'INV-2024-002',
        customerId: 'customer_2',
        issueDate: new Date(Date.now() - 86400000 * 5),
        dueDate: new Date(Date.now() + 86400000 * 25),
        items: [
          {
            id: 'item_2',
            description: 'Licence logiciel',
            quantity: 1,
            unitPrice: 2000,
            total: 2000
          },
          {
            id: 'item_3',
            description: 'Support technique',
            quantity: 12,
            unitPrice: 150,
            total: 1800
          }
        ],
        subtotal: 3800,
        taxAmount: 608,
        discountAmount: 200,
        totalAmount: 4208,
        currency: 'USD',
        status: 'sent',
        paymentStatus: 'pending',
        notes: 'Facture annuelle licence + support',
        tags: ['software', 'annual'],
        createdAt: new Date(Date.now() - 86400000 * 5),
        updatedAt: new Date(Date.now() - 86400000 * 5)
      }
    ];

    // Apply basic filtering
    let filteredInvoices = mockInvoices;
    
    if (query.customerId) {
      filteredInvoices = filteredInvoices.filter(inv => inv.customerId === query.customerId);
    }
    
    if (query.status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === query.status);
    }
    
    if (query.paymentStatus) {
      filteredInvoices = filteredInvoices.filter(inv => inv.paymentStatus === query.paymentStatus);
    }

    const limit = query.limit || 10;
    const page = query.page || 1;
    const start = (page - 1) * limit;
    const paginatedInvoices = filteredInvoices.slice(start, start + limit);

    return {
      invoices: paginatedInvoices,
      total: filteredInvoices.length,
      page,
      limit
    };
  }

  /**
   * Récupérer une facture par ID
   */
  async findOne(id: string): Promise<InvoiceResponseDto> {
    if (!id || id === 'non-existent') {
      throw new NotFoundException(`Facture avec l'ID ${id} non trouvée`);
    }

    // Mock implementation
    const mockInvoice: InvoiceResponseDto = {
      id,
      invoiceNumber: 'INV-2024-001',
      customerId: 'customer_1',
      issueDate: new Date(Date.now() - 86400000 * 7),
      dueDate: new Date(Date.now() + 86400000 * 23),
      items: [
        {
          id: 'item_1',
          description: 'Service exemple',
          quantity: 5,
          unitPrice: 300,
          total: 1500
        }
      ],
      subtotal: 1500,
      taxAmount: 240,
      discountAmount: 0,
      totalAmount: 1740,
      currency: 'USD',
      status: 'draft',
      paymentStatus: 'pending',
      notes: 'Facture d\'exemple',
      tags: ['example'],
      createdAt: new Date(Date.now() - 86400000 * 7),
      updatedAt: new Date(Date.now() - 86400000 * 7)
    };

    return mockInvoice;
  }

  /**
   * Mettre à jour une facture
   */
  async update(id: string, updateDto: UpdateInvoiceDto): Promise<InvoiceResponseDto> {
    const existingInvoice = await this.findOne(id);

    // Recalculate amounts if items changed
    let updatedInvoice: InvoiceResponseDto = {
      ...existingInvoice,
      ...updateDto,
      updatedAt: new Date()
    };

    if (updateDto.items) {
      updatedInvoice.subtotal = updateDto.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      updatedInvoice.taxAmount = updatedInvoice.subtotal * 0.16; // 16% VAT
      updatedInvoice.totalAmount = updatedInvoice.subtotal + updatedInvoice.taxAmount - updatedInvoice.discountAmount;
    }

    return updatedInvoice;
  }

  /**
   * Supprimer une facture
   */
  async remove(id: string): Promise<void> {
    const existingInvoice = await this.findOne(id);
    
    if (existingInvoice.paymentStatus === 'paid') {
      throw new BadRequestException('Impossible de supprimer une facture payée');
    }

    console.log(`Facture ${existingInvoice.invoiceNumber} supprimée avec succès`);
  }

  /**
   * Changer le statut d'une facture
   */
  async changeStatus(id: string, status: string): Promise<InvoiceResponseDto> {
    const existingInvoice = await this.findOne(id);
    
    const validStatuses = ['draft', 'sent', 'viewed', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Statut invalide: ${status}`);
    }

    const updatedInvoice: InvoiceResponseDto = {
      ...existingInvoice,
      status,
      updatedAt: new Date()
    };

    return updatedInvoice;
  }

  /**
   * Marquer une facture comme payée
   */
  async markAsPaid(id: string, paymentDate?: Date): Promise<InvoiceResponseDto> {
    const existingInvoice = await this.findOne(id);
    
    const updatedInvoice: InvoiceResponseDto = {
      ...existingInvoice,
      paymentStatus: 'paid',
      updatedAt: new Date()
    };

    return updatedInvoice;
  }

  /**
   * Dupliquer une facture
   */
  async duplicate(id: string): Promise<InvoiceResponseDto> {
    const existingInvoice = await this.findOne(id);
    
    const duplicatedInvoice: InvoiceResponseDto = {
      ...existingInvoice,
      id: `invoice_${Date.now()}`,
      invoiceNumber: this.generateInvoiceNumber(),
      status: 'draft',
      paymentStatus: 'pending',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 30), // 30 days from now
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return duplicatedInvoice;
  }

  /**
   * Récupérer les statistiques des factures
   */
  async getStats(customerId?: string): Promise<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    byStatus: Record<string, number>;
    byPaymentStatus: Record<string, number>;
    averageAmount: number;
  }> {
    const query = customerId ? { customerId, limit: 1000 } : { limit: 1000 };
    const { invoices } = await this.findAll(query);
    
    const stats = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      paidAmount: invoices.filter(inv => inv.paymentStatus === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0),
      pendingAmount: invoices.filter(inv => inv.paymentStatus === 'pending').reduce((sum, inv) => sum + inv.totalAmount, 0),
      overdueAmount: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.totalAmount, 0),
      byStatus: invoices.reduce((acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPaymentStatus: invoices.reduce((acc, inv) => {
        acc[inv.paymentStatus] = (acc[inv.paymentStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageAmount: invoices.length > 0 ? 
        invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / invoices.length : 0
    };

    return stats;
  }

  /**
   * Générer un numéro de facture unique
   */
  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `INV-${year}${month}${day}-${random}`;
  }

  /**
   * Recherche textuelle dans les factures
   */
  async search(searchTerm: string): Promise<InvoiceResponseDto[]> {
    const { invoices } = await this.findAll({ limit: 1000 });
    
    const searchTermLower = searchTerm.toLowerCase();
    const filteredInvoices = invoices.filter(inv => 
      inv.invoiceNumber.toLowerCase().includes(searchTermLower) ||
      inv.notes.toLowerCase().includes(searchTermLower) ||
      inv.tags.some(tag => tag.toLowerCase().includes(searchTermLower)) ||
      inv.items.some(item => item.description.toLowerCase().includes(searchTermLower))
    );

    return filteredInvoices;
  }

  /**
   * Génération automatique de factures
   */
  async autoGenerateInvoices(criteria: any): Promise<any> {
    this.logger.log('Génération automatique de factures');
    
    // Mock implementation
    const generatedInvoices = [
      {
        id: `auto_invoice_${Date.now()}`,
        invoiceNumber: this.generateInvoiceNumber(),
        customerId: 'auto_customer_1',
        totalAmount: 1500,
        status: 'draft'
      }
    ];

    return {
      success: true,
      generated: generatedInvoices.length,
      invoices: generatedInvoices
    };
  }

  /**
   * Traitement d'une vente
   */
  async processSale(id: string, saleData: any): Promise<any> {
    this.logger.log('Traitement d\'une vente');
    
    // Mock implementation - create invoice from sale
    const invoice = await this.create({
      customerId: saleData.customerId,
      dueDate: new Date(Date.now() + 86400000 * 30),
      items: saleData.items || [],
      currency: saleData.currency || 'USD'
    });

    return {
      success: true,
      saleId: `sale_${Date.now()}`,
      invoiceId: invoice.id,
      totalAmount: invoice.totalAmount
    };
  }

  /**
   * Analyse de facture avec IA
   */
  async analyzeInvoiceWithAI(invoiceId: string): Promise<any> {
    this.logger.log(`Analyse IA de la facture ${invoiceId}`);
    
    const invoice = await this.findOne(invoiceId);
    
    // Mock AI analysis
    const analysis = {
      invoiceId,
      insights: [
        'Montant conforme aux standards du secteur',
        'Délai de paiement optimal',
        'Risque de retard de paiement: faible'
      ],
      riskScore: 0.2,
      recommendations: [
        'Maintenir les conditions actuelles',
        'Proposer une remise pour paiement anticipé'
      ],
      confidenceScore: 0.95
    };

    return analysis;
  }

  /**
   * Export des factures
   */
  async exportInvoices(format: string = 'xlsx'): Promise<any> {
    this.logger.log(`Export des factures au format ${format}`);
    
    const { invoices } = await this.findAll({ limit: 1000 });
    
    // Mock export
    return {
      success: true,
      format,
      fileName: `factures_export_${Date.now()}.${format}`,
      totalRecords: invoices.length,
      downloadUrl: `/exports/factures_export_${Date.now()}.${format}`
    };
  }

  /**
   * Génération de rapport de performance des ventes
   */
  async generateSalesPerformanceReport(period: any): Promise<any> {
    this.logger.log('Génération du rapport de performance des ventes');
    
    const { invoices } = await this.findAll({ limit: 1000 });
    
    // Mock analysis
    const report = {
      period: period || 'monthly',
      totalSales: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      invoiceCount: invoices.length,
      averageInvoiceValue: invoices.length > 0 ? 
        invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / invoices.length : 0,
      topCustomers: [
        { customerId: 'customer_1', totalAmount: 15000, invoiceCount: 5 },
        { customerId: 'customer_2', totalAmount: 12000, invoiceCount: 3 }
      ],
      trends: {
        growth: '+15%',
        averagePaymentDelay: 12
      }
    };

    return report;
  }

  /**
   * Génération de rapport de revenus
   */
  async generateRevenueReport(period: any): Promise<any> {
    this.logger.log('Génération du rapport de revenus');
    
    const { invoices } = await this.findAll({ limit: 1000 });
    
    const report = {
      period: period || 'monthly',
      totalRevenue: invoices.filter(inv => inv.paymentStatus === 'paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0),
      pendingRevenue: invoices.filter(inv => inv.paymentStatus === 'pending')
        .reduce((sum, inv) => sum + inv.totalAmount, 0),
      overdueRevenue: invoices.filter(inv => inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.totalAmount, 0),
      revenueByMonth: [
        { month: 'Jan', revenue: 25000 },
        { month: 'Feb', revenue: 28000 },
        { month: 'Mar', revenue: 32000 }
      ],
      projectedRevenue: 95000
    };

    return report;
  }
}