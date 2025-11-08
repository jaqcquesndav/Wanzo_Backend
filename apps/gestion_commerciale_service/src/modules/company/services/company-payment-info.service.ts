import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import {
  UpdateCompanyPaymentInfoDto,
  AddBankAccountDto,
  AddMobileMoneyAccountDto,
  VerifyMobileMoneyAccountDto,
  CompanyPaymentInfoResponseDto,
  BankAccountInfoDto,
  MobileMoneyAccountDto
} from '../dto/company-payment-info.dto';

@Injectable()
export class CompanyPaymentInfoService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  /**
   * Obtient les informations de paiement d'une entreprise
   */
  async getCompanyPaymentInfo(companyId: string): Promise<CompanyPaymentInfoResponseDto> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId }
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    return {
      id: company.id,
      name: company.name,
      bankAccounts: company.bankAccounts || [],
      mobileMoneyAccounts: company.mobileMoneyAccounts || [],
      paymentPreferences: company.paymentPreferences || {
        preferredMethod: 'bank',
        allowPartialPayments: true,
        allowAdvancePayments: true
      },
      updatedAt: company.updatedAt
    };
  }

  /**
   * Met à jour les informations de paiement d'une entreprise
   */
  async updateCompanyPaymentInfo(
    companyId: string,
    updateDto: UpdateCompanyPaymentInfoDto
  ): Promise<CompanyPaymentInfoResponseDto> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId }
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // Valider les données
    if (updateDto.bankAccounts) {
      this.validateBankAccounts(updateDto.bankAccounts);
    }

    if (updateDto.mobileMoneyAccounts) {
      this.validateMobileMoneyAccounts(updateDto.mobileMoneyAccounts);
    }

    // Mettre à jour les informations
    if (updateDto.bankAccounts !== undefined) {
      company.bankAccounts = updateDto.bankAccounts;
    }

    if (updateDto.mobileMoneyAccounts !== undefined) {
      company.mobileMoneyAccounts = updateDto.mobileMoneyAccounts;
    }

    if (updateDto.paymentPreferences !== undefined) {
      company.paymentPreferences = {
        ...company.paymentPreferences,
        ...updateDto.paymentPreferences
      };
    }

    const updatedCompany = await this.companyRepository.save(company);
    return this.getCompanyPaymentInfo(updatedCompany.id);
  }

  /**
   * Ajoute un compte bancaire à une entreprise
   */
  async addBankAccount(addBankAccountDto: AddBankAccountDto): Promise<CompanyPaymentInfoResponseDto> {
    const company = await this.companyRepository.findOne({
      where: { id: addBankAccountDto.companyId }
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${addBankAccountDto.companyId} not found`);
    }

    const bankAccounts = company.bankAccounts || [];
    
    // Vérifier si le compte existe déjà
    const existingAccount = bankAccounts.find(
      account => account.accountNumber === addBankAccountDto.bankAccount.accountNumber
    );

    if (existingAccount) {
      throw new ConflictException('Bank account already exists');
    }

    // Si c'est le compte par défaut, désactiver les autres
    if (addBankAccountDto.bankAccount.isDefault) {
      bankAccounts.forEach(account => account.isDefault = false);
    }

    // Ajouter le nouveau compte avec un ID unique
    const newBankAccount = {
      ...addBankAccountDto.bankAccount,
      id: this.generateAccountId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    bankAccounts.push(newBankAccount as any);
    company.bankAccounts = bankAccounts;

    await this.companyRepository.save(company);
    return this.getCompanyPaymentInfo(company.id);
  }

  /**
   * Ajoute un compte mobile money à une entreprise
   */
  async addMobileMoneyAccount(addMobileMoneyDto: AddMobileMoneyAccountDto): Promise<CompanyPaymentInfoResponseDto> {
    const company = await this.companyRepository.findOne({
      where: { id: addMobileMoneyDto.companyId }
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${addMobileMoneyDto.companyId} not found`);
    }

    const mobileMoneyAccounts = company.mobileMoneyAccounts || [];
    
    // Vérifier si le compte existe déjà
    const existingAccount = mobileMoneyAccounts.find(
      account => account.phoneNumber === addMobileMoneyDto.mobileMoneyAccount.phoneNumber
    );

    if (existingAccount) {
      throw new ConflictException('Mobile money account already exists');
    }

    // Si c'est le compte par défaut, désactiver les autres
    if (addMobileMoneyDto.mobileMoneyAccount.isDefault) {
      mobileMoneyAccounts.forEach(account => account.isDefault = false);
    }

    // Ajouter le nouveau compte avec un ID unique
    const newMobileMoneyAccount = {
      ...addMobileMoneyDto.mobileMoneyAccount,
      id: this.generateAccountId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      verificationStatus: 'pending' as const // Nécessite vérification
    };

    mobileMoneyAccounts.push(newMobileMoneyAccount as any);
    company.mobileMoneyAccounts = mobileMoneyAccounts;

    await this.companyRepository.save(company);

    // Initier la vérification du compte mobile money
    await this.initiatePhoneVerification(addMobileMoneyDto.mobileMoneyAccount.phoneNumber);

    return this.getCompanyPaymentInfo(company.id);
  }

  /**
   * Vérifie un compte mobile money
   */
  async verifyMobileMoneyAccount(verifyDto: VerifyMobileMoneyAccountDto): Promise<{ success: boolean; message: string }> {
    const company = await this.companyRepository.findOne({
      where: { id: verifyDto.companyId }
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${verifyDto.companyId} not found`);
    }

    const mobileMoneyAccounts = company.mobileMoneyAccounts || [];
    const accountIndex = mobileMoneyAccounts.findIndex(
      account => account.phoneNumber === verifyDto.phoneNumber
    );

    if (accountIndex === -1) {
      throw new NotFoundException('Mobile money account not found');
    }

    // Vérifier le code (ici c'est simulé, dans la réalité on vérifierait avec l'opérateur)
    const isValidCode = await this.verifyCode(verifyDto.phoneNumber, verifyDto.verificationCode);

    if (!isValidCode) {
      throw new BadRequestException('Invalid verification code');
    }

    // Mettre à jour le statut de vérification
    mobileMoneyAccounts[accountIndex].verificationStatus = 'verified';
    company.mobileMoneyAccounts = mobileMoneyAccounts;

    await this.companyRepository.save(company);

    return {
      success: true,
      message: 'Mobile money account verified successfully'
    };
  }

  /**
   * Supprime un compte bancaire
   */
  async removeBankAccount(companyId: string, accountNumber: string): Promise<CompanyPaymentInfoResponseDto> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId }
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const bankAccounts = company.bankAccounts || [];
    const filteredAccounts = bankAccounts.filter(account => account.accountNumber !== accountNumber);

    if (filteredAccounts.length === bankAccounts.length) {
      throw new NotFoundException('Bank account not found');
    }

    company.bankAccounts = filteredAccounts;
    await this.companyRepository.save(company);

    return this.getCompanyPaymentInfo(company.id);
  }

  /**
   * Supprime un compte mobile money
   */
  async removeMobileMoneyAccount(companyId: string, phoneNumber: string): Promise<CompanyPaymentInfoResponseDto> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId }
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const mobileMoneyAccounts = company.mobileMoneyAccounts || [];
    const filteredAccounts = mobileMoneyAccounts.filter(account => account.phoneNumber !== phoneNumber);

    if (filteredAccounts.length === mobileMoneyAccounts.length) {
      throw new NotFoundException('Mobile money account not found');
    }

    company.mobileMoneyAccounts = filteredAccounts;
    await this.companyRepository.save(company);

    return this.getCompanyPaymentInfo(company.id);
  }

  /**
   * Définit un compte bancaire comme compte par défaut
   */
  async setDefaultBankAccount(companyId: string, accountNumber: string): Promise<CompanyPaymentInfoResponseDto> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId }
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const bankAccounts = company.bankAccounts || [];
    let accountFound = false;

    bankAccounts.forEach(account => {
      if (account.accountNumber === accountNumber) {
        account.isDefault = true;
        accountFound = true;
      } else {
        account.isDefault = false;
      }
    });

    if (!accountFound) {
      throw new NotFoundException('Bank account not found');
    }

    company.bankAccounts = bankAccounts;
    await this.companyRepository.save(company);

    return this.getCompanyPaymentInfo(company.id);
  }

  /**
   * Définit un compte mobile money comme compte par défaut
   */
  async setDefaultMobileMoneyAccount(companyId: string, phoneNumber: string): Promise<CompanyPaymentInfoResponseDto> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId }
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const mobileMoneyAccounts = company.mobileMoneyAccounts || [];
    let accountFound = false;

    mobileMoneyAccounts.forEach(account => {
      if (account.phoneNumber === phoneNumber) {
        account.isDefault = true;
        accountFound = true;
      } else {
        account.isDefault = false;
      }
    });

    if (!accountFound) {
      throw new NotFoundException('Mobile money account not found');
    }

    company.mobileMoneyAccounts = mobileMoneyAccounts;
    await this.companyRepository.save(company);

    return this.getCompanyPaymentInfo(company.id);
  }

  /**
   * Valide les comptes bancaires
   */
  private validateBankAccounts(bankAccounts: BankAccountInfoDto[]): void {
    const accountNumbers = bankAccounts.map(account => account.accountNumber);
    const uniqueAccountNumbers = new Set(accountNumbers);

    if (accountNumbers.length !== uniqueAccountNumbers.size) {
      throw new BadRequestException('Duplicate bank account numbers are not allowed');
    }

    const defaultAccounts = bankAccounts.filter(account => account.isDefault);
    if (defaultAccounts.length > 1) {
      throw new BadRequestException('Only one bank account can be set as default');
    }
  }

  /**
   * Valide les comptes mobile money
   */
  private validateMobileMoneyAccounts(mobileMoneyAccounts: MobileMoneyAccountDto[]): void {
    const phoneNumbers = mobileMoneyAccounts.map(account => account.phoneNumber);
    const uniquePhoneNumbers = new Set(phoneNumbers);

    if (phoneNumbers.length !== uniquePhoneNumbers.size) {
      throw new BadRequestException('Duplicate mobile money phone numbers are not allowed');
    }

    const defaultAccounts = mobileMoneyAccounts.filter(account => account.isDefault);
    if (defaultAccounts.length > 1) {
      throw new BadRequestException('Only one mobile money account can be set as default');
    }

    // Valider les numéros de téléphone
    phoneNumbers.forEach(phone => {
      if (!this.isValidPhoneNumber(phone)) {
        throw new BadRequestException(`Invalid phone number format: ${phone}`);
      }
    });
  }

  /**
   * Valide un numéro de téléphone
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Format attendu: +243XXXXXXXXX (RDC)
    return /^\+243[0-9]{9}$/.test(phone);
  }

  /**
   * Génère un ID unique pour un compte
   */
  private generateAccountId(): string {
    return `ACC-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }

  /**
   * Initie la vérification d'un numéro de téléphone
   */
  private async initiatePhoneVerification(phoneNumber: string): Promise<void> {
    // TODO: Implémenter l'envoi de SMS de vérification via l'opérateur
    console.log(`Initiating phone verification for: ${phoneNumber}`);
    // Dans la réalité, on enverrait un SMS avec un code de vérification
  }

  /**
   * Vérifie un code de vérification
   */
  private async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    // TODO: Implémenter la vérification réelle du code
    console.log(`Verifying code ${code} for phone: ${phoneNumber}`);
    // Pour la simulation, accepter le code '123456'
    return code === '123456';
  }
}