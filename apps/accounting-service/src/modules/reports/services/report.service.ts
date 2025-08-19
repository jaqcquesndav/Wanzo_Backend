import { Injectable, Logger } from '@nestjs/common';
import { JournalService } from '../../journals/services/journal.service';
import { AccountService } from '../../accounts/services/account.service';
import { GenerateReportDto, ExportReportDto, ReportType, AccountingFramework } from '../dtos/report.dto';
import { Account, AccountType } from '../../accounts/entities/account.entity';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private journalService: JournalService,
    private accountService: AccountService,
  ) {}

  async generateReport(reportDto: GenerateReportDto): Promise<any> {
    this.logger.debug(`Generating ${reportDto.reportType} report`);

    switch (reportDto.reportType) {
      case ReportType.BALANCE_SHEET:
        return this.generateBalanceSheet(reportDto);
      case ReportType.INCOME_STATEMENT:
        return this.generateIncomeStatement(reportDto);
      case ReportType.CASH_FLOW:
        return this.generateCashFlow(reportDto);
      case ReportType.TRIAL_BALANCE:
        return this.generateTrialBalance(reportDto);
      default:
        throw new Error(`Unsupported report type: ${reportDto.reportType}`);
    }
  }

  private async generateBalanceSheet(reportDto: GenerateReportDto): Promise<any> {
    const accounts = await this.accountService.findAll({
      type: AccountType.ASSET,
    });

    const balanceSheet = {
      fiscalYear: '2024',
      company: {
        name: 'Entreprise XYZ',
        logo: 'https://res.cloudinary.com/example/image/upload/company-logo.jpg',
        date: reportDto.period.endDate,
        rccm: 'CD/GOM/12345',
        idnat: '123456789',
        nif: 'CD987654321',
        creditRating: 'A+',
        esgCode: 'ESG-2024-001',
        financialScore: '85',
        audited: true,
        auditorCode: 'AUD-001',
        generatedDate: new Date(),
        generatedBy: 'John Doe',
        role: 'Finance Manager'
      },
      reportData: {
        balanceSheet: {
          fixedAssets: {
            intangibleAssets: [
              { code: '21', label: 'Immobilisations incorporelles', brut: 5000000, amort: 1000000, net: 4000000, netN1: 3500000 }
            ],
            tangibleAssets: [
              { code: '22', label: 'Terrains', brut: 25000000, net: 25000000, netN1: 25000000 }
            ],
            total: { code: '20', label: 'Total Actif immobilisé', brut: 105000000, amort: 16000000, net: 89000000, netN1: 93000000 }
          },
          currentAssets: {
            inventory: [
              { code: '31', label: 'Stocks marchandises', brut: 20000000, amort: 1000000, net: 19000000, netN1: 17500000 }
            ],
            total: { code: '40', label: 'Total Actif circulant', brut: 60000000, amort: 3000000, net: 57000000, netN1: 52000000 }
          },
          grandTotal: { code: '1', label: 'TOTAL ACTIF', brut: 186000000, amort: 19000000, net: 167000000, netN1: 161800000 }
        }
      }
    };

    return balanceSheet;
  }

  private async generateIncomeStatement(reportDto: GenerateReportDto): Promise<any> {
    const incomeStatement = {
      fiscalYear: '2024',
      company: {
        name: 'Entreprise XYZ',
        date: reportDto.period.endDate,
      },
      reportData: {
        revenue: {
          sales: { code: '70', label: 'Ventes de marchandises', current: 50000000, previous: 45000000 },
          total: { code: 'TR', label: 'Total Revenus', current: 50000000, previous: 45000000 }
        },
        expenses: {
          cogs: { code: '60', label: 'Achats de marchandises', current: 30000000, previous: 28000000 },
          total: { code: 'TE', label: 'Total Charges', current: 35000000, previous: 32000000 }
        },
        netIncome: { code: 'NI', label: 'Résultat Net', current: 15000000, previous: 13000000 }
      }
    };

    return incomeStatement;
  }

  private async generateCashFlow(reportDto: GenerateReportDto): Promise<any> {
    const cashFlow = {
      fiscalYear: '2024',
      company: {
        name: 'Entreprise XYZ',
        date: reportDto.period.endDate,
      },
      reportData: {
        operatingActivities: {
          netIncome: { code: 'NI', label: 'Résultat net', amount: 15000000 },
          adjustments: [
            { code: 'DA', label: 'Dotations aux amortissements', amount: 5000000 },
            { code: 'CWC', label: 'Variation du BFR', amount: -2000000 }
          ],
          total: { code: 'OCF', label: 'Flux de trésorerie d\'exploitation', amount: 18000000 }
        },
        investingActivities: {
          total: { code: 'ICF', label: 'Flux de trésorerie d\'investissement', amount: -10000000 }
        },
        financingActivities: {
          total: { code: 'FCF', label: 'Flux de trésorerie de financement', amount: -5000000 }
        },
        netCashFlow: { code: 'NCF', label: 'Variation nette de trésorerie', amount: 3000000 }
      }
    };

    return cashFlow;
  }

  private async generateTrialBalance(reportDto: GenerateReportDto): Promise<any> {
    const trialBalance = {
      fiscalYear: '2024',
      company: {
        name: 'Entreprise XYZ',
        date: reportDto.period.endDate,
      },
      reportData: {
        accounts: [
          {
            code: '411000',
            label: 'Clients',
            openingDebit: 0,
            openingCredit: 0,
            periodDebit: 1180000,
            periodCredit: 1180000,
            closingDebit: 0,
            closingCredit: 0
          },
          {
            code: '512000',
            label: 'Banques',
            openingDebit: 500000,
            openingCredit: 0,
            periodDebit: 1180000,
            periodCredit: 750000,
            closingDebit: 930000,
            closingCredit: 0
          }
        ],
        totals: {
          openingDebit: 500000,
          openingCredit: 0,
          periodDebit: 2360000,
          periodCredit: 1930000,
          closingDebit: 930000,
          closingCredit: 0
        }
      }
    };

    return trialBalance;
  }

  async exportReport(exportDto: ExportReportDto): Promise<string> {
    this.logger.debug(`Exporting ${exportDto.reportType} report in ${exportDto.format} format`);

    // Simuler la génération d'un fichier
    const fileName = `${exportDto.reportType}_${exportDto.fiscalYear}.${exportDto.format}`;
    const downloadUrl = `https://example.com/reports/${fileName}`;

    return downloadUrl;
  }
}
