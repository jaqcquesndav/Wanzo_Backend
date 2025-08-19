import { IsString, IsDate, IsOptional, IsNumber, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Données de base des transactions
export class TransactionDto {
  @ApiProperty({ description: 'Transaction date' })
  @IsDate()
  @Type(() => Date)
  date!: Date;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  amount!: number;

  @ApiProperty({ description: 'Transaction type' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Transaction category' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ description: 'Transaction description' })
  @IsOptional()
  @IsString()
  description?: string;
}

// Flux entrants détaillés
export class CashInflowDto {
  @ApiProperty({ description: 'Sales revenue transactions', type: [TransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  sales!: TransactionDto[];

  @ApiProperty({ description: 'Bank transfer transactions', type: [TransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  bankTransfers!: TransactionDto[];

  @ApiProperty({ description: 'Investment income transactions', type: [TransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  investments!: TransactionDto[];

  @ApiProperty({ description: 'Financing transactions', type: [TransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  financing!: TransactionDto[];
}

// Flux sortants détaillés
export class CashOutflowDto {
  @ApiProperty({ description: 'Cost of goods and services', type: [TransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  costOfGoods!: TransactionDto[];

  @ApiProperty({ description: 'Variable costs', type: [TransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  variableCosts!: TransactionDto[];

  @ApiProperty({ description: 'Fixed costs', type: [TransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  fixedCosts!: TransactionDto[];

  @ApiProperty({ description: 'Investment and financing outflows', type: [TransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  investmentFinancing!: TransactionDto[];
}

// Solde de trésorerie
export class CashBalanceDto {
  @ApiProperty({ description: 'Daily balances for the month' })
  @IsArray()
  @IsNumber({}, { each: true })
  dailyBalances!: number[];

  @ApiProperty({ description: 'Monthly average balance' })
  @IsNumber()
  monthlyAverage!: number;

  @ApiProperty({ description: 'Minimum balance' })
  @IsNumber()
  minimum!: number;

  @ApiProperty({ description: 'Maximum balance' })
  @IsNumber()
  maximum!: number;
}

// Données financières pour standardisation
export class FinancialMetricsDto {
  @ApiProperty({ description: 'Total revenue' })
  @IsNumber()
  revenue!: number;

  @ApiProperty({ description: 'Total assets' })
  @IsNumber()
  totalAssets!: number;

  @ApiProperty({ description: 'Outstanding loans' })
  @IsNumber()
  outstandingLoans!: number;

  @ApiProperty({ description: 'Current ratio' })
  @IsNumber()
  currentRatio!: number;

  @ApiProperty({ description: 'Quick ratio' })
  @IsNumber()
  quickRatio!: number;

  @ApiProperty({ description: 'Debt to equity ratio' })
  @IsNumber()
  debtToEquity!: number;

  @ApiProperty({ description: 'Operating margin' })
  @IsNumber()
  operatingMargin!: number;
}

// DTO principal pour le calcul du score
export class CalculateCreditScoreDto {
  @ApiProperty({ description: 'Company ID' })
  @IsString()
  companyId!: string;

  @ApiProperty({ description: 'Analysis period start date' })
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({ description: 'Analysis period end date' })
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  @ApiProperty({ description: 'Cash inflows by category' })
  @ValidateNested()
  @Type(() => CashInflowDto)
  cashInflows!: CashInflowDto;

  @ApiProperty({ description: 'Cash outflows by category' })
  @ValidateNested()
  @Type(() => CashOutflowDto)
  cashOutflows!: CashOutflowDto;

  @ApiProperty({ description: 'Cash balance data' })
  @ValidateNested()
  @Type(() => CashBalanceDto)
  cashBalance!: CashBalanceDto;

  @ApiProperty({ description: 'Financial metrics for standardization' })
  @ValidateNested()
  @Type(() => FinancialMetricsDto)
  financialMetrics!: FinancialMetricsDto;

  @ApiPropertyOptional({ description: 'Additional business context' })
  @IsOptional()
  @IsObject()
  businessContext?: {
    age: number;
    sector: string;
    employeeCount: number;
    previousLoans?: number;
    paymentHistory?: number;
  };
}

export class CreditScoreResponseDto {
  @ApiProperty({ description: 'Overall credit score (0-100)' })
  score!: number;

  @ApiProperty({ description: 'Score components' })
  components!: {
    cashFlowQuality: number;
    businessStability: number;
    financialHealth: number;
    paymentBehavior: number;
    growthTrend: number;
  };

  @ApiProperty({ description: 'Risk assessment' })
  riskAssessment!: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };

  @ApiProperty({ description: 'Score metadata' })
  metadata!: {
    modelVersion: string;
    calculatedAt: Date;
    validUntil: Date;
    confidenceScore: number;
    dataQualityScore: number;
  };
}
