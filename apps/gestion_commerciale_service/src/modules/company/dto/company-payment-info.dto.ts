import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BankAccountInfoDto {
  @ApiProperty({ description: 'Numéro de compte bancaire', example: '1234567890123' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ description: 'Nom du titulaire du compte', example: 'Ma Société SARL' })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({ description: 'Nom de la banque', example: 'Banque Centrale du Congo' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiPropertyOptional({ description: 'Code de la banque', example: 'BCC001' })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional({ description: 'Code de l\'agence', example: 'KIN001' })
  @IsOptional()
  @IsString()
  branchCode?: string;

  @ApiPropertyOptional({ description: 'Code SWIFT', example: 'BCDCCDKX' })
  @IsOptional()
  @IsString()
  swiftCode?: string;

  @ApiPropertyOptional({ description: 'RIB (Relevé d\'Identité Bancaire)', example: 'BCC-KIN-1234567890123-45' })
  @IsOptional()
  @IsString()
  rib?: string;

  @ApiProperty({ description: 'Compte par défaut', example: true })
  @IsBoolean()
  isDefault: boolean;

  @ApiProperty({ description: 'Statut du compte', enum: ['active', 'inactive', 'suspended'], example: 'active' })
  @IsEnum(['active', 'inactive', 'suspended'])
  status: 'active' | 'inactive' | 'suspended';
}

export class MobileMoneyAccountDto {
  @ApiProperty({ description: 'Numéro de téléphone mobile money', example: '+243999123456' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'Nom du titulaire du compte', example: 'Jean Dupont' })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({ description: 'Code de l\'opérateur', enum: ['AM', 'OM', 'WAVE', 'MP', 'AF'], example: 'OM' })
  @IsEnum(['AM', 'OM', 'WAVE', 'MP', 'AF'])
  operator: 'AM' | 'OM' | 'WAVE' | 'MP' | 'AF';

  @ApiProperty({ description: 'Nom de l\'opérateur', example: 'Orange Money' })
  @IsString()
  @IsNotEmpty()
  operatorName: string;

  @ApiProperty({ description: 'Compte par défaut', example: false })
  @IsBoolean()
  isDefault: boolean;

  @ApiProperty({ description: 'Statut du compte', enum: ['active', 'inactive', 'suspended'], example: 'active' })
  @IsEnum(['active', 'inactive', 'suspended'])
  status: 'active' | 'inactive' | 'suspended';

  @ApiProperty({ description: 'Statut de vérification', enum: ['pending', 'verified', 'failed'], example: 'verified' })
  @IsEnum(['pending', 'verified', 'failed'])
  verificationStatus: 'pending' | 'verified' | 'failed';
}

export class PaymentPreferencesDto {
  @ApiProperty({ description: 'Méthode de paiement préférée', enum: ['bank', 'mobile_money'], example: 'mobile_money' })
  @IsEnum(['bank', 'mobile_money'])
  preferredMethod: 'bank' | 'mobile_money';

  @ApiPropertyOptional({ description: 'ID du compte bancaire par défaut' })
  @IsOptional()
  @IsString()
  defaultBankAccountId?: string;

  @ApiPropertyOptional({ description: 'ID du compte mobile money par défaut' })
  @IsOptional()
  @IsString()
  defaultMobileMoneyAccountId?: string;

  @ApiProperty({ description: 'Autoriser les paiements partiels', example: true })
  @IsBoolean()
  allowPartialPayments: boolean;

  @ApiProperty({ description: 'Autoriser les paiements anticipés', example: true })
  @IsBoolean()
  allowAdvancePayments: boolean;
}

export class UpdateCompanyPaymentInfoDto {
  @ApiPropertyOptional({ description: 'Comptes bancaires de l\'entreprise', type: [BankAccountInfoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BankAccountInfoDto)
  bankAccounts?: BankAccountInfoDto[];

  @ApiPropertyOptional({ description: 'Comptes mobile money de l\'entreprise', type: [MobileMoneyAccountDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MobileMoneyAccountDto)
  mobileMoneyAccounts?: MobileMoneyAccountDto[];

  @ApiPropertyOptional({ description: 'Préférences de paiement', type: PaymentPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentPreferencesDto)
  paymentPreferences?: PaymentPreferencesDto;
}

export class AddBankAccountDto {
  @ApiProperty({ description: 'ID de l\'entreprise' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Informations du compte bancaire', type: BankAccountInfoDto })
  @ValidateNested()
  @Type(() => BankAccountInfoDto)
  bankAccount: BankAccountInfoDto;
}

export class AddMobileMoneyAccountDto {
  @ApiProperty({ description: 'ID de l\'entreprise' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Informations du compte mobile money', type: MobileMoneyAccountDto })
  @ValidateNested()
  @Type(() => MobileMoneyAccountDto)
  mobileMoneyAccount: MobileMoneyAccountDto;
}

export class VerifyMobileMoneyAccountDto {
  @ApiProperty({ description: 'ID de l\'entreprise' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Numéro de téléphone à vérifier' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'Code de vérification reçu par SMS' })
  @IsString()
  @IsNotEmpty()
  verificationCode: string;
}

export class CompanyPaymentInfoResponseDto {
  @ApiProperty({ description: 'ID de l\'entreprise' })
  id: string;

  @ApiProperty({ description: 'Nom de l\'entreprise' })
  name: string;

  @ApiProperty({ description: 'Comptes bancaires', type: [BankAccountInfoDto] })
  bankAccounts: BankAccountInfoDto[];

  @ApiProperty({ description: 'Comptes mobile money', type: [MobileMoneyAccountDto] })
  mobileMoneyAccounts: MobileMoneyAccountDto[];

  @ApiProperty({ description: 'Préférences de paiement', type: PaymentPreferencesDto })
  paymentPreferences: PaymentPreferencesDto;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  updatedAt: Date;
}