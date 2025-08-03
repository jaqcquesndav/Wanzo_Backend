import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExpensesService } from '../../src/modules/expenses/expenses.service';
import { Expense, ExpenseCategoryType } from '../../src/modules/expenses/entities/expense.entity';
import { ExpenseCategory } from '../../src/modules/expenses/entities/expense-category.entity';
import { CreateExpenseDto } from '../../src/modules/expenses/dto/create-expense.dto';
import { UpdateExpenseDto } from '../../src/modules/expenses/dto/update-expense.dto';
import { ListExpensesDto } from '../../src/modules/expenses/dto/list-expenses.dto';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let expenseRepository: Repository<Expense>;
  let expenseCategoryRepository: Repository<ExpenseCategory>;

  const mockExpenseRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    merge: jest.fn(),
  };

  const mockExpenseCategoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpenseRepository,
        },
        {
          provide: getRepositoryToken(ExpenseCategory),
          useValue: mockExpenseCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
    expenseRepository = module.get<Repository<Expense>>(getRepositoryToken(Expense));
    expenseCategoryRepository = module.get<Repository<ExpenseCategory>>(getRepositoryToken(ExpenseCategory));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExpense', () => {
    it('should create a new expense', async () => {
      const createExpenseDto: CreateExpenseDto = {
        motif: 'Achat fournitures bureau',
        amount: 150.00,
        category: ExpenseCategoryType.SUPPLIES,
        paymentMethod: 'cash',
        date: '2023-08-01T12:30:00.000Z',
        currencyCode: 'CDF',
      };

      const mockExpense = {
        id: 'expense-123',
        ...createExpenseDto,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExpenseRepository.create.mockReturnValue(mockExpense);
      mockExpenseRepository.save.mockResolvedValue(mockExpense);

      const result = await service.createExpense(createExpenseDto, 'user-123');

      expect(mockExpenseRepository.create).toHaveBeenCalledWith({
        ...createExpenseDto,
        userId: 'user-123',
      });
      expect(mockExpenseRepository.save).toHaveBeenCalledWith(mockExpense);
      expect(result).toEqual(mockExpense);
    });

    it('should throw BadRequestException for invalid amount', async () => {
      const createExpenseDto: CreateExpenseDto = {
        motif: 'Test expense',
        amount: -50.00, // Montant négatif
        category: ExpenseCategoryType.SUPPLIES,
        paymentMethod: 'cash',
        date: '2023-08-01T12:30:00.000Z',
        currencyCode: 'CDF',
      };

      await expect(service.createExpense(createExpenseDto, 'user-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllExpenses', () => {
    it('should return paginated expenses', async () => {
      const mockExpenses = [
        {
          id: 'expense-1',
          motif: 'Expense 1',
          amount: 100,
          category: ExpenseCategoryType.SUPPLIES,
        },
        {
          id: 'expense-2',
          motif: 'Expense 2',
          amount: 200,
          category: ExpenseCategoryType.UTILITIES,
        },
      ];

      mockExpenseRepository.findAndCount.mockResolvedValue([mockExpenses, 2]);

      const result = await service.findAllExpenses({
        page: 1,
        limit: 10,
      }, 'user-123');

      expect(result).toEqual({
        data: mockExpenses,
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('should filter expenses by category', async () => {
      const mockExpenses = [
        {
          id: 'expense-1',
          motif: 'Office supplies',
          amount: 100,
          category: ExpenseCategoryType.SUPPLIES,
        },
      ];

      mockExpenseRepository.findAndCount.mockResolvedValue([mockExpenses, 1]);

      const result = await service.findAllExpenses({
        page: 1,
        limit: 10,
        categoryId: 'category-uuid-123',
      }, 'user-123');

      expect(result.data).toEqual(mockExpenses);
      expect(result.total).toBe(1);
    });
  });

  describe('findOneExpense', () => {
    it('should return an expense by id', async () => {
      const mockExpense = {
        id: 'expense-123',
        motif: 'Test expense',
        amount: 150,
        category: ExpenseCategoryType.SUPPLIES,
      };

      mockExpenseRepository.findOne.mockResolvedValue(mockExpense);

      const result = await service.findOneExpense('expense-123', 'user-123');

      expect(mockExpenseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'expense-123', userId: 'user-123' },
        relations: ['category', 'supplier'],
      });
      expect(result).toEqual(mockExpense);
    });

    it('should throw NotFoundException when expense not found', async () => {
      mockExpenseRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneExpense('non-existent-id', 'user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateExpense', () => {
    it('should update an expense', async () => {
      const updateExpenseDto: UpdateExpenseDto = {
        motif: 'Updated expense',
        amount: 200,
      };

      const existingExpense = {
        id: 'expense-123',
        motif: 'Original expense',
        amount: 150,
        category: ExpenseCategoryType.SUPPLIES,
      };

      const updatedExpense = {
        ...existingExpense,
        ...updateExpenseDto,
      };

      mockExpenseRepository.findOne.mockResolvedValue(existingExpense);
      mockExpenseRepository.merge.mockImplementation((target, source) => {
        Object.assign(target, source);
        return target;
      });
      mockExpenseRepository.save.mockResolvedValue(updatedExpense);

      const result = await service.updateExpense('expense-123', updateExpenseDto, 'user-123');

      expect(mockExpenseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'expense-123', userId: 'user-123' },
        relations: ['category', 'supplier'],
      });
      expect(mockExpenseRepository.merge).toHaveBeenCalledWith(existingExpense, updateExpenseDto);
      expect(mockExpenseRepository.save).toHaveBeenCalledWith(existingExpense);
      expect(result).toEqual(updatedExpense);
    });

    it('should throw NotFoundException when expense not found', async () => {
      mockExpenseRepository.findOne.mockResolvedValue(null);

      await expect(service.updateExpense('non-existent-id', {}, 'user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeExpense', () => {
    it('should delete an expense', async () => {
      const mockExpense = {
        id: 'expense-123',
        motif: 'Test expense',
        amount: 150,
      };

      mockExpenseRepository.findOne.mockResolvedValue(mockExpense);
      mockExpenseRepository.remove.mockResolvedValue(mockExpense);

      await service.removeExpense('expense-123', 'user-123');

      expect(mockExpenseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'expense-123', userId: 'user-123' },
        relations: ['category', 'supplier'],
      });
      expect(mockExpenseRepository.remove).toHaveBeenCalledWith(mockExpense);
    });

    it('should throw NotFoundException when expense not found', async () => {
      mockExpenseRepository.findOne.mockResolvedValue(null);

      await expect(service.removeExpense('non-existent-id', 'user-123')).rejects.toThrow(NotFoundException);
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

      mockExpenseCategoryRepository.create.mockReturnValue(mockCategory);
      mockExpenseCategoryRepository.save.mockResolvedValue(mockCategory);

      const result = await service.createExpenseCategory(createCategoryDto);

      expect(mockExpenseCategoryRepository.create).toHaveBeenCalledWith(createCategoryDto);
      expect(mockExpenseCategoryRepository.save).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('findAllExpenseCategories', () => {
    it('should return paginated expense categories', async () => {
      const mockCategories = [
        {
          id: 'category-1',
          name: 'Supplies',
          description: 'Office supplies',
          isActive: true,
        },
        {
          id: 'category-2',
          name: 'Utilities',
          description: 'Utility bills',
          isActive: true,
        },
      ];

      mockExpenseCategoryRepository.findAndCount.mockResolvedValue([mockCategories, 2]);

      const result = await service.findAllExpenseCategories({
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        data: mockCategories,
        total: 2,
        page: 1,
        limit: 10,
      });
    });
  });
});
