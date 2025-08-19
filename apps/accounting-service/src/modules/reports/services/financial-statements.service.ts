import { Injectable } from '@nestjs/common';
import { AccountService } from '../../accounts/services/account.service';
import { JournalService } from '../../journals/services/journal.service';
import { AccountType } from '../../accounts/entities/account.entity';
import { AccountingFramework } from '../dtos/report.dto';

@Injectable()
export class FinancialStatementsService {
  constructor(
    private accountService: AccountService,
    private journalService: JournalService,
  ) {}

  async generateBalanceSheet(
    companyId: string,
    fiscalYear: string,
    asOfDate: Date,
    framework: AccountingFramework = AccountingFramework.SYSCOHADA,
  ) {
    const accounts = await this.accountService.findAll({ companyId });
    const balances = await Promise.all(
      accounts.accounts.map(account =>
        this.journalService.getAccountBalance(account.id, fiscalYear, companyId, asOfDate)
      )
    );

    // Structure selon SYSCOHADA
    if (framework === AccountingFramework.SYSCOHADA) {
      return {
        actif: {
          immobilisations: {
            incorporelles: this.calculateAccountGroup(accounts.accounts, balances, '20'),
            corporelles: this.calculateAccountGroup(accounts.accounts, balances, '21'),
            financieres: this.calculateAccountGroup(accounts.accounts, balances, '26'),
          },
          actifCirculant: {
            stocks: this.calculateAccountGroup(accounts.accounts, balances, '3'),
            creances: this.calculateAccountGroup(accounts.accounts, balances, '41'),
            tresorerie: this.calculateAccountGroup(accounts.accounts, balances, '52'),
          },
        },
        passif: {
          capitauxPropres: {
            capital: this.calculateAccountGroup(accounts.accounts, balances, '10'),
            reserves: this.calculateAccountGroup(accounts.accounts, balances, '11'),
            resultat: this.calculateAccountGroup(accounts.accounts, balances, '12'),
          },
          dettes: {
            financieres: this.calculateAccountGroup(accounts.accounts, balances, '16'),
            fournisseurs: this.calculateAccountGroup(accounts.accounts, balances, '40'),
            fiscales: this.calculateAccountGroup(accounts.accounts, balances, '44'),
          },
        },
      };
    }

    // Structure selon IFRS
    return {
      assets: {
        nonCurrentAssets: {
          propertyPlantEquipment: this.calculateAccountGroup(accounts.accounts, balances, '21'),
          intangibleAssets: this.calculateAccountGroup(accounts.accounts, balances, '20'),
          financialAssets: this.calculateAccountGroup(accounts.accounts, balances, '26'),
        },
        currentAssets: {
          inventory: this.calculateAccountGroup(accounts.accounts, balances, '3'),
          tradeReceivables: this.calculateAccountGroup(accounts.accounts, balances, '41'),
          cash: this.calculateAccountGroup(accounts.accounts, balances, '52'),
        },
      },
      equityAndLiabilities: {
        equity: {
          shareCapital: this.calculateAccountGroup(accounts.accounts, balances, '10'),
          reserves: this.calculateAccountGroup(accounts.accounts, balances, '11'),
          retainedEarnings: this.calculateAccountGroup(accounts.accounts, balances, '12'),
        },
        liabilities: {
          nonCurrentLiabilities: this.calculateAccountGroup(accounts.accounts, balances, '16'),
          tradePayables: this.calculateAccountGroup(accounts.accounts, balances, '40'),
          taxLiabilities: this.calculateAccountGroup(accounts.accounts, balances, '44'),
        },
      },
    };
  }

  async generateIncomeStatement(
    companyId: string,
    fiscalYear: string,
    startDate: Date,
    endDate: Date,
    framework: AccountingFramework = AccountingFramework.SYSCOHADA,
  ) {
    const accounts = await this.accountService.findAll({ companyId });
    const balances = await Promise.all(
      accounts.accounts.map(account =>
        this.journalService.getAccountBalance(account.id, fiscalYear, companyId, endDate)
      )
    );

    // Structure selon SYSCOHADA
    if (framework === AccountingFramework.SYSCOHADA) {
      return {
        produits: {
          ventesMarhandises: this.calculateAccountGroup(accounts.accounts, balances, '70'),
          productionVendue: this.calculateAccountGroup(accounts.accounts, balances, '71'),
          productionStockee: this.calculateAccountGroup(accounts.accounts, balances, '72'),
          subventions: this.calculateAccountGroup(accounts.accounts, balances, '74'),
        },
        charges: {
          achatsMarhandises: this.calculateAccountGroup(accounts.accounts, balances, '60'),
          transportsSurAchats: this.calculateAccountGroup(accounts.accounts, balances, '61'),
          servicesExterieurs: this.calculateAccountGroup(accounts.accounts, balances, '62'),
          impotsTaxes: this.calculateAccountGroup(accounts.accounts, balances, '64'),
          chargesPersonnel: this.calculateAccountGroup(accounts.accounts, balances, '66'),
          chargesFinancieres: this.calculateAccountGroup(accounts.accounts, balances, '67'),
        },
      };
    }

    // Structure selon IFRS
    return {
      revenue: {
        sales: this.calculateAccountGroup(accounts.accounts, balances, '70'),
        otherIncome: this.calculateAccountGroup(accounts.accounts, balances, '74'),
      },
      expenses: {
        costOfSales: this.calculateAccountGroup(accounts.accounts, balances, '60'),
        distributionCosts: this.calculateAccountGroup(accounts.accounts, balances, '61'),
        administrativeExpenses: this.calculateAccountGroup(accounts.accounts, balances, '62'),
        employeeBenefits: this.calculateAccountGroup(accounts.accounts, balances, '66'),
        financeExpenses: this.calculateAccountGroup(accounts.accounts, balances, '67'),
      },
    };
  }

  async generateCashFlowStatement(
    companyId: string,
    fiscalYear: string,
    startDate: Date,
    endDate: Date,
    framework: AccountingFramework = AccountingFramework.SYSCOHADA,
  ) {
    const accounts = await this.accountService.findAll({ companyId });
    const balances = await Promise.all(
      accounts.accounts.map(account =>
        this.journalService.getAccountBalance(account.id, fiscalYear, companyId, endDate)
      )
    );

    // Structure selon SYSCOHADA
    if (framework === AccountingFramework.SYSCOHADA) {
      return {
        fluxTresorerieActivites: {
          exploitation: {
            encaissementsClients: this.calculateAccountGroup(accounts.accounts, balances, '411'),
            paiementsFournisseurs: this.calculateAccountGroup(accounts.accounts, balances, '401'),
            chargesPersonnel: this.calculateAccountGroup(accounts.accounts, balances, '661'),
            impotsTaxes: this.calculateAccountGroup(accounts.accounts, balances, '64'),
          },
          investissement: {
            acquisitionsImmobilisations: this.calculateAccountGroup(accounts.accounts, balances, '21'),
            cessionsImmobilisations: this.calculateAccountGroup(accounts.accounts, balances, '485'),
          },
          financement: {
            emprunts: this.calculateAccountGroup(accounts.accounts, balances, '16'),
            remboursements: this.calculateAccountGroup(accounts.accounts, balances, '161'),
          },
        },
      };
    }

    // Structure selon IFRS
    return {
      operatingActivities: {
        receiptsFromCustomers: this.calculateAccountGroup(accounts.accounts, balances, '411'),
        paymentsToSuppliers: this.calculateAccountGroup(accounts.accounts, balances, '401'),
        employeeBenefitsPaid: this.calculateAccountGroup(accounts.accounts, balances, '661'),
        taxesPaid: this.calculateAccountGroup(accounts.accounts, balances, '64'),
      },
      investingActivities: {
        purchaseOfPPE: this.calculateAccountGroup(accounts.accounts, balances, '21'),
        proceedsFromSaleOfPPE: this.calculateAccountGroup(accounts.accounts, balances, '485'),
      },
      financingActivities: {
        proceedsFromBorrowings: this.calculateAccountGroup(accounts.accounts, balances, '16'),
        repaymentOfBorrowings: this.calculateAccountGroup(accounts.accounts, balances, '161'),
      },
    };
  }

  async generateGeneralLedger(
    companyId: string,
    fiscalYear: string,
    startDate: Date,
    endDate: Date,
  ) {
    const accounts = await this.accountService.findAll({ companyId });
    const journals = await Promise.all(
      accounts.accounts.map(account =>
        this.journalService.findByAccount(account.id, {
          fiscalYear,
          startDate,
          endDate,
        })
      )
    );

    return accounts.accounts.map((account, index) => ({
      account: {
        code: account.code,
        name: account.name,
        type: account.type,
      },
      entries: journals[index].map(journal => ({
        date: journal.date,
        reference: journal.reference,
        description: journal.description,
        debit: journal.totalDebit,
        credit: journal.totalCredit,
      })),
    }));
  }

  async generateTrialBalance(
    companyId: string,
    fiscalYear: string,
    asOfDate: Date,
  ) {
    const accounts = await this.accountService.findAll({ companyId });
    const balances = await Promise.all(
      accounts.accounts.map(account =>
        this.journalService.getAccountBalance(account.id, fiscalYear, companyId, asOfDate)
      )
    );

    return accounts.accounts.map((account, index) => ({
      account: {
        code: account.code,
        name: account.name,
        type: account.type,
      },
      balance: {
        debit: balances[index].debit,
        credit: balances[index].credit,
        balance: balances[index].balance,
      },
    }));
  }

  private calculateAccountGroup(accounts: any[], balances: any[], prefix: string): number {
    return accounts
      .filter(account => account.code.startsWith(prefix))
      .reduce((sum, account, index) => {
        const balance = balances[index];
        return sum + (balance.debit - balance.credit);
      }, 0);
  }
}
