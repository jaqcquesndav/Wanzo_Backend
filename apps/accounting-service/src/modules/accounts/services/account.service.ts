import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, In } from 'typeorm';
import { Account } from '../entities/account.entity';
import { CreateAccountDto, UpdateAccountDto, AccountFilterDto } from '../dtos/account.dto';
import { AccountType } from '../entities/account.entity'; // Import AccountType
import { FiscalYearsService } from '../../fiscal-years/services/fiscal-year.service';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private readonly fiscalYearsService: FiscalYearsService,
  ) {}

  async create(createAccountDto: CreateAccountDto, userId: string): Promise<Account> {
    // Auto-extract class from account code if not provided
    if (!createAccountDto.class) {
      createAccountDto.class = createAccountDto.code.charAt(0);
    }

    // Vérifier si le code existe déjà pour cette companyId et fiscalYearId
    const existingAccount = await this.accountRepository.findOne({
      where: { 
        code: createAccountDto.code, 
        companyId: createAccountDto.companyId,
        fiscalYearId: createAccountDto.fiscalYearId 
      }
    });

    if (existingAccount) {
      throw new ConflictException(`Account with code ${createAccountDto.code} already exists for company ${createAccountDto.companyId} and fiscal year ${createAccountDto.fiscalYearId}`);
    }

    // Vérifier le compte parent si spécifié
    if (createAccountDto.parentId) {
      const parentAccount = await this.accountRepository.findOne({
        where: { id: createAccountDto.parentId }
      });

      if (!parentAccount) {
        throw new NotFoundException(`Parent account with ID ${createAccountDto.parentId} not found`);
      }
    }

    // const kiotaId = `KIOTA-CPT-${createAccountDto.code}${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const account = this.accountRepository.create({
      ...createAccountDto,
      // kiotaId, // kiotaId is not part of Account entity
      createdBy: userId,
      // companyId is now part of createAccountDto
      // fiscalYearId is now part of createAccountDto
    });

    return await this.accountRepository.save(account);
  }

  async findAll(
    filters: AccountFilterDto,
    page = 1,
    perPage = 20,
  ): Promise<{
    accounts: Account[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const where: FindOptionsWhere<Account> = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.parentId) {
      where.parentId = filters.parentId;
    }

    if (filters.isAnalytic !== undefined) {
      where.isAnalytic = filters.isAnalytic;
    }

    if (filters.active !== undefined) {
      where.active = filters.active;
    }

    if (filters.search) {
      // Assuming search targets name and code
      where.name = Like(`%${filters.search}%`);
      // Or handle multiple fields for search:
      // where = [
      //   { ...where, name: Like(`%${filters.search}%`) },
      //   { ...where, code: Like(`%${filters.search}%`) },
      // ];
    }
    
    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.fiscalYear) {
      // Assuming Account entity has fiscalYearId
      where.fiscalYearId = filters.fiscalYear;
    }
    
    // AccountingStandard might be trickier if it's not a direct field.
    // If it's part of company metadata or fiscal year metadata, this would need a more complex query.
    // For now, we assume it might be part of the account's fiscalYear relation or similar.
    // This part remains a placeholder for further refinement based on exact data model.
    // if (filters.accountingStandard) {
    //   // Example: join with fiscalYear and check standard on fiscalYear.metadata
    // }


    const [accounts, total] = await this.accountRepository.findAndCount({
      where,
      relations: ['parent', 'children'],
      skip: (page - 1) * perPage,
      take: perPage,
      order: { code: 'ASC' },
    });

    return {
      accounts,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async findByCode(code: string): Promise<Account> {
    // This method might need companyId as well if codes are not globally unique
    const account = await this.accountRepository.findOne({
      where: { code },
      relations: ['parent', 'children'],
    });

    if (!account) {
      throw new NotFoundException(`Account with code ${code} not found`);
    }

    return account;
  }

  async findOneByCodeAndCompany(code: string, companyId: string): Promise<Account | null> {
    return this.accountRepository.findOne({
      where: { code, companyId }
    });
  }
  
  /**
   * Trouve plusieurs comptes par leurs codes pour une entreprise
   * @param companyId ID de l'entreprise
   * @param codes Liste des codes de compte
   * @returns Liste des comptes correspondants
   */
  async findByAccountCodes(companyId: string, codes: string[]): Promise<Account[]> {
    if (!codes.length) return [];
    
    return this.accountRepository.find({
      where: {
        companyId,
        code: In(codes)
      }
    });
  }

  async update(id: string, updateAccountDto: UpdateAccountDto): Promise<Account> {
    const account = await this.findById(id);

    // Vérifier le compte parent si spécifié
    if (updateAccountDto.parentId) {
      const parentAccount = await this.accountRepository.findOne({
        where: { id: updateAccountDto.parentId }
      });

      if (!parentAccount) {
        throw new NotFoundException(`Parent account with ID ${updateAccountDto.parentId} not found`);
      }

      // Éviter les cycles dans la hiérarchie
      if (id === updateAccountDto.parentId) {
        throw new ConflictException('An account cannot be its own parent');
      }
    }

    Object.assign(account, updateAccountDto);
    return await this.accountRepository.save(account);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const account = await this.findById(id);

    // Vérifier si le compte a des enfants
    const hasChildren = await this.accountRepository.count({
      where: { parentId: id }
    });

    if (hasChildren > 0) {
      throw new ConflictException('Cannot delete account with child accounts');
    }

    // Désactiver le compte au lieu de le supprimer
    account.active = false;
    await this.accountRepository.save(account);

    return {
      success: true,
      message: 'Account deactivated successfully',
    };
  }

  async getAccountHierarchy(rootId?: string): Promise<Account[]> {
    const query = this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.children', 'children')
      .orderBy('account.code', 'ASC')
      .addOrderBy('children.code', 'ASC');

    if (rootId) {
      query.where('account.id = :rootId', { rootId });
    } else {
      query.where('account.parentId IS NULL');
    }

    return await query.getMany();
  }

  async setupDefaultChartOfAccounts(companyId: string, userId: string): Promise<void> {
    // This is a placeholder. Implement logic to create a default set of accounts.
    // You might have a predefined template for the chart of accounts.
    
    // Determine the current fiscal year for the new organization
    let currentFiscalYearId: string;
    try {
      const currentFiscalYear = await this.fiscalYearsService.findCurrentFiscalYear(companyId);
      currentFiscalYearId = currentFiscalYear.id;
    } catch (error) {
      // If no current fiscal year is found (e.g., for a brand new company),
      // create a default one or handle as per business logic.
      // For now, we'll log an error and use a placeholder. 
      // This part needs robust handling: e.g., create a fiscal year if none exists.
      console.error(`Error finding current fiscal year for company ${companyId}:`, error);
      // As a fallback, create a default fiscal year for the company if none exists
      // This is a simplified example; you might want more sophisticated logic
      const year = new Date().getFullYear();
      try {
        const newFiscalYear = await this.fiscalYearsService.create({
          code: `FY${year}`,
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`,
          // status: FiscalYearStatus.OPEN, // Default status is OPEN in entity
        }, companyId, userId);
        currentFiscalYearId = newFiscalYear.id;
        console.log(`Created default fiscal year ${newFiscalYear.code} for company ${companyId}`);
      } catch (creationError) {
        console.error(`Failed to create default fiscal year for company ${companyId}:`, creationError);
        throw new ConflictException(`Could not establish a fiscal year for company ${companyId}. Please set up a fiscal year manually.`);
      }
    }

    const defaultAccounts: Partial<CreateAccountDto>[] = [
      { code: '101', name: 'Cash', type: AccountType.ASSET, companyId, fiscalYearId: currentFiscalYearId }, 
      { code: '401', name: 'Accounts Payable', type: AccountType.LIABILITY, companyId, fiscalYearId: currentFiscalYearId },
      { code: '301', name: 'Common Stock', type: AccountType.EQUITY, companyId, fiscalYearId: currentFiscalYearId },
      { code: '501', name: 'Service Revenue', type: AccountType.REVENUE, companyId, fiscalYearId: currentFiscalYearId },
      { code: '601', name: 'Office Supplies Expense', type: AccountType.EXPENSE, companyId, fiscalYearId: currentFiscalYearId },
      // ... more accounts based on a standard chart (e.g., SYSCOHADA or other relevant standards)
    ];

    for (const accDto of defaultAccounts) {
      if (accDto.code) { // Ensure code is defined
        const existing = await this.findOneByCodeAndCompany(accDto.code, companyId);
        if (!existing) {
          // Ensure all required fields for CreateAccountDto are present
          const completeAccDto: CreateAccountDto = {
            code: accDto.code,
            name: accDto.name || 'Unnamed Account',
            type: accDto.type || AccountType.EXPENSE, // Default to a type if undefined, though should be set
            class: accDto.code.charAt(0), // Extract class from first digit of account code
            companyId: companyId,
            fiscalYearId: accDto.fiscalYearId || currentFiscalYearId, // Ensure fiscalYearId is set
            // kiotaId: '', // kiotaId is not part of Account entity, and not in CreateAccountDto based on previous context
            // parentId: undefined, // Set if applicable
            // description: undefined, // Set if applicable
            // active: true, // Set if applicable
            // isAnalytic: false, // Set if applicable
            // currency: 'USD', // Set if applicable, or get from company settings
            // openingBalance: 0, // Set if applicable
            // balance: 0, // Set if applicable
            // createdBy: userId, // Already passed to create method
            // updatedBy: userId, // Set if applicable
          };
          await this.create(completeAccDto, userId);
        }
      }
    }
    // Consider logging the outcome
    console.log(`Default chart of accounts setup initiated for company ${companyId} by user ${userId}`);
  }

  /**
   * Create multiple accounts at once
   */
  async createMultiple(createAccountsDto: CreateAccountDto[], userId: string): Promise<{ created: number; errors: { account: CreateAccountDto; error: string }[] }> {
    const results: { created: number; errors: { account: CreateAccountDto; error: string }[] } = { created: 0, errors: [] };

    for (const dto of createAccountsDto) {
      try {
        await this.create(dto, userId);
        results.created++;
      } catch (error) {
        results.errors.push({
          account: dto,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Import accounts from file
   */
  async importAccounts(file: Express.Multer.File, userId: string): Promise<{ imported: number; errors: { error: string }[] }> {
    // TODO: Implement file parsing logic (CSV/Excel)
    // This is a placeholder implementation
    const results: { imported: number; errors: { error: string }[] } = { imported: 0, errors: [] };
    
    try {
      // Parse file content here
      // const accounts = await this.parseAccountsFile(file);
      // const importResult = await this.createMultiple(accounts, userId);
      // return importResult;
      
      // Placeholder response
      results.errors.push({ error: 'Import functionality not yet implemented' });
    } catch (error) {
      results.errors.push({ error: error instanceof Error ? error.message : 'Unknown error' });
    }

    return results;
  }

  /**
   * Export accounts to file
   */
  async exportAccounts(format: 'csv' | 'excel'): Promise<any> {
    // TODO: Implement export logic
    // This is a placeholder implementation
    throw new Error('Export functionality not yet implemented');
  }

  /**
   * Alias pour setupDefaultChartOfAccounts pour les événements d'authentification
   */
  async initializeDefaultAccountsForOrganization(organizationId: string, userId?: string): Promise<void> {
    return this.setupDefaultChartOfAccounts(organizationId, userId || 'system');
  }
}
