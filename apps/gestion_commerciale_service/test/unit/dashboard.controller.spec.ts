import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../../src/modules/dashboard/dashboard.controller';
import { DashboardService } from '../../src/modules/dashboard/dashboard.service';
import { JwtAuthGuard } from '../../src/modules/auth/guards/jwt-auth.guard';
import { DashboardData, SalesToday, OperationJournalEntry, ApiResponse } from '../../src/modules/dashboard/interfaces/dashboard.interface';
import { SalesSummary, CustomerStats } from '../../src/modules/dashboard/interfaces/dashboard-types.interface';
import { OperationType } from '../../src/modules/dashboard/enums/operation-type.enum';
import { DashboardPeriod } from '../../src/modules/dashboard/enums/dashboard-period.enum';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockDashboardService = {
    getDashboardData: jest.fn(),
    getSalesSummary: jest.fn(),
    getCustomerStats: jest.fn(),
    getJournalEntries: jest.fn(),
    getSalesToday: jest.fn(),
    getClientsServedToday: jest.fn(),
    getReceivables: jest.fn(),
    getExpensesToday: jest.fn(),
    getOperationsJournal: jest.fn(),
    exportOperationsJournal: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardData', () => {
    it('should return dashboard data with success status', async () => {
      const mockData: DashboardData = {
        salesTodayCdf: 150000,
        salesTodayUsd: 75,
        clientsServedToday: 5,
        receivables: 100000,
        expenses: 50000,
      };

      mockDashboardService.getDashboardData.mockResolvedValue(mockData);

      const result = await controller.getDashboardData({});

      expect(result).toEqual({
        success: true,
        data: mockData,
        message: 'Données du tableau de bord récupérées avec succès',
        statusCode: 200
      });
      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith({});
    });
  });

  describe('getSalesSummary', () => {
    it('should return sales summary with success status', async () => {
      const mockSummary: SalesSummary = {
        period: 'day',
        startDate: '2023-08-01',
        endDate: '2023-08-01',
        salesCdf: 200000,
        salesUsd: 100,
        transactionCount: 3,
        averageTransactionCdf: 66666.67,
        averageTransactionUsd: 33.33,
        salesByDay: [],
      };

      mockDashboardService.getSalesSummary.mockResolvedValue(mockSummary);

      const result = await controller.getSalesSummary({ period: DashboardPeriod.DAY });

      expect(result).toEqual({
        success: true,
        data: mockSummary,
        message: 'Résumé des ventes récupéré avec succès',
        statusCode: 200
      });
    });
  });

  describe('getCustomerStats', () => {
    it('should return customer stats with success status', async () => {
      const mockStats: CustomerStats = {
        totalCustomers: 50,
        newCustomers: 5,
        activeCustomers: 30,
        inactiveCustomers: 20,
        averagePurchaseCdf: 150000,
        averagePurchaseUsd: 75,
        topCustomers: [],
      };

      mockDashboardService.getCustomerStats.mockResolvedValue(mockStats);

      const result = await controller.getCustomerStats({ period: DashboardPeriod.MONTH });

      expect(result).toEqual({
        success: true,
        data: mockStats,
        message: 'Statistiques clients récupérées avec succès',
        statusCode: 200
      });
    });
  });

  describe('getJournalEntries', () => {
    it('should return journal entries with success status', async () => {
      const mockEntries = {
        items: [
          {
            id: '1',
            date: '2023-08-01T10:00:00Z',
            type: 'sale',
            description: 'Vente produit A',
            amountCdf: 150000,
            amountUsd: 75,
            user: 'John Doe',
          },
        ],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
      };

      mockDashboardService.getJournalEntries.mockResolvedValue(mockEntries);

      const result = await controller.getJournalEntries({
        startDate: new Date('2023-08-01'),
        endDate: new Date('2023-08-01'),
      });

      expect(result).toEqual({
        success: true,
        data: mockEntries,
        message: 'Entrées du journal récupérées avec succès',
        statusCode: 200
      });
    });
  });

  describe('getSalesToday', () => {
    it('should return sales for today', async () => {
      const mockSales: SalesToday = {
        cdf: 200000,
        usd: 100,
      };

      mockDashboardService.getSalesToday.mockResolvedValue(mockSales);

      const result = await controller.getSalesToday({});

      expect(result).toEqual({
        success: true,
        message: 'Ventes du jour récupérées avec succès',
        statusCode: 200,
        data: mockSales,
      });
    });
  });

  describe('getClientsServedToday', () => {
    it('should return number of clients served today', async () => {
      const mockCount = 12;

      mockDashboardService.getClientsServedToday.mockResolvedValue(mockCount);

      const result = await controller.getClientsServedToday({});

      expect(result).toEqual({
        success: true,
        message: 'Nombre de clients servis aujourd\'hui récupéré avec succès',
        statusCode: 200,
        data: mockCount,
      });
    });
  });

  describe('getReceivables', () => {
    it('should return total receivables', async () => {
      const mockReceivables = 250000;

      mockDashboardService.getReceivables.mockResolvedValue(mockReceivables);

      const result = await controller.getReceivables();

      expect(result).toEqual({
        success: true,
        message: 'Total des montants à recevoir récupéré avec succès',
        statusCode: 200,
        data: mockReceivables,
      });
    });
  });

  describe('getExpensesToday', () => {
    it('should return expenses for today', async () => {
      const mockExpenses = 75000;

      mockDashboardService.getExpensesToday.mockResolvedValue(mockExpenses);

      const result = await controller.getExpensesToday({});

      expect(result).toEqual({
        success: true,
        message: 'Dépenses du jour récupérées avec succès',
        statusCode: 200,
        data: mockExpenses,
      });
    });
  });

  describe('getOperationsJournal', () => {
    it('should return operations journal entries', async () => {
      const mockEntries: OperationJournalEntry[] = [
        {
          id: '1',
          date: '2023-08-01T10:00:00Z',
          description: 'Vente en espèces',
          type: OperationType.SALE_CASH,
          amount: 150000,
          currencyCode: 'CDF',
          isDebit: false,
          isCredit: true,
          balanceAfter: 2150000,
          relatedDocumentId: 'SALE-001',
          quantity: 5,
          productId: 'PROD-001',
          productName: 'Produit A',
          paymentMethod: 'Cash',
          balancesByCurrency: {
            CDF: 2000000,
            USD: 1000,
          },
        },
      ];

      mockDashboardService.getOperationsJournal.mockResolvedValue(mockEntries);

      const result = await controller.getOperationsJournal({
        startDate: new Date('2023-08-01'),
        endDate: new Date('2023-08-31'),
      });

      expect(result).toEqual({
        success: true,
        message: 'Entrées du journal récupérées avec succès',
        statusCode: 200,
        data: mockEntries,
      });
    });
  });

  describe('exportOperationsJournal', () => {
    it('should export operations journal as PDF', async () => {
      const mockBuffer = Buffer.from('PDF content');
      const mockResponse = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      mockDashboardService.exportOperationsJournal.mockResolvedValue(mockBuffer);

      await controller.exportOperationsJournal(
        { format: 'pdf' },
        mockResponse as any,
      );

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="journal-operations.pdf"',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should export operations journal as CSV', async () => {
      const mockBuffer = Buffer.from('CSV content');
      const mockResponse = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      mockDashboardService.exportOperationsJournal.mockResolvedValue(mockBuffer);

      await controller.exportOperationsJournal(
        { format: 'csv' },
        mockResponse as any,
      );

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="journal-operations.csv"',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should handle export errors', async () => {
      const mockError = new Error('Export failed');
      const mockResponse = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };

      mockDashboardService.exportOperationsJournal.mockRejectedValue(mockError);

      await controller.exportOperationsJournal(
        { format: 'pdf' },
        mockResponse as any,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur lors de l\'export du journal',
        statusCode: 500,
        error: 'Export failed',
      });
    });
  });
});
