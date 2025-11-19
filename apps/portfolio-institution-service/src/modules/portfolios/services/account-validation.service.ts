import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
import { FundingRequest } from '../entities/funding-request.entity';

/**
 * Service de validation des comptes bancaires et mobile money
 * Assure que les comptes sont actifs et valides avant les opérations financières
 */
@Injectable()
export class AccountValidationService {
  private readonly logger = new Logger(AccountValidationService.name);

  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    @InjectRepository(FundingRequest)
    private readonly fundingRequestRepository: Repository<FundingRequest>,
  ) {}

  /**
   * Valide qu'un compte bancaire existe et est actif dans le portfolio
   */
  async validateBankAccount(
    portfolioId: string,
    accountId: string
  ): Promise<{ valid: boolean; account?: any; error?: string }> {
    try {
      const portfolio = await this.portfolioRepository.findOne({
        where: { id: portfolioId },
      });

      if (!portfolio) {
        return { valid: false, error: `Portfolio ${portfolioId} not found` };
      }

      if (!portfolio.bank_accounts || portfolio.bank_accounts.length === 0) {
        return { valid: false, error: 'No bank accounts configured for this portfolio' };
      }

      const account = portfolio.bank_accounts.find((acc) => acc.id === accountId);

      if (!account) {
        return { valid: false, error: `Bank account ${accountId} not found in portfolio` };
      }

      if (account.status !== 'active') {
        return {
          valid: false,
          error: `Bank account ${accountId} is ${account.status}, must be active`,
        };
      }

      return { valid: true, account };
    } catch (error: any) {
      this.logger.error(`Error validating bank account: ${error.message}`, error.stack);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Valide qu'un compte mobile money existe et est actif dans le portfolio
   */
  async validateMobileMoneyAccount(
    portfolioId: string,
    accountId: string
  ): Promise<{ valid: boolean; account?: any; error?: string }> {
    try {
      const portfolio = await this.portfolioRepository.findOne({
        where: { id: portfolioId },
      });

      if (!portfolio) {
        return { valid: false, error: `Portfolio ${portfolioId} not found` };
      }

      if (!portfolio.mobile_money_accounts || portfolio.mobile_money_accounts.length === 0) {
        return { valid: false, error: 'No mobile money accounts configured for this portfolio' };
      }

      const account = portfolio.mobile_money_accounts.find((acc) => acc.id === accountId);

      if (!account) {
        return {
          valid: false,
          error: `Mobile money account ${accountId} not found in portfolio`,
        };
      }

      if (!account.is_active) {
        return {
          valid: false,
          error: `Mobile money account ${accountId} is inactive`,
        };
      }

      if (account.account_status !== 'verified') {
        return {
          valid: false,
          error: `Mobile money account ${accountId} is not verified (status: ${account.account_status})`,
        };
      }

      return { valid: true, account };
    } catch (error: any) {
      this.logger.error(`Error validating mobile money account: ${error.message}`, error.stack);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Récupère le compte par défaut (bancaire ou mobile money) pour un portfolio
   */
  async getDefaultPaymentAccount(portfolioId: string): Promise<{
    type: 'bank' | 'mobile_money' | null;
    account?: any;
    error?: string;
  }> {
    try {
      const portfolio = await this.portfolioRepository.findOne({
        where: { id: portfolioId },
      });

      if (!portfolio) {
        return { type: null, error: `Portfolio ${portfolioId} not found` };
      }

      // Chercher compte bancaire par défaut
      if (portfolio.bank_accounts && portfolio.bank_accounts.length > 0) {
        const defaultBankAccount = portfolio.bank_accounts.find(
          (acc) => acc.is_default && acc.status === 'active'
        );
        if (defaultBankAccount) {
          return { type: 'bank', account: defaultBankAccount };
        }
      }

      // Chercher compte mobile money par défaut
      if (portfolio.mobile_money_accounts && portfolio.mobile_money_accounts.length > 0) {
        const defaultMobileAccount = portfolio.mobile_money_accounts.find(
          (acc) => acc.is_primary && acc.is_active && acc.account_status === 'verified'
        );
        if (defaultMobileAccount) {
          return { type: 'mobile_money', account: defaultMobileAccount };
        }
      }

      return { type: null, error: 'No default payment account configured' };
    } catch (error: any) {
      this.logger.error(`Error getting default payment account: ${error.message}`, error.stack);
      return { type: null, error: error.message };
    }
  }

  /**
   * Valide les limites de transaction pour un compte mobile money
   */
  async validateTransactionLimits(
    accountId: string,
    amount: number,
    portfolioId: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const portfolio = await this.portfolioRepository.findOne({
        where: { id: portfolioId },
      });

      if (!portfolio || !portfolio.mobile_money_accounts) {
        return { valid: false, error: 'Portfolio or mobile money accounts not found' };
      }

      const account = portfolio.mobile_money_accounts.find((acc) => acc.id === accountId);

      if (!account) {
        return { valid: false, error: `Mobile money account ${accountId} not found` };
      }

      // Vérifier limite journalière
      if (account.daily_limit && amount > account.daily_limit) {
        return {
          valid: false,
          error: `Amount ${amount} exceeds daily limit of ${account.daily_limit}`,
        };
      }

      // Vérifier limite mensuelle
      if (account.monthly_limit && amount > account.monthly_limit) {
        return {
          valid: false,
          error: `Amount ${amount} exceeds monthly limit of ${account.monthly_limit}`,
        };
      }

      return { valid: true };
    } catch (error: any) {
      this.logger.error(`Error validating transaction limits: ${error.message}`, error.stack);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Valide le solde disponible pour un compte
   */
  async validateAccountBalance(
    accountId: string,
    amount: number,
    portfolioId: string,
    accountType: 'bank' | 'mobile_money'
  ): Promise<{ valid: boolean; error?: string; availableBalance?: number }> {
    try {
      const portfolio = await this.portfolioRepository.findOne({
        where: { id: portfolioId },
      });

      if (!portfolio) {
        return { valid: false, error: 'Portfolio not found' };
      }

      let account: any;
      let availableBalance = 0;

      if (accountType === 'bank') {
        account = portfolio.bank_accounts?.find((acc) => acc.id === accountId);
        availableBalance = account?.balance || 0;
      } else {
        account = portfolio.mobile_money_accounts?.find((acc) => acc.id === accountId);
        availableBalance = account?.balance || 0;
      }

      if (!account) {
        return { valid: false, error: `${accountType} account ${accountId} not found` };
      }

      if (availableBalance < amount) {
        return {
          valid: false,
          error: `Insufficient balance: ${availableBalance} < ${amount}`,
          availableBalance,
        };
      }

      return { valid: true, availableBalance };
    } catch (error: any) {
      this.logger.error(`Error validating account balance: ${error.message}`, error.stack);
      return { valid: false, error: error.message };
    }
  }
}
