import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountStandardMapping } from '../entities/account-standard-mapping.entity';
import { AccountingStandard } from '../../../common/enums/accounting.enum'; // Corrected import path
import { Account } from '../entities/account.entity';

@Injectable()
export class AccountStandardMappingService {
  constructor(
    @InjectRepository(AccountStandardMapping)
    private mappingRepository: Repository<AccountStandardMapping>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  /**
   * Create a new mapping between an account and its equivalent in another accounting standard
   */
  async createMapping(
    accountId: string,
    standard: AccountingStandard,
    standardAccountCode: string,
    standardAccountName: string,
    description?: string,
    userId?: string,
    companyId?: string,
  ): Promise<AccountStandardMapping> {
    // Check if the account exists
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    // Check if mapping already exists
    const existingMapping = await this.mappingRepository.findOne({
      where: {
        accountId,
        standard,
      },
    });

    if (existingMapping) {
      // Update existing mapping
      existingMapping.standardAccountCode = standardAccountCode;
      existingMapping.standardAccountName = standardAccountName;
      existingMapping.description = description;
      
      return await this.mappingRepository.save(existingMapping);
    }

    // Create new mapping
    const mapping = this.mappingRepository.create({
      accountId,
      standard,
      standardAccountCode,
      standardAccountName,
      description,
      companyId,
      createdBy: userId,
    });

    return await this.mappingRepository.save(mapping);
  }

  /**
   * Get mappings for an account
   */
  async getMappingsForAccount(accountId: string): Promise<AccountStandardMapping[]> {
    return await this.mappingRepository.find({
      where: { accountId },
    });
  }

  /**
   * Get mapping for an account in a specific standard
   */
  async getMappingForAccountInStandard(
    accountId: string,
    standard: AccountingStandard,
  ): Promise<AccountStandardMapping | null> {
    return await this.mappingRepository.findOne({
      where: {
        accountId,
        standard,
      },
    });
  }

  /**
   * Find account by code in a specific standard
   */
  async findAccountByCodeInStandard(
    standardAccountCode: string,
    standard: AccountingStandard,
    companyId?: string,
  ): Promise<Account | null> {
    const mapping = await this.mappingRepository.findOne({
      where: {
        standardAccountCode,
        standard,
        ...(companyId ? { companyId } : {}),
      },
      relations: ['account'],
    });

    return mapping?.account || null;
  }

  /**
   * Get all mappings for a company in a specific standard
   */
  async getAllMappingsForCompanyInStandard(
    companyId: string,
    standard: AccountingStandard,
  ): Promise<AccountStandardMapping[]> {
    return await this.mappingRepository.find({
      where: {
        companyId,
        standard,
      },
      relations: ['account'],
    });
  }

  /**
   * Delete a mapping
   */
  async deleteMapping(id: string): Promise<boolean> {
    const mapping = await this.mappingRepository.findOne({
      where: { id },
    });

    if (!mapping) {
      throw new NotFoundException(`Mapping with ID ${id} not found`);
    }

    await this.mappingRepository.remove(mapping);
    return true;
  }

  /**
   * Batch create mappings
   */
  async batchCreateMappings(
    mappings: Array<{
      accountId: string;
      standard: AccountingStandard;
      standardAccountCode: string;
      standardAccountName: string;
      description?: string;
    }>,
    userId: string,
    companyId: string,
  ): Promise<AccountStandardMapping[]> {
    const createdMappings: AccountStandardMapping[] = [];

    for (const mapping of mappings) {
      const createdMapping = await this.createMapping(
        mapping.accountId,
        mapping.standard,
        mapping.standardAccountCode,
        mapping.standardAccountName,
        mapping.description,
        userId,
        companyId,
      );
      
      createdMappings.push(createdMapping);
    }

    return createdMappings;
  }
}
