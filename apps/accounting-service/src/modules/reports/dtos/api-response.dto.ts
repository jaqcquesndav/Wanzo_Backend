import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Formats de réponse pour les états financiers selon la documentation API
 */

// Format de réponse pour une ligne de bilan
export class BalanceSheetLineDto {
  @ApiProperty({ description: 'Code du compte' })
  code!: string;

  @ApiProperty({ description: 'Libellé du compte' })
  label!: string;

  @ApiProperty({ description: 'Montant brut', example: 50000 })
  brut?: number;

  @ApiProperty({ description: 'Amortissements et provisions', example: 20000 })
  amort?: number;

  @ApiProperty({ description: 'Montant net', example: 30000 })
  net!: number;

  @ApiPropertyOptional({ description: 'Montant net de l\'année précédente', example: 35000 })
  netN1?: number;
}

// Format de réponse pour une section du bilan
export class BalanceSheetSectionDto {
  @ApiProperty({ description: 'Lignes de détail', type: [BalanceSheetLineDto] })
  items?: BalanceSheetLineDto[];

  @ApiProperty({ description: 'Total de la section', type: BalanceSheetLineDto })
  total!: BalanceSheetLineDto;
}

// Format de réponse pour le bilan complet
export class BalanceSheetResponseDto {
  @ApiProperty({ description: 'Actifs immobilisés', type: BalanceSheetSectionDto })
  fixedAssets!: BalanceSheetSectionDto;

  @ApiProperty({ description: 'Actifs circulants', type: BalanceSheetSectionDto })
  currentAssets!: BalanceSheetSectionDto;

  @ApiProperty({ description: 'Actifs de trésorerie', type: BalanceSheetSectionDto })
  treasuryAssets!: BalanceSheetSectionDto;

  @ApiProperty({ description: 'Total général', type: BalanceSheetLineDto })
  grandTotal!: BalanceSheetLineDto;

  @ApiProperty({ description: 'Capitaux propres', type: BalanceSheetSectionDto })
  equity!: BalanceSheetSectionDto;

  @ApiProperty({ description: 'Dettes', type: BalanceSheetSectionDto })
  liabilities!: BalanceSheetSectionDto;
}

// Format de réponse pour une ligne du compte de résultat
export class IncomeStatementLineDto {
  @ApiProperty({ description: 'Code du compte' })
  code!: string;

  @ApiProperty({ description: 'Libellé du compte' })
  label!: string;

  @ApiProperty({ description: 'Montant', example: 1200000 })
  amount!: number;

  @ApiPropertyOptional({ description: 'Montant de l\'année précédente', example: 1100000 })
  amountN1?: number;
}

// Format de réponse pour une section du compte de résultat
export class IncomeStatementSectionDto {
  @ApiProperty({ description: 'Lignes de détail', type: [IncomeStatementLineDto] })
  items?: IncomeStatementLineDto[];

  @ApiProperty({ description: 'Total de la section', type: IncomeStatementLineDto })
  total!: IncomeStatementLineDto;
}

// Format de réponse pour le compte de résultat complet
export class IncomeStatementResponseDto {
  @ApiProperty({ description: 'Produits d\'exploitation', type: IncomeStatementSectionDto })
  operatingRevenue!: IncomeStatementSectionDto;

  @ApiProperty({ description: 'Charges d\'exploitation', type: IncomeStatementSectionDto })
  operatingExpenses!: IncomeStatementSectionDto;

  @ApiProperty({ description: 'Résultat d\'exploitation', type: IncomeStatementLineDto })
  operatingResult!: IncomeStatementLineDto;

  @ApiProperty({ description: 'Résultat financier', type: IncomeStatementLineDto })
  financialResult!: IncomeStatementLineDto;

  @ApiPropertyOptional({ description: 'Résultat hors activités ordinaires', type: IncomeStatementLineDto })
  extraordinaryResult?: IncomeStatementLineDto;

  @ApiProperty({ description: 'Impôts sur les bénéfices', type: IncomeStatementLineDto })
  taxOnProfit!: IncomeStatementLineDto;

  @ApiProperty({ description: 'Résultat net', type: IncomeStatementLineDto })
  netResult!: IncomeStatementLineDto;
}

// Format de réponse pour une section du tableau des flux de trésorerie
export class CashFlowSectionDto {
  // Détails des flux
  [key: string]: number | Record<string, any>;

  @ApiProperty({ description: 'Flux de trésorerie net', example: 310000 })
  netCashFlow!: number;
}

// Format de réponse pour le tableau des flux de trésorerie complet
export class CashFlowResponseDto {
  @ApiProperty({ description: 'Activités d\'exploitation', type: CashFlowSectionDto })
  operatingActivities!: CashFlowSectionDto;

  @ApiProperty({ description: 'Activités d\'investissement', type: CashFlowSectionDto })
  investingActivities!: CashFlowSectionDto;

  @ApiProperty({ description: 'Activités de financement', type: CashFlowSectionDto })
  financingActivities!: CashFlowSectionDto;

  @ApiProperty({ description: 'Variation nette de trésorerie', example: 160000 })
  netChangeInCash!: number;

  @ApiProperty({ description: 'Solde initial de trésorerie', example: 100000 })
  beginningCashBalance!: number;

  @ApiProperty({ description: 'Solde final de trésorerie', example: 260000 })
  endingCashBalance!: number;
}

// Format de réponse pour le tableau de variation des capitaux propres
export class EquityChangesResponseDto {
  @ApiProperty({ description: 'Solde d\'ouverture', type: Object })
  openingBalance!: Record<string, number>;

  @ApiProperty({ description: 'Variations', type: Object })
  changes!: Record<string, number>;

  @ApiProperty({ description: 'Solde de clôture', type: Object })
  closingBalance!: Record<string, number>;
}
