import { Injectable } from '@nestjs/common';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardData, SalesToday, OperationJournalEntry, DashboardDataDetailed } from './interfaces/dashboard.interface';
import { DateQueryDto } from './dto/date-query.dto';
import { OperationsJournalQueryDto } from './dto/operations-journal-query.dto';
import { ExportJournalQueryDto } from './dto/export-journal-query.dto';
import { SalesSummaryQueryDto } from './dto/sales-summary-query.dto';
import { CustomerStatsQueryDto } from './dto/customer-stats-query.dto';
import { JournalQueryDto } from './dto/journal-query.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Product } from '../inventory/entities/product.entity';
import { StockTransaction } from '../inventory/entities/stock-transaction.entity';
import { DashboardPeriod } from './enums/dashboard-period.enum';
import { Currency } from './enums/currency.enum';
import { OperationType } from './enums/operation-type.enum';
import { addDays, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { SalesByDay, SalesByDayDetailed, SalesSummary, CustomerStats, TopSellingProduct, LowStockProduct, TopCustomer } from './interfaces/dashboard-types.interface';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(StockTransaction)
    private readonly stockTransactionRepository: Repository<StockTransaction>,
  ) {}

  /**
   * Récupère toutes les données du dashboard selon la documentation
   */
  async getDashboardData(query: DashboardQueryDto): Promise<DashboardData> {
    const date = query.date || new Date();
    const timezone = query.timezone || 'Africa/Kinshasa';
    const zonedDate = toZonedTime(date, timezone);

    // Date ranges
    const today = {
      start: startOfDay(zonedDate),
      end: endOfDay(zonedDate),
    };

    // Calculer les ventes du jour
    const salesToday = await this.calculateSalesToday(today.start, today.end);
    
    // Calculer le nombre de clients servis aujourd'hui
    const clientsServedToday = await this.calculateClientsServedToday(today.start, today.end);
    
    // Calculer les créances
    const receivables = await this.calculateReceivables();
    
    // Calculer les dépenses du jour
    const expenses = await this.calculateExpensesToday(today.start, today.end);

    return {
      salesTodayCdf: salesToday.cdf,
      salesTodayUsd: salesToday.usd,
      clientsServedToday,
      receivables,
      expenses
    };
  }

  /**
   * Récupère toutes les données détaillées du dashboard (version étendue)
   */
  async getDashboardDataDetailed(query: DashboardQueryDto): Promise<DashboardDataDetailed> {
    const date = query.date || new Date();
    const timezone = query.timezone || 'Africa/Kinshasa';
    const zonedDate = toZonedTime(date, timezone);

    // Date ranges
    const today = {
      start: startOfDay(zonedDate),
      end: endOfDay(zonedDate),
    };
    
    const thisWeek = {
      start: startOfWeek(zonedDate, { weekStartsOn: 1 }), // Monday as first day
      end: endOfWeek(zonedDate, { weekStartsOn: 1 }),
    };
    
    const thisMonth = {
      start: startOfMonth(zonedDate),
      end: endOfMonth(zonedDate),
    };

    // Récupérer les données résumées
    const summary = await this.calculateSummary(today, thisWeek, thisMonth);

    // Récupérer les ventes récentes
    const recentSales = await this.getRecentSales();

    // Récupérer les clients récents
    const recentCustomers = await this.getRecentCustomers();

    // Récupérer les ventes par jour
    const salesByDayCdf = await this.getSalesByDay(thisWeek.start, thisWeek.end, Currency.CDF);
    const salesByDayUsd = await this.getSalesByDay(thisWeek.start, thisWeek.end, Currency.USD);

    // Récupérer les produits les plus vendus
    const topSellingProducts = await this.getTopSellingProducts(thisMonth.start, thisMonth.end);

    // Récupérer les produits à faible stock
    const lowStockProducts = await this.getLowStockProducts();

    // Récupérer les entrées du journal
    const journalEntries = await this.getJournalEntries(
      { 
        startDate: subDays(zonedDate, 7),
        endDate: zonedDate,
        page: 1,
        limit: 10
      }
    );

    return {
      date: zonedDate,
      summary,
      recentSales,
      recentCustomers,
      salesByDayCdf,
      salesByDayUsd,
      topSellingProducts,
      lowStockProducts,
      journalEntries: journalEntries.items,
    };
  }

  /**
   * Récupère le résumé des ventes pour une période spécifique
   */
  async getSalesSummary(query: SalesSummaryQueryDto): Promise<SalesSummary> {
    const date = query.date || new Date();
    const { period, currency } = query;
    
    const { start, end } = this.getDateRange(date, period);
    
    // Calculer les statistiques de vente pour la période
    let salesCdf = 0;
    let salesUsd = 0;
    let transactionCount = 0;
    
    // Récupérer les ventes de la période
    const sales = await this.saleRepository.find({
      where: {
        date: Between(start, end)
      }
    });
    
    if (sales.length > 0) {
      transactionCount = sales.length;
      
      // Calculer les montants en CDF et USD
      salesCdf = sales.reduce((sum, sale) => {
        return sum + (sale.totalAmountInCdf || 0);
      }, 0);
      
      // Calculer l'équivalent en USD en utilisant le taux de change
      salesUsd = sales.reduce((sum, sale) => {
        return sum + (sale.totalAmountInCdf / sale.exchangeRate || 0);
      }, 0);
    }
    
    // Calculer les montants moyens par transaction
    const averageTransactionCdf = transactionCount > 0 ? salesCdf / transactionCount : 0;
    const averageTransactionUsd = transactionCount > 0 ? salesUsd / transactionCount : 0;
    
    // Récupérer les ventes par jour
    const salesByDay = await this.getSalesByDayDetailed(start, end);
    
    return {
      period,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      salesCdf,
      salesUsd,
      transactionCount,
      averageTransactionCdf,
      averageTransactionUsd,
      salesByDay
    };
  }

  /**
   * Récupère les statistiques des clients pour une période spécifique
   */
  async getCustomerStats(query: CustomerStatsQueryDto): Promise<CustomerStats> {
    const date = query.date || new Date();
    const { period } = query;
    
    const { start, end } = this.getDateRange(date, period);
    
    // Calculer les statistiques client pour la période
    const totalCustomers = await this.customerRepository.count();
    
    // Nouveaux clients dans la période
    const newCustomers = await this.customerRepository.count({
      where: {
        createdAt: Between(start, end)
      }
    });
    
    // Clients actifs (qui ont effectué un achat dans la période)
    const salesInPeriod = await this.saleRepository.find({
      where: {
        date: Between(start, end)
      },
      relations: ['customer']
    });
    
    // Récupérer les IDs uniques des clients qui ont effectué des achats
    const activeCustomerIds = [...new Set(salesInPeriod.map(sale => sale.customerId))];
    const activeCustomers = activeCustomerIds.length;
    
    // Clients inactifs
    const inactiveCustomers = totalCustomers - activeCustomers;
    
    // Calculer l'achat moyen
    let totalPurchaseAmountCdf = 0;
    let totalPurchaseAmountUsd = 0;
    
    salesInPeriod.forEach(sale => {
      totalPurchaseAmountCdf += sale.totalAmountInCdf || 0;
      totalPurchaseAmountUsd += (sale.totalAmountInCdf / sale.exchangeRate) || 0;
    });
    
    const averagePurchaseCdf = salesInPeriod.length > 0 ? totalPurchaseAmountCdf / salesInPeriod.length : 0;
    const averagePurchaseUsd = salesInPeriod.length > 0 ? totalPurchaseAmountUsd / salesInPeriod.length : 0;
    
    // Récupérer les meilleurs clients
    const topCustomers = await this.getTopCustomers(start, end);
    
    return {
      totalCustomers,
      newCustomers,
      activeCustomers,
      inactiveCustomers,
      averagePurchaseCdf,
      averagePurchaseUsd,
      topCustomers
    };
  }

  /**
   * Récupère les entrées du journal d'opérations
   */
  async getJournalEntries(query: JournalQueryDto) {
    const { startDate, endDate, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    
    // Ici, nous simulons la récupération des entrées de journal
    // Dans une implémentation réelle, vous interrogeriez une table d'audit ou de journal
    
    // Exemple simplifié (à adapter en fonction de votre modèle de données)
    const entries = [];
    const totalItems = 0; // À remplacer par le nombre réel d'entrées
    
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      items: entries,
      totalItems,
      totalPages,
      currentPage: page
    };
  }

  // Méthodes auxiliaires
  
  private async calculateSummary(today, thisWeek, thisMonth) {
    // Ventes aujourd'hui
    const salesToday = await this.saleRepository.find({
      where: {
        date: Between(today.start, today.end)
      }
    });
    
    const salesTodayCdf = salesToday.reduce((sum, sale) => sum + (sale.totalAmountInCdf || 0), 0);
    const salesTodayUsd = salesToday.reduce((sum, sale) => sum + ((sale.totalAmountInCdf / sale.exchangeRate) || 0), 0);
    
    // Ventes cette semaine
    const salesThisWeek = await this.saleRepository.find({
      where: {
        date: Between(thisWeek.start, thisWeek.end)
      }
    });
    
    const salesThisWeekCdf = salesThisWeek.reduce((sum, sale) => sum + (sale.totalAmountInCdf || 0), 0);
    const salesThisWeekUsd = salesThisWeek.reduce((sum, sale) => sum + ((sale.totalAmountInCdf / sale.exchangeRate) || 0), 0);
    
    // Ventes ce mois
    const salesThisMonth = await this.saleRepository.find({
      where: {
        date: Between(thisMonth.start, thisMonth.end)
      }
    });
    
    const salesThisMonthCdf = salesThisMonth.reduce((sum, sale) => sum + (sale.totalAmountInCdf || 0), 0);
    const salesThisMonthUsd = salesThisMonth.reduce((sum, sale) => sum + ((sale.totalAmountInCdf / sale.exchangeRate) || 0), 0);
    
    // Clients
    const totalCustomers = await this.customerRepository.count();
    const newCustomersToday = await this.customerRepository.count({
      where: {
        createdAt: Between(today.start, today.end)
      }
    });
    
    // Transactions
    const totalTransactions = await this.saleRepository.count();
    const transactionsToday = salesToday.length;
    
    // Dépenses
    const expensesToday = await this.expenseRepository.find({
      where: {
        date: Between(today.start, today.end)
      }
    });
    
    // Convertir les montants selon le code de devise
    const expensesTodayCdf = expensesToday.reduce((sum, expense) => {
      if (expense.currencyCode === 'CDF' || !expense.currencyCode) {
        return sum + (expense.amount || 0);
      } else {
        // Si en USD, convertir approximativement en CDF (utiliser un taux moyen)
        const avgRate = 2500; // Taux moyen approximatif USD->CDF
        return sum + ((expense.amount || 0) * avgRate);
      }
    }, 0);
    
    const expensesTodayUsd = expensesToday.reduce((sum, expense) => {
      if (expense.currencyCode === 'USD') {
        return sum + (expense.amount || 0);
      } else {
        // Si en CDF, convertir approximativement en USD
        const avgRate = 2500; // Taux moyen approximatif USD->CDF
        return sum + ((expense.amount || 0) / avgRate);
      }
    }, 0);
    
    const expensesThisWeek = await this.expenseRepository.find({
      where: {
        date: Between(thisWeek.start, thisWeek.end)
      }
    });
    
    // Convertir les montants selon le code de devise
    const expensesThisWeekCdf = expensesThisWeek.reduce((sum, expense) => {
      if (expense.currencyCode === 'CDF' || !expense.currencyCode) {
        return sum + (expense.amount || 0);
      } else {
        // Si en USD, convertir approximativement en CDF
        const avgRate = 2500; // Taux moyen approximatif USD->CDF
        return sum + ((expense.amount || 0) * avgRate);
      }
    }, 0);
    
    const expensesThisWeekUsd = expensesThisWeek.reduce((sum, expense) => {
      if (expense.currencyCode === 'USD') {
        return sum + (expense.amount || 0);
      } else {
        // Si en CDF, convertir approximativement en USD
        const avgRate = 2500; // Taux moyen approximatif USD->CDF
        return sum + ((expense.amount || 0) / avgRate);
      }
    }, 0);
    
    const expensesThisMonth = await this.expenseRepository.find({
      where: {
        date: Between(thisMonth.start, thisMonth.end)
      }
    });
    
    // Convertir les montants selon le code de devise
    const expensesThisMonthCdf = expensesThisMonth.reduce((sum, expense) => {
      if (expense.currencyCode === 'CDF' || !expense.currencyCode) {
        return sum + (expense.amount || 0);
      } else {
        // Si en USD, convertir approximativement en CDF
        const avgRate = 2500; // Taux moyen approximatif USD->CDF
        return sum + ((expense.amount || 0) * avgRate);
      }
    }, 0);
    
    const expensesThisMonthUsd = expensesThisMonth.reduce((sum, expense) => {
      if (expense.currencyCode === 'USD') {
        return sum + (expense.amount || 0);
      } else {
        // Si en CDF, convertir approximativement en USD
        const avgRate = 2500; // Taux moyen approximatif USD->CDF
        return sum + ((expense.amount || 0) / avgRate);
      }
    }, 0);
    
    // Bénéfices
    const profitTodayCdf = salesTodayCdf - expensesTodayCdf;
    const profitTodayUsd = salesTodayUsd - expensesTodayUsd;
    const profitThisWeekCdf = salesThisWeekCdf - expensesThisWeekCdf;
    const profitThisWeekUsd = salesThisWeekUsd - expensesThisWeekUsd;
    const profitThisMonthCdf = salesThisMonthCdf - expensesThisMonthCdf;
    const profitThisMonthUsd = salesThisMonthUsd - expensesThisMonthUsd;
    
    return {
      salesTodayCdf,
      salesTodayUsd,
      salesThisWeekCdf,
      salesThisWeekUsd,
      salesThisMonthCdf,
      salesThisMonthUsd,
      totalCustomers,
      newCustomersToday,
      totalTransactions,
      transactionsToday,
      expensesTodayCdf,
      expensesTodayUsd,
      expensesThisWeekCdf,
      expensesThisWeekUsd,
      expensesThisMonthCdf,
      expensesThisMonthUsd,
      profitTodayCdf,
      profitTodayUsd,
      profitThisWeekCdf,
      profitThisWeekUsd,
      profitThisMonthCdf,
      profitThisMonthUsd
    };
  }
  
  private async getRecentSales() {
    // Récupérer les 5 dernières ventes
    const recentSales = await this.saleRepository.find({
      relations: ['customer'],
      order: {
        date: 'DESC'
      },
      take: 5
    });
    
    return recentSales.map(sale => ({
      id: sale.id,
      date: sale.date,
      customerName: sale.customer ? sale.customer.fullName : 'Client inconnu',
      totalAmount: sale.totalAmountInCdf,
      currency: Currency.CDF,
      status: sale.status
    }));
  }
  
  private async getRecentCustomers() {
    // Récupérer les 5 derniers clients
    const recentCustomers = await this.customerRepository.find({
      order: {
        createdAt: 'DESC'
      },
      take: 5
    });
    
    return recentCustomers.map(customer => ({
      id: customer.id,
      name: customer.fullName,
      phone: customer.phoneNumber,
      registrationDate: customer.createdAt,
      totalPurchases: 0, // À calculer à partir des ventes
      totalAmountCdf: 0 // À calculer à partir des ventes
    }));
  }
  
  private async getSalesByDay(startDate: Date, endDate: Date, currency: Currency): Promise<SalesByDay[]> {
    // Pour une implémentation réelle, vous devriez agréger les ventes par jour
    // Ici, nous créons des données d'exemple
    
    const days: SalesByDay[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        amount: Math.random() * 1000000 // Montant aléatoire pour l'exemple
      });
      
      currentDate = addDays(currentDate, 1);
    }
    
    return days;
  }

  private async getSalesByDayDetailed(startDate: Date, endDate: Date): Promise<SalesByDayDetailed[]> {
    // Pour une implémentation réelle, vous devriez agréger les ventes par jour avec plus de détails
    // Ici, nous créons des données d'exemple
    
    const days: SalesByDayDetailed[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        amountCdf: Math.random() * 1000000, // Montant aléatoire pour l'exemple
        amountUsd: Math.random() * 5000, // Montant aléatoire pour l'exemple
        count: Math.floor(Math.random() * 10) + 1 // Nombre aléatoire pour l'exemple
      });
      
      currentDate = addDays(currentDate, 1);
    }
    
    return days;
  }
  
  private async getTopSellingProducts(startDate: Date, endDate: Date): Promise<TopSellingProduct[]> {
    // Pour une implémentation réelle, vous devriez calculer les produits les plus vendus
    // Ici, nous renvoyons des données d'exemple
    
    return [
      {
        productId: '1',
        name: 'Produit A',
        quantitySold: 45,
        totalRevenueCdf: 1350000.00
      },
      {
        productId: '2',
        name: 'Produit B',
        quantitySold: 32,
        totalRevenueCdf: 960000.00
      },
      {
        productId: '3',
        name: 'Produit C',
        quantitySold: 28,
        totalRevenueCdf: 840000.00
      }
    ];
  }
  
  private async getLowStockProducts(): Promise<LowStockProduct[]> {
    // Rechercher les produits dont le stock est inférieur au niveau d'alerte
    // Obtenir d'abord des produits avec alertThreshold défini
    const productsWithAlert = await this.productRepository.createQueryBuilder('product')
      .where('product.stockQuantity < product.alertThreshold')
      .orderBy('product.stockQuantity', 'ASC')
      .take(10)
      .getMany();
    
    return productsWithAlert.map(product => ({
      productId: product.id,
      name: product.name,
      currentStock: product.stockQuantity,
      reorderPoint: product.alertThreshold
    }));
  }
  
  private async getTopCustomers(startDate: Date, endDate: Date): Promise<TopCustomer[]> {
    // Pour une implémentation réelle, vous devriez calculer les meilleurs clients
    // Ici, nous renvoyons des données d'exemple
    
    return [
      {
        id: '1',
        name: 'Client A',
        totalPurchasesCdf: 450000.00,
        totalPurchasesUsd: 225.00,
        purchaseCount: 3
      },
      {
        id: '2',
        name: 'Client B',
        totalPurchasesCdf: 320000.00,
        totalPurchasesUsd: 160.00,
        purchaseCount: 2
      },
      {
        id: '3',
        name: 'Client C',
        totalPurchasesCdf: 280000.00,
        totalPurchasesUsd: 140.00,
        purchaseCount: 4
      }
    ];
  }
  
  private getDateRange(date: Date, period: DashboardPeriod) {
    let start: Date;
    let end: Date;
    
    switch (period) {
      case DashboardPeriod.DAY:
        start = startOfDay(date);
        end = endOfDay(date);
        break;
      case DashboardPeriod.WEEK:
        start = startOfWeek(date, { weekStartsOn: 1 }); // Monday as first day
        end = endOfWeek(date, { weekStartsOn: 1 });
        break;
      case DashboardPeriod.MONTH:
        start = startOfMonth(date);
        end = endOfMonth(date);
        break;
      case DashboardPeriod.YEAR:
        start = startOfYear(date);
        end = endOfYear(date);
        break;
      default:
        start = startOfDay(date);
        end = endOfDay(date);
    }
    
    return { start, end };
  }

  // ========== NOUVELLES MÉTHODES SELON LA DOCUMENTATION ==========

  /**
   * Calcule les ventes du jour en CDF et USD
   */
  private async calculateSalesToday(startDate: Date, endDate: Date): Promise<SalesToday> {
    const sales = await this.saleRepository.find({
      where: {
        date: Between(startDate, endDate)
      }
    });

    let cdf = 0;
    let usd = 0;

    for (const sale of sales) {
      cdf += sale.totalAmountInCdf || 0;
      usd += (sale.totalAmountInCdf / (sale.exchangeRate || 1)) || 0;
    }

    return { cdf, usd };
  }

  /**
   * Calcule le nombre de clients uniques servis aujourd'hui
   */
  private async calculateClientsServedToday(startDate: Date, endDate: Date): Promise<number> {
    const uniqueClients = await this.saleRepository
      .createQueryBuilder('sale')
      .select('DISTINCT sale.customerId')
      .where('sale.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('sale.customerId IS NOT NULL')
      .getCount();

    return uniqueClients;
  }

  /**
   * Calcule le montant total des créances (à recevoir)
   */
  private async calculateReceivables(): Promise<number> {
    // Calculer les ventes à crédit non payées
    const creditSales = await this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.status = :status', { status: 'PENDING' })
      .orWhere('sale.status = :status', { status: 'PARTIALLY_PAID' })
      .getMany();

    let totalReceivables = 0;
    for (const sale of creditSales) {
      totalReceivables += (sale.totalAmountInCdf - (sale.paidAmountInCdf || 0));
    }

    return totalReceivables;
  }

  /**
   * Calcule les dépenses du jour
   */
  private async calculateExpensesToday(startDate: Date, endDate: Date): Promise<number> {
    const expenses = await this.expenseRepository.find({
      where: {
        date: Between(startDate, endDate)
      }
    });

    return expenses.reduce((total, expense) => total + (expense.amount || 0), 0);
  }

  /**
   * Récupère uniquement les ventes du jour
   */
  async getSalesToday(query: DateQueryDto): Promise<SalesToday> {
    const date = query.date || new Date();
    const start = startOfDay(date);
    const end = endOfDay(date);

    return this.calculateSalesToday(start, end);
  }

  /**
   * Récupère le nombre de clients servis aujourd'hui
   */
  async getClientsServedToday(query: DateQueryDto): Promise<number> {
    const date = query.date || new Date();
    const start = startOfDay(date);
    const end = endOfDay(date);

    return this.calculateClientsServedToday(start, end);
  }

  /**
   * Récupère le total des montants à recevoir
   */
  async getReceivables(): Promise<number> {
    return this.calculateReceivables();
  }

  /**
   * Récupère les dépenses du jour
   */
  async getExpensesToday(query: DateQueryDto): Promise<number> {
    const date = query.date || new Date();
    const start = startOfDay(date);
    const end = endOfDay(date);

    return this.calculateExpensesToday(start, end);
  }

  /**
   * Récupère les entrées du journal des opérations selon la documentation
   */
  async getOperationsJournal(query: OperationsJournalQueryDto): Promise<OperationJournalEntry[]> {
    const { startDate, endDate, type, page = 1, limit = 10 } = query;
    
    // Date par défaut si non spécifiées
    const start = startDate || subDays(new Date(), 30);
    const end = endDate || new Date();

    // Pour l'instant, nous retournons des données d'exemple
    // Dans une implémentation réelle, vous devriez avoir une table journal_operations
    const mockEntries: OperationJournalEntry[] = [
      {
        id: '1',
        date: new Date().toISOString(),
        description: 'Vente en espèces - Produit A',
        type: OperationType.SALE_CASH,
        amount: 150000.00,
        currencyCode: 'CDF',
        isDebit: false,
        isCredit: true,
        balanceAfter: 2150000.00,
        relatedDocumentId: 'SALE-001',
        quantity: 5.0,
        productId: 'PROD-001',
        productName: 'Produit A',
        paymentMethod: 'Cash',
        balancesByCurrency: {
          'CDF': 2000000.00,
          'USD': 1000.00
        }
      },
      {
        id: '2',
        date: subDays(new Date(), 1).toISOString(),
        description: 'Entrée de stock - Produit B',
        type: OperationType.STOCK_IN,
        amount: 300000.00,
        currencyCode: 'CDF',
        isDebit: true,
        isCredit: false,
        balanceAfter: 2000000.00,
        relatedDocumentId: 'PO-001',
        quantity: 10.0,
        productId: 'PROD-002',
        productName: 'Produit B'
      }
    ];

    // Filtrer par type si spécifié
    let filteredEntries = mockEntries;
    if (type && type !== OperationType.OTHER) {
      filteredEntries = mockEntries.filter(entry => entry.type === type);
    }

    // Appliquer la pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return filteredEntries.slice(startIndex, endIndex);
  }

  /**
   * Exporte le journal des opérations en PDF ou CSV
   */
  async exportOperationsJournal(query: ExportJournalQueryDto): Promise<Buffer> {
    const entries = await this.getOperationsJournal({
      startDate: query.startDate,
      endDate: query.endDate,
      type: query.type,
      page: 1,
      limit: 1000 // Export plus d'entrées
    });

    if (query.format === 'csv') {
      return this.generateCSV(entries);
    } else {
      return this.generatePDF(entries);
    }
  }

  /**
   * Génère un fichier CSV à partir des entrées du journal
   */
  private generateCSV(entries: OperationJournalEntry[]): Buffer {
    const headers = [
      'ID',
      'Date',
      'Description',
      'Type',
      'Montant',
      'Devise',
      'Débit',
      'Crédit',
      'Solde Après',
      'Document Lié',
      'Quantité',
      'Produit',
      'Méthode Paiement'
    ];

    let csvContent = headers.join(',') + '\n';

    for (const entry of entries) {
      const row = [
        entry.id,
        entry.date,
        `"${entry.description}"`,
        entry.type,
        entry.amount,
        entry.currencyCode,
        entry.isDebit ? 'Oui' : 'Non',
        entry.isCredit ? 'Oui' : 'Non',
        entry.balanceAfter,
        entry.relatedDocumentId || '',
        entry.quantity || '',
        `"${entry.productName || ''}"`,
        entry.paymentMethod || ''
      ];
      csvContent += row.join(',') + '\n';
    }

    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Génère un fichier PDF à partir des entrées du journal
   */
  private generatePDF(entries: OperationJournalEntry[]): Buffer {
    // Pour une implémentation réelle, vous devriez utiliser une bibliothèque comme PDFKit ou Puppeteer
    // Ici, nous retournons un PDF simple avec du contenu texte
    
    const content = `
JOURNAL DES OPÉRATIONS
=====================

Généré le: ${new Date().toLocaleDateString('fr-FR')}

${entries.map(entry => `
ID: ${entry.id}
Date: ${new Date(entry.date).toLocaleDateString('fr-FR')}
Description: ${entry.description}
Type: ${entry.type}
Montant: ${entry.amount} ${entry.currencyCode}
Solde après: ${entry.balanceAfter} ${entry.currencyCode}
${entry.productName ? `Produit: ${entry.productName}` : ''}
${entry.paymentMethod ? `Méthode: ${entry.paymentMethod}` : ''}
---
`).join('')}
    `;

    // Pour un vrai PDF, utilisez une bibliothèque appropriée
    return Buffer.from(content, 'utf-8');
  }
}
