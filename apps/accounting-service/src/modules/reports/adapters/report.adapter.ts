import { ReportType, ReportFormat, AccountingFramework, GenerateReportDto, ExportReportDto, ReportPeriodDto } from '../dtos/report.dto';
import { ApiReportType, ApiReportFormat, ApiGenerateReportDto, ApiExportReportDto } from '../dtos/api-report.dto';

/**
 * Adaptateur pour convertir les types de rapports entre le format interne (enum) et le format API
 */
export class ReportAdapter {
  /**
   * Convertit le type de rapport du format API vers le format interne
   * @param apiType Type de rapport au format API (balance, income, etc.)
   * @returns Type de rapport au format interne (enum ReportType)
   */
  static apiTypeToInternalType(apiType: string): ReportType {
    const mapping: Record<string, ReportType> = {
      'balance': ReportType.BALANCE_SHEET,
      'income': ReportType.INCOME_STATEMENT,
      'cashflow': ReportType.CASH_FLOW,
      'equity-changes': ReportType.EQUITY_CHANGES,
      'notes': ReportType.NOTES,
      'reconciliation': ReportType.RECONCILIATION,
      'analytical': ReportType.ANALYTICAL,
      'social': ReportType.SOCIAL,
      'statistics': ReportType.STATISTICS,
      'trial-balance': ReportType.TRIAL_BALANCE,
      'general-ledger': ReportType.GENERAL_LEDGER,
      'journal-book': ReportType.JOURNAL_BOOK,
    };

    return mapping[apiType] || ReportType.BALANCE_SHEET;
  }

  /**
   * Convertit le type de rapport du format interne vers le format API
   * @param internalType Type de rapport au format interne (enum ReportType)
   * @returns Type de rapport au format API (balance, income, etc.)
   */
  static internalTypeToApiType(internalType: ReportType): string {
    const mapping: Record<string, string> = {
      [ReportType.BALANCE_SHEET]: 'balance',
      [ReportType.INCOME_STATEMENT]: 'income',
      [ReportType.CASH_FLOW]: 'cashflow',
      [ReportType.EQUITY_CHANGES]: 'equity-changes',
      [ReportType.NOTES]: 'notes',
      [ReportType.RECONCILIATION]: 'reconciliation',
      [ReportType.ANALYTICAL]: 'analytical',
      [ReportType.SOCIAL]: 'social',
      [ReportType.STATISTICS]: 'statistics',
      [ReportType.TRIAL_BALANCE]: 'trial-balance',
      [ReportType.GENERAL_LEDGER]: 'general-ledger',
      [ReportType.JOURNAL_BOOK]: 'journal-book',
    };

    return mapping[internalType] || 'balance';
  }

  /**
   * Convertit le format de rapport du format API vers le format interne
   * @param apiFormat Format de rapport au format API (pdf, excel)
   * @returns Format de rapport au format interne (enum ReportFormat)
   */
  static apiFormatToInternalFormat(apiFormat: string): ReportFormat {
    const mapping: Record<string, ReportFormat> = {
      'pdf': ReportFormat.PDF,
      'excel': ReportFormat.EXCEL,
      'csv': ReportFormat.CSV,
    };

    return mapping[apiFormat] || ReportFormat.PDF;
  }

  /**
   * Convertit le format de rapport du format interne vers le format API
   * @param internalFormat Format de rapport au format interne (enum ReportFormat)
   * @returns Format de rapport au format API (pdf, excel)
   */
  static internalFormatToApiFormat(internalFormat: ReportFormat): string {
    const mapping: Record<string, string> = {
      [ReportFormat.PDF]: 'pdf',
      [ReportFormat.EXCEL]: 'excel',
      [ReportFormat.CSV]: 'csv',
    };

    return mapping[internalFormat] || 'pdf';
  }
  /**
   * Adapte la structure de la réponse au format attendu par l'API
   * @param internalResponse Réponse au format interne
   * @param reportType Type de rapport
   * @returns Réponse au format API
   */
  static adaptResponseToApiFormat(internalResponse: any, reportType: ReportType): any {
    // Si la réponse est déjà adaptée, on la retourne telle quelle
    if (!internalResponse?.reportData) {
      return internalResponse;
    }

    // Adaptation selon le type de rapport
    switch (reportType) {
      case ReportType.BALANCE_SHEET:
        return internalResponse.reportData.balanceSheet;
      case ReportType.INCOME_STATEMENT:
        return internalResponse.reportData.incomeStatement;
      case ReportType.CASH_FLOW:
        return internalResponse.reportData.cashFlow;
      default:
        return internalResponse.reportData;
    }
  }

  /**
   * Convertit un DTO de génération de rapport du format API vers le format interne
   * @param apiDto DTO au format API
   * @returns DTO au format interne
   */
  static apiGenerateDtoToInternalDto(apiDto: ApiGenerateReportDto): GenerateReportDto {
    const period = new ReportPeriodDto();
    // On utilise la date fournie comme date de fin, et on calcule la date de début (premier jour du mois)
    const endDate = new Date(apiDto.date);
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    period.endDate = endDate;
    period.startDate = startDate;

    const internalDto = new GenerateReportDto();
    internalDto.reportType = this.apiTypeToInternalType(apiDto.type);
    internalDto.period = period;
    internalDto.currency = apiDto.currency || 'CDF'; // Devise par défaut
    internalDto.framework = AccountingFramework.SYSCOHADA; // Cadre comptable par défaut
    internalDto.compareN1 = apiDto.comparative || false;
    internalDto.includeAnalytics = apiDto.includeNotes || false;
    internalDto.options = apiDto.filters || {};

    return internalDto;
  }

  /**
   * Convertit un DTO d'exportation de rapport du format API vers le format interne
   * @param apiDto DTO au format API
   * @returns DTO au format interne
   */
  static apiExportDtoToInternalDto(apiDto: ApiExportReportDto): ExportReportDto {
    const internalDto = new ExportReportDto();
    internalDto.reportType = this.apiTypeToInternalType(apiDto.type);
    internalDto.format = this.apiFormatToInternalFormat(apiDto.format);
    internalDto.fiscalYear = new Date().getFullYear().toString(); // Par défaut, l'année fiscale courante
    internalDto.options = {
      data: apiDto.data,
      title: apiDto.title,
      organization: apiDto.organization,
      generatedBy: apiDto.generatedBy,
      isAudited: apiDto.isAudited,
      currency: apiDto.currency
    };

    return internalDto;
  }

  /**
   * Crée une réponse d'exportation au format API
   * @param downloadUrl URL de téléchargement du rapport exporté
   * @returns Réponse au format API
   */
  static createApiExportResponse(downloadUrl: string): any {
    return { downloadUrl };
  }
}
