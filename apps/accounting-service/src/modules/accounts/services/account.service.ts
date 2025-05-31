import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Account } from '../entities/account.entity';
import { CreateAccountDto, UpdateAccountDto, AccountFilterDto } from '../dtos/account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async create(createAccountDto: CreateAccountDto, userId: string): Promise<Account> {
    // Vérifier si le code existe déjà
    const existingAccount = await this.accountRepository.findOne({
      where: { code: createAccountDto.code }
    });

    if (existingAccount) {
      throw new ConflictException(`Account with code ${createAccountDto.code} already exists`);
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

    const kiotaId = `KIOTA-CPT-${createAccountDto.code}${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const account = this.accountRepository.create({
      ...createAccountDto,
      kiotaId,
      createdBy: userId,
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
      where.name = Like(`%${filters.search}%`);
    }

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
    const account = await this.accountRepository.findOne({
      where: { code },
      relations: ['parent', 'children'],
    });

    if (!account) {
      throw new NotFoundException(`Account with code ${code} not found`);
    }

    return account;
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
}