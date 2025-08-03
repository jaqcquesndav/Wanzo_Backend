import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from '../../src/modules/expenses/expenses.controller';
import { ExpensesService } from '../../src/modules/expenses/expenses.service';
import { JwtAuthGuard } from '../../src/modules/auth/guards/jwt-auth.guard';
import { CreateExpenseDto } from '../../src/modules/expenses/dto/create-expense.dto';
import { UpdateExpenseDto } from '../../src/modules/expenses/dto/update-expense.dto';
import { ExpenseCategoryType } from '../../src/modules/expenses/entities/expense.entity';

describe('ExpensesController', () => {
  let controller: ExpensesController;
  let service: ExpensesService;

  const mockUser = {
    id: 'user-123',
    companyId: 'company-123',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER' as any,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    hashPassword: jest.fn(),
    validatePassword: jest.fn(),
  } as any;

  const mockExpensesService = {
    createExpense: jest.fn(),
    findAllExpenses: jest.fn(),
    findOneExpense: jest.fn(),
    updateExpense: jest.fn(),
    removeExpense: jest.fn(),
    createExpenseCategory: jest.fn(),
    findAllExpenseCategories: jest.fn(),
    getTotalExpensesByPeriod: jest.fn(),
    getExpensesByCategory: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [
        {
          provide: ExpensesService,
          useValue: mockExpensesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<ExpensesController>(ExpensesController);
    service = module.get<ExpensesService>(ExpensesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createExpense', () => {
    it('should create a new expense', async () => {
      const createExpenseDto: CreateExpenseDto = {
        motif: 'Achat fournitures',
        amount: 150.00,
        category: ExpenseCategoryType.SUPPLIES,
        paymentMethod: 'cash',
        date: '2023-08-01T12:30:00.000Z',
        currencyCode: 'CDF',
      };

      const mockExpense = {
        id: 'expense-123',
        ...createExpenseDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExpensesService.createExpense.mockResolvedValue(mockExpense);

      const result = await controller.createExpense(createExpenseDto, mockUser);

      expect(mockExpensesService.createExpense).toHaveBeenCalledWith(createExpenseDto, 'user-123');
      expect(result).toEqual(mockExpense);
    });
  });

  describe('findAllExpenses', () => {
    it('should return paginated expenses', async () => {
      const mockResult = {
        data: [
          {
            id: 'expense-1',
            motif: 'Expense 1',
            amount: 100,
            date: new Date('2023-08-01T12:30:00.000Z'),
            category: ExpenseCategoryType.SUPPLIES,
            createdAt: new Date('2023-08-01T12:30:00.000Z'),
            updatedAt: new Date('2023-08-01T12:30:00.000Z'),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockExpensesService.findAllExpenses.mockResolvedValue(mockResult);

      const result = await controller.findAllExpenses({
        page: 1,
        limit: 10,
      }, mockUser);

      expect(mockExpensesService.findAllExpenses).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      }, 'user-123');
      expect(result).toEqual({
        success: true,
        message: 'Liste des dépenses récupérée avec succès',
        data: expect.any(Array), // Array of ExpenseResponseDto instances
        total: 1,
        page: 1,
        limit: 10,
        statusCode: 200
      });
    });
  });

  describe('findOneExpense', () => {
    it('should return an expense by id', async () => {
      const mockExpense = {
        id: 'expense-123',
        motif: 'Test expense',
        amount: 150,
        date: new Date('2023-08-01T12:30:00.000Z'),
        category: ExpenseCategoryType.SUPPLIES,
        createdAt: new Date('2023-08-01T12:30:00.000Z'),
        updatedAt: new Date('2023-08-01T12:30:00.000Z'),
      };

      mockExpensesService.findOneExpense.mockResolvedValue(mockExpense);

      const result = await controller.findOneExpense('expense-123', mockUser);

      expect(mockExpensesService.findOneExpense).toHaveBeenCalledWith('expense-123', 'user-123');
      expect(result).toEqual({
        success: true,
        message: 'Dépense récupérée avec succès',
        data: expect.any(Object), // ExpenseResponseDto instance
        statusCode: 200
      });
    });
  });

  describe('updateExpense', () => {
    it('should update an expense', async () => {
      const updateExpenseDto: UpdateExpenseDto = {
        motif: 'Updated expense',
        amount: 200,
      };

      const mockUpdatedExpense = {
        id: 'expense-123',
        motif: 'Updated expense',
        amount: 200,
        category: ExpenseCategoryType.SUPPLIES,
      };

      mockExpensesService.updateExpense.mockResolvedValue(mockUpdatedExpense);

      const result = await controller.updateExpense('expense-123', updateExpenseDto, mockUser);

      expect(mockExpensesService.updateExpense).toHaveBeenCalledWith('expense-123', updateExpenseDto, 'user-123');
      expect(result).toEqual(mockUpdatedExpense);
    });
  });

  describe('removeExpense', () => {
    it('should delete an expense', async () => {
      mockExpensesService.removeExpense.mockResolvedValue(undefined);

      await controller.removeExpense('expense-123', mockUser);

      expect(mockExpensesService.removeExpense).toHaveBeenCalledWith('expense-123', 'user-123');
    });
  });

  describe('createExpenseCategory', () => {
    it('should create a new expense category', async () => {
      const createCategoryDto = {
        name: 'Office Supplies',
        description: 'Fournitures de bureau',
        isActive: true,
      };

      const mockCategory = {
        id: 'category-123',
        ...createCategoryDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExpensesService.createExpenseCategory.mockResolvedValue(mockCategory);

      const result = await controller.createExpenseCategory(createCategoryDto);

      expect(mockExpensesService.createExpenseCategory).toHaveBeenCalledWith(createCategoryDto);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('findAllExpenseCategories', () => {
    it('should return paginated expense categories', async () => {
      const mockResult = {
        data: [
          {
            id: 'category-1',
            name: 'Supplies',
            description: 'Office supplies',
            isActive: true,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockExpensesService.findAllExpenseCategories.mockResolvedValue(mockResult);

      const result = await controller.findAllExpenseCategories({
        page: 1,
        limit: 10,
      });

      expect(mockExpensesService.findAllExpenseCategories).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(mockResult);
    });
  });

});
