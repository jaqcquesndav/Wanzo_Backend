import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
import {
  UpdatePortfolioPaymentInfoDto,
  AddPortfolioBankAccountDto,
  AddPortfolioMobileMoneyAccountDto,
  VerifyPortfolioMobileMoneyAccountDto,
  PortfolioPaymentInfoResponseDto,
  PortfolioBankAccountDto,
  PortfolioMobileMoneyAccountDto,
  PaymentMethod,
  VerificationStatus
} from '../dtos/portfolio-payment-info.dto';

@Injectable()
export class PortfolioPaymentInfoService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
  ) {}

  /**
   * Obtient les informations de paiement d'un gestionnaire de portefeuille
   */
  async getPortfolioPaymentInfo(portfolioId: string): Promise<PortfolioPaymentInfoResponseDto> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    return {
      id: portfolio.id,
      managerName: portfolio.managerName,
      title: portfolio.title,
      bankAccounts: (portfolio.managerBankAccounts || []) as any,
      mobileMoneyAccounts: (portfolio.managerMobileMoneyAccounts || []) as any,
      paymentPreferences: (portfolio.managerPaymentPreferences || {
        preferredMethod: 'bank',
        allowAutomaticPayments: true
      }) as any,
      updatedAt: portfolio.updated_at
    };
  }

  /**
   * Met à jour les informations de paiement d'un gestionnaire de portefeuille
   */
  async updatePortfolioPaymentInfo(
    portfolioId: string,
    updateDto: UpdatePortfolioPaymentInfoDto
  ): Promise<PortfolioPaymentInfoResponseDto> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
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
      portfolio.managerBankAccounts = updateDto.bankAccounts as any;
    }

    if (updateDto.mobileMoneyAccounts !== undefined) {
      portfolio.managerMobileMoneyAccounts = updateDto.mobileMoneyAccounts as any;
    }

    if (updateDto.paymentPreferences !== undefined) {
      portfolio.managerPaymentPreferences = {
        ...portfolio.managerPaymentPreferences,
        ...updateDto.paymentPreferences
      } as any;
    }

    const updatedPortfolio = await this.portfolioRepository.save(portfolio);
    return this.getPortfolioPaymentInfo(updatedPortfolio.id);
  }

  /**
   * Ajoute un compte bancaire à un gestionnaire de portefeuille
   */
  async addBankAccount(addBankAccountDto: AddPortfolioBankAccountDto): Promise<PortfolioPaymentInfoResponseDto> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: addBankAccountDto.portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${addBankAccountDto.portfolioId} not found`);
    }

    const bankAccounts = portfolio.managerBankAccounts || [];
    
    // Vérifier si le compte existe déjà
    const existingAccount = bankAccounts.find(
      account => account.accountNumber === addBankAccountDto.bankAccount.accountNumber
    );

    if (existingAccount) {
      throw new ConflictException('Bank account already exists');
    }

    // Vérifier que le nom du titulaire correspond au gestionnaire
    if (addBankAccountDto.bankAccount.accountHolderName.toLowerCase() !== portfolio.managerName.toLowerCase()) {
      throw new BadRequestException('Account holder name must match portfolio manager name');
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
    portfolio.managerBankAccounts = bankAccounts;

    await this.portfolioRepository.save(portfolio);
    return this.getPortfolioPaymentInfo(portfolio.id);
  }

  /**
   * Ajoute un compte mobile money à un gestionnaire de portefeuille
   */
  async addMobileMoneyAccount(addMobileMoneyDto: AddPortfolioMobileMoneyAccountDto): Promise<PortfolioPaymentInfoResponseDto> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: addMobileMoneyDto.portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${addMobileMoneyDto.portfolioId} not found`);
    }

    const mobileMoneyAccounts = portfolio.managerMobileMoneyAccounts || [];
    
    // Vérifier si le compte existe déjà
    const existingAccount = mobileMoneyAccounts.find(
      account => account.phoneNumber === addMobileMoneyDto.mobileMoneyAccount.phoneNumber
    );

    if (existingAccount) {
      throw new ConflictException('Mobile money account already exists');
    }

    // Vérifier que le nom du titulaire correspond au gestionnaire
    if (addMobileMoneyDto.mobileMoneyAccount.accountHolderName.toLowerCase() !== portfolio.managerName.toLowerCase()) {
      throw new BadRequestException('Account holder name must match portfolio manager name');
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
      verificationStatus: 'pending' // Nécessite vérification
    };

    mobileMoneyAccounts.push(newMobileMoneyAccount as any);
    portfolio.managerMobileMoneyAccounts = mobileMoneyAccounts;

    await this.portfolioRepository.save(portfolio);

    // Initier la vérification du compte mobile money
    await this.initiatePhoneVerification(addMobileMoneyDto.mobileMoneyAccount.phoneNumber);

    return this.getPortfolioPaymentInfo(portfolio.id);
  }

  /**
   * Vérifie un compte mobile money du gestionnaire de portefeuille
   */
  async verifyMobileMoneyAccount(verifyDto: VerifyPortfolioMobileMoneyAccountDto): Promise<{ success: boolean; message: string }> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: verifyDto.portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${verifyDto.portfolioId} not found`);
    }

    const mobileMoneyAccounts = portfolio.managerMobileMoneyAccounts || [];
    const accountIndex = mobileMoneyAccounts.findIndex(
      account => account.phoneNumber === verifyDto.phoneNumber
    );

    if (accountIndex === -1) {
      throw new NotFoundException('Mobile money account not found');
    }

    // Vérifier le code
    const isValidCode = await this.verifyCode(verifyDto.phoneNumber, verifyDto.verificationCode);

    if (!isValidCode) {
      throw new BadRequestException('Invalid verification code');
    }

    // Mettre à jour le statut de vérification
    mobileMoneyAccounts[accountIndex].verificationStatus = 'verified';
    portfolio.managerMobileMoneyAccounts = mobileMoneyAccounts;

    await this.portfolioRepository.save(portfolio);

    return {
      success: true,
      message: 'Mobile money account verified successfully'
    };
  }

  /**
   * Supprime un compte bancaire du gestionnaire de portefeuille
   */
  async removeBankAccount(portfolioId: string, accountNumber: string): Promise<PortfolioPaymentInfoResponseDto> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    const bankAccounts = portfolio.managerBankAccounts || [];
    const filteredAccounts = bankAccounts.filter(account => account.accountNumber !== accountNumber);

    if (filteredAccounts.length === bankAccounts.length) {
      throw new NotFoundException('Bank account not found');
    }

    portfolio.managerBankAccounts = filteredAccounts;
    await this.portfolioRepository.save(portfolio);

    return this.getPortfolioPaymentInfo(portfolio.id);
  }

  /**
   * Supprime un compte mobile money du gestionnaire de portefeuille
   */
  async removeMobileMoneyAccount(portfolioId: string, phoneNumber: string): Promise<PortfolioPaymentInfoResponseDto> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    const mobileMoneyAccounts = portfolio.managerMobileMoneyAccounts || [];
    const filteredAccounts = mobileMoneyAccounts.filter(account => account.phoneNumber !== phoneNumber);

    if (filteredAccounts.length === mobileMoneyAccounts.length) {
      throw new NotFoundException('Mobile money account not found');
    }

    portfolio.managerMobileMoneyAccounts = filteredAccounts;
    await this.portfolioRepository.save(portfolio);

    return this.getPortfolioPaymentInfo(portfolio.id);
  }

  /**
   * Définit un compte bancaire comme compte par défaut
   */
  async setDefaultBankAccount(portfolioId: string, accountNumber: string): Promise<PortfolioPaymentInfoResponseDto> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    const bankAccounts = portfolio.managerBankAccounts || [];
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

    portfolio.managerBankAccounts = bankAccounts;
    await this.portfolioRepository.save(portfolio);

    return this.getPortfolioPaymentInfo(portfolio.id);
  }

  /**
   * Définit un compte mobile money comme compte par défaut
   */
  async setDefaultMobileMoneyAccount(portfolioId: string, phoneNumber: string): Promise<PortfolioPaymentInfoResponseDto> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    const mobileMoneyAccounts = portfolio.managerMobileMoneyAccounts || [];
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

    portfolio.managerMobileMoneyAccounts = mobileMoneyAccounts;
    await this.portfolioRepository.save(portfolio);

    return this.getPortfolioPaymentInfo(portfolio.id);
  }

  /**
   * Obtient les comptes de paiement pour les traitements de paiement
   */
  async getPaymentAccounts(portfolioId: string): Promise<{
    bankAccounts: any[];
    mobileMoneyAccounts: any[];
    defaultAccount: any | null;
  }> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    const bankAccounts = portfolio.managerBankAccounts || [];
    const mobileMoneyAccounts = portfolio.managerMobileMoneyAccounts || [];
    const preferences = portfolio.managerPaymentPreferences;

    let defaultAccount: any = null;

    if (preferences?.preferredMethod === 'bank') {
      defaultAccount = bankAccounts.find(account => account.isDefault) || bankAccounts[0] || null;
    } else {
      defaultAccount = mobileMoneyAccounts.find(account => account.isDefault && account.verificationStatus === 'verified') || 
                     mobileMoneyAccounts.find(account => account.verificationStatus === 'verified') || null;
    }

    return {
      bankAccounts,
      mobileMoneyAccounts: mobileMoneyAccounts.filter(account => account.verificationStatus === 'verified'),
      defaultAccount
    };
  }

  /**
   * Valide les comptes bancaires
   */
  private validateBankAccounts(bankAccounts: PortfolioBankAccountDto[]): void {
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
  private validateMobileMoneyAccounts(mobileMoneyAccounts: PortfolioMobileMoneyAccountDto[]): void {
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
    return `PAC-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }

  /**
   * Initie la vérification d'un numéro de téléphone
   */
  private async initiatePhoneVerification(phoneNumber: string): Promise<void> {
    // TODO: Implémenter l'envoi de SMS de vérification via l'opérateur
    console.log(`Initiating phone verification for portfolio manager: ${phoneNumber}`);
    // Dans la réalité, on enverrait un SMS avec un code de vérification
  }

  /**
   * Vérifie un code de vérification
   */
  private async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    // TODO: Implémenter la vérification réelle du code
    console.log(`Verifying code ${code} for portfolio manager phone: ${phoneNumber}`);
    // Pour la simulation, accepter le code '123456'
    return code === '123456';
  }
}