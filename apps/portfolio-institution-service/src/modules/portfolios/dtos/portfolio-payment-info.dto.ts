import { IsString, IsOptional, IsBoolean, IsEnum, IsPhoneNumber, IsNotEmpty, IsDateString, ValidateNested, IsObject, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export enum MobileMoneyOperator {
  AM = 'AM',
  OM = 'OM',
  WAVE = 'WAVE',
  MP = 'MP',
  AF = 'AF'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed'
}

export enum PaymentMethod {
  BANK = 'bank',
  MOBILE_MONEY = 'mobile_money'
}

/**
 * DTO pour les informations d'un compte bancaire du gestionnaire de portefeuille
 */
export class PortfolioBankAccountDto {
  @ApiProperty({
    description: 'Unique identifier for the bank account',
    example: 'ACC-1234567890-ABC123'
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Bank name',
    example: 'Bank of Kinshasa'
  })
  @IsNotEmpty()
  @IsString()
  bankName: string;

  @ApiProperty({
    description: 'Bank account number',
    example: '1234567890123'
  })
  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @ApiProperty({
    description: 'Account holder name (should match portfolio manager name)',
    example: 'John Doe'
  })
  @IsNotEmpty()
  @IsString()
  accountHolderName: string;

  @ApiProperty({
    description: 'Bank SWIFT/BIC code',
    example: 'BOKFCDKI',
    required: false
  })
  @IsOptional()
  @IsString()
  swiftCode?: string;

  @ApiProperty({
    description: 'IBAN if applicable',
    example: 'CD1234567890123456789012',
    required: false
  })
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiProperty({
    description: 'Bank branch code',
    example: '001',
    required: false
  })
  @IsOptional()
  @IsString()
  branchCode?: string;

  @ApiProperty({
    description: 'Bank branch address',
    example: 'Kinshasa Central Branch',
    required: false
  })
  @IsOptional()
  @IsString()
  branchAddress?: string;

  @ApiProperty({
    description: 'Whether this is the default bank account',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isDefault?: boolean = false;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-15T10:00:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  createdAt?: Date;

  @ApiProperty({
    description: 'Account last update date',
    example: '2024-01-15T10:00:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: Date;
}

/**
 * DTO pour les informations d'un compte mobile money du gestionnaire de portefeuille
 */
export class PortfolioMobileMoneyAccountDto {
  @ApiProperty({
    description: 'Unique identifier for the mobile money account',
    example: 'ACC-1234567890-MMA123'
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Mobile money operator',
    enum: MobileMoneyOperator,
    example: MobileMoneyOperator.AM
  })
  @IsEnum(MobileMoneyOperator)
  operator: MobileMoneyOperator;

  @ApiProperty({
    description: 'Phone number associated with the mobile money account',
    example: '+243901234567'
  })
  @IsPhoneNumber('CD')
  phoneNumber: string;

  @ApiProperty({
    description: 'Account holder name (should match portfolio manager name)',
    example: 'John Doe'
  })
  @IsNotEmpty()
  @IsString()
  accountHolderName: string;

  @ApiProperty({
    description: 'Whether this is the default mobile money account',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isDefault?: boolean = false;

  @ApiProperty({
    description: 'Account verification status',
    enum: VerificationStatus,
    example: VerificationStatus.VERIFIED,
    default: VerificationStatus.PENDING
  })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus = VerificationStatus.PENDING;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-15T10:00:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  createdAt?: Date;

  @ApiProperty({
    description: 'Account last update date',
    example: '2024-01-15T10:00:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: Date;
}

/**
 * DTO pour les préférences de paiement du gestionnaire de portefeuille
 */
export class PortfolioPaymentPreferencesDto {
  @ApiProperty({
    description: 'Preferred payment method',
    enum: PaymentMethod,
    example: PaymentMethod.BANK,
    default: PaymentMethod.BANK
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  preferredMethod?: PaymentMethod = PaymentMethod.BANK;

  @ApiProperty({
    description: 'Default bank account number (if bank is preferred)',
    example: '1234567890123',
    required: false
  })
  @IsOptional()
  @IsString()
  defaultBankAccount?: string;

  @ApiProperty({
    description: 'Default mobile money phone number (if mobile money is preferred)',
    example: '+243901234567',
    required: false
  })
  @IsOptional()
  @IsString()
  defaultMobileMoneyAccount?: string;

  @ApiProperty({
    description: 'Allow automatic payments',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  allowAutomaticPayments?: boolean = true;

  @ApiProperty({
    description: 'Minimum payment amount threshold',
    example: 10000,
    required: false
  })
  @IsOptional()
  minimumPaymentThreshold?: number;

  @ApiProperty({
    description: 'Payment notification preferences',
    example: { sms: true, email: true, push: false },
    required: false
  })
  @IsOptional()
  @IsObject()
  notificationPreferences?: {
    sms?: boolean;
    email?: boolean;
    push?: boolean;
  };
}

/**
 * DTO pour mettre à jour les informations de paiement du gestionnaire de portefeuille
 */
export class UpdatePortfolioPaymentInfoDto {
  @ApiProperty({
    description: 'Bank accounts information',
    type: [PortfolioBankAccountDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioBankAccountDto)
  bankAccounts?: PortfolioBankAccountDto[];

  @ApiProperty({
    description: 'Mobile money accounts information',
    type: [PortfolioMobileMoneyAccountDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioMobileMoneyAccountDto)
  mobileMoneyAccounts?: PortfolioMobileMoneyAccountDto[];

  @ApiProperty({
    description: 'Payment preferences',
    type: PortfolioPaymentPreferencesDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PortfolioPaymentPreferencesDto)
  paymentPreferences?: PortfolioPaymentPreferencesDto;
}

/**
 * DTO pour ajouter un compte bancaire au gestionnaire de portefeuille
 */
export class AddPortfolioBankAccountDto {
  @ApiProperty({
    description: 'Portfolio ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsString()
  portfolioId: string;

  @ApiProperty({
    description: 'Bank account information',
    type: PortfolioBankAccountDto
  })
  @ValidateNested()
  @Type(() => PortfolioBankAccountDto)
  bankAccount: PortfolioBankAccountDto;
}

/**
 * DTO pour ajouter un compte mobile money au gestionnaire de portefeuille
 */
export class AddPortfolioMobileMoneyAccountDto {
  @ApiProperty({
    description: 'Portfolio ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsString()
  portfolioId: string;

  @ApiProperty({
    description: 'Mobile money account information',
    type: PortfolioMobileMoneyAccountDto
  })
  @ValidateNested()
  @Type(() => PortfolioMobileMoneyAccountDto)
  mobileMoneyAccount: PortfolioMobileMoneyAccountDto;
}

/**
 * DTO pour vérifier un compte mobile money du gestionnaire de portefeuille
 */
export class VerifyPortfolioMobileMoneyAccountDto {
  @ApiProperty({
    description: 'Portfolio ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsString()
  portfolioId: string;

  @ApiProperty({
    description: 'Phone number to verify',
    example: '+243901234567'
  })
  @IsPhoneNumber('CD')
  phoneNumber: string;

  @ApiProperty({
    description: 'SMS verification code',
    example: '123456'
  })
  @IsNotEmpty()
  @IsString()
  verificationCode: string;
}

/**
 * DTO de réponse avec les informations de paiement du gestionnaire de portefeuille
 */
export class PortfolioPaymentInfoResponseDto {
  @ApiProperty({
    description: 'Portfolio ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Portfolio manager name',
    example: 'John Doe'
  })
  managerName: string;

  @ApiProperty({
    description: 'Portfolio title',
    example: 'SME Financing Portfolio'
  })
  title: string;

  @ApiProperty({
    description: 'Bank accounts',
    type: [PortfolioBankAccountDto]
  })
  bankAccounts: PortfolioBankAccountDto[];

  @ApiProperty({
    description: 'Mobile money accounts',
    type: [PortfolioMobileMoneyAccountDto]
  })
  mobileMoneyAccounts: PortfolioMobileMoneyAccountDto[];

  @ApiProperty({
    description: 'Payment preferences',
    type: PortfolioPaymentPreferencesDto
  })
  paymentPreferences: PortfolioPaymentPreferencesDto;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:00:00Z'
  })
  updatedAt: Date;
}