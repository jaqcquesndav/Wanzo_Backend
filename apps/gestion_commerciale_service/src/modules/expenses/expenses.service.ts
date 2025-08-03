import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ListExpensesDto } from './dto/list-expenses.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { ListExpenseCategoriesDto } from './dto/list-expense-categories.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private readonly expenseCategoryRepository: Repository<ExpenseCategory>,
  ) {}

  // Expense Category CRUD
  async createExpenseCategory(createExpenseCategoryDto: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
    const newCategory = this.expenseCategoryRepository.create(createExpenseCategoryDto);
    return this.expenseCategoryRepository.save(newCategory);
  }

  async findAllExpenseCategories(listExpenseCategoriesDto: ListExpenseCategoriesDto): Promise<{ data: ExpenseCategory[], total: number, page: number, limit: number }> {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC' } = listExpenseCategoriesDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.expenseCategoryRepository.findAndCount({
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
    });
    return { data, total, page, limit };
  }
  
  /**
   * Récupère les catégories de dépenses associées à une liste de dépenses
   */
  async getExpenseCategoriesForExpenses(expenses: Expense[]): Promise<ExpenseCategory[]> {
    // Récupérer tous les types de catégories utilisés
    const categoryTypes = [...new Set(expenses.map(expense => expense.category))];
    
    // Récupérer les catégories correspondantes depuis la base de données
    // En supposant que le nom de la catégorie dans l'entité ExpenseCategory 
    // correspond à la valeur enum de ExpenseCategoryType
    const categories = await this.expenseCategoryRepository.createQueryBuilder('category')
      .where('category.name IN (:...names)', { names: categoryTypes })
      .getMany();
      
    return categories;
  }

  async findOneExpenseCategory(id: string): Promise<ExpenseCategory> {
    const category = await this.expenseCategoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Expense category with ID "${id}" not found`);
    }
    return category;
  }

  async updateExpenseCategory(id: string, updateExpenseCategoryDto: UpdateExpenseCategoryDto): Promise<ExpenseCategory> {
    const category = await this.findOneExpenseCategory(id);
    this.expenseCategoryRepository.merge(category, updateExpenseCategoryDto);
    return this.expenseCategoryRepository.save(category);
  }

  async removeExpenseCategory(id: string): Promise<void> {
    const category = await this.findOneExpenseCategory(id);
    // Consider checking if category is in use by expenses before deleting
    await this.expenseCategoryRepository.remove(category);
  }

  // Expense CRUD
  async createExpense(createExpenseDto: CreateExpenseDto, userId: string): Promise<Expense> {
    // Validate amount
    if (createExpenseDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    
    // Créer la dépense directement avec le DTO
    const newExpense = this.expenseRepository.create({
      ...createExpenseDto,
      userId,
      // attachmentUrls will be handled separately if file uploads are involved
    });
    
    return this.expenseRepository.save(newExpense);
  }    async findAllExpenses(
    listExpensesDto: ListExpensesDto,
    userId: string,
  ): Promise<{ data: Expense[], total: number, page: number, limit: number }> {
    const { page = 1, limit = 10, sortBy = 'expenseDate', sortOrder = 'DESC', dateFrom, dateTo, categoryId } = listExpensesDto;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (dateFrom && dateTo) {
      where.expenseDate = Between(new Date(dateFrom), new Date(dateTo));
    } else if (dateFrom) {
      where.expenseDate = Between(new Date(dateFrom), new Date()); // Default to now if no dateTo
    }
    if (categoryId) {
      where.category = { id: categoryId };
    }

    const [expenses, total] = await this.expenseRepository.findAndCount({
      where,
      relations: ['category', 'supplier'], // Eager load category and supplier if needed for list view
      skip,
      take: limit,
      order: { [sortBy]: sortOrder.toUpperCase() },
    });

    return { data: expenses, total, page, limit };
  }async findOneExpense(id: string, userId: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, userId },
      relations: ['category', 'supplier'],
    });
    if (!expense) {
      throw new NotFoundException(`Expense with ID "${id}" not found or access denied.`);
    }
    
    return expense;
  }
  
  /**
   * Get expense by ID and convert to frontend DTO format
   */
  async findOneExpenseDto(id: string, userId: string): Promise<ExpenseResponseDto> {
    const expense = await this.findOneExpense(id, userId);
    return ExpenseResponseDto.fromEntity(expense, expense.category);
  }

  async updateExpense(id: string, updateExpenseDto: UpdateExpenseDto, userId: string): Promise<Expense> {
    const expense = await this.findOneExpense(id, userId); // Ensures user owns the expense
    
    // Merge properties from the DTO
    this.expenseRepository.merge(expense, updateExpenseDto);

    return this.expenseRepository.save(expense);
  }

  async removeExpense(id: string, userId: string): Promise<void> {
    const expense = await this.findOneExpense(id, userId); // Ensures user owns the expense
    await this.expenseRepository.remove(expense);
  }

  // Placeholder for file upload logic (e.g., to Cloudinary)
  // This would likely be a separate service or integrated here
  // async handleExpenseAttachmentUpload(file: Express.Multer.File): Promise<string> {
  //   // 1. Upload to Cloudinary (or other provider)
  //   // 2. Return the URL
  //   return 'url_from_cloudinary';
  // }
}
