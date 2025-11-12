import { IsString, IsEmail, IsEnum, IsOptional, IsUUID, IsBoolean, IsArray, IsObject, IsUrl, IsNumber, ValidateNested, IsDate, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { 
  AddressDto, 
  CoordinatesDto, 
  LocationDto, 
  BaseContactDto, 
  ApiResponseDto, 
  ApiErrorResponseDto, 
  PaginationDto,
  CustomerType, 
  CustomerStatus, 
  AccountType,
  CurrencyType
} from '../shared';
import { 
  CreateExtendedIdentificationDto, 
  UpdateExtendedIdentificationDto,
  ExtendedCompanyResponseDto,
  ValidationResultDto,
  CompletionStatusDto
} from './extended-company.dto';

// AddressDto maintenant importé de shared
// ContactsDto renommé vers BaseContactDto (importé de shared)
export class ContactsDto extends BaseContactDto {}

export class OwnerDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cv?: string;

  @IsOptional()
  @IsBoolean()
  hasOtherJob?: boolean;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  facebook?: string;
}

export class AssociateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsNumber()
  shares?: number;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

// CoordinatesDto et LocationDto maintenant importés de shared

export class ActivitiesDto {
  @IsOptional()
  @IsString()
  primary?: string;

  @IsOptional()
  @IsArray()
  secondary?: string[];
}

// NOUVEAU v2.1 - DTO pour secteurs d'activité étendus
export class ActivitiesExtendedDto {
  @IsString()
  secteurActivitePrincipal!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secteursActiviteSecondaires?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secteursPersonalises?: string[];

  // Compatibilité descendante
  @IsOptional()
  @ValidateNested()
  @Type(() => ActivitiesDto)
  activities?: ActivitiesDto;
}

export class CapitalDto {
  @IsOptional()
  @IsBoolean()
  isApplicable?: boolean;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class FinancialsDto {
  @IsOptional()
  @IsNumber()
  revenue?: number;

  @IsOptional()
  @IsNumber()
  netIncome?: number;

  @IsOptional()
  @IsNumber()
  totalAssets?: number;

  @IsOptional()
  @IsNumber()
  equity?: number;
}

export class AffiliationsDto {
  @IsOptional()
  @IsString()
  cnss?: string;

  @IsOptional()
  @IsString()
  inpp?: string;

  @IsOptional()
  @IsString()
  onem?: string;

  @IsOptional()
  @IsString()
  intraCoop?: string;

  @IsOptional()
  @IsString()
  interCoop?: string;

  @IsOptional()
  @IsArray()
  partners?: string[];
}

// NOUVEAU v2.1 - DTO pour actifs détaillés
export class AssetDataDto {
  @IsString()
  id!: string;

  @IsString()
  designation!: string;

  @IsEnum(['immobilier', 'vehicule', 'equipement', 'autre'])
  type!: 'immobilier' | 'vehicule' | 'equipement' | 'autre';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  prixAchat?: number;

  @IsOptional()
  @IsNumber()
  valeurActuelle?: number;

  @IsOptional()
  @IsEnum(CurrencyType)
  devise?: CurrencyType;

  @IsOptional()
  @IsString()
  dateAcquisition?: string;

  @IsOptional()
  @IsEnum(['neuf', 'excellent', 'bon', 'moyen', 'mauvais', 'deteriore'])
  etatActuel?: 'neuf' | 'excellent' | 'bon' | 'moyen' | 'mauvais' | 'deteriore';

  @IsOptional()
  @IsString()
  localisation?: string;

  @IsOptional()
  @IsString()
  marque?: string;

  @IsOptional()
  @IsString()
  modele?: string;

  @IsOptional()
  @IsNumber()
  quantite?: number;

  @IsOptional()
  @IsString()
  unite?: string;

  @IsOptional()
  @IsEnum(['propre', 'location', 'leasing', 'emprunt'])
  proprietaire?: 'propre' | 'location' | 'leasing' | 'emprunt';

  @IsOptional()
  @IsString()
  observations?: string;
}

// NOUVEAU v2.1 - DTO pour stocks et inventaires
export class StockDataDto {
  @IsString()
  id!: string;

  @IsString()
  designation!: string;

  @IsEnum(['matiere_premiere', 'produit_semi_fini', 'produit_fini', 'fourniture', 'emballage', 'autre'])
  categorie!: 'matiere_premiere' | 'produit_semi_fini' | 'produit_fini' | 'fourniture' | 'emballage' | 'autre';

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  quantiteStock!: number;

  @IsString()
  unite!: string;

  @IsOptional()
  @IsNumber()
  seuilMinimum?: number;

  @IsOptional()
  @IsNumber()
  seuilMaximum?: number;

  @IsNumber()
  coutUnitaire!: number;

  @IsNumber()
  valeurTotaleStock!: number;

  @IsEnum(CurrencyType)
  devise!: CurrencyType;

  @IsOptional()
  @IsString()
  dateDernierInventaire?: string;

  @IsOptional()
  @IsNumber()
  dureeRotationMoyenne?: number;

  @IsOptional()
  @IsString()
  datePeremption?: string;

  @IsOptional()
  @IsString()
  emplacement?: string;

  @IsOptional()
  @IsString()
  conditionsStockage?: string;

  @IsOptional()
  @IsString()
  fournisseurPrincipal?: string;

  @IsOptional()
  @IsString()
  numeroLot?: string;

  @IsOptional()
  @IsString()
  codeArticle?: string;

  @IsEnum(['excellent', 'bon', 'moyen', 'deteriore', 'perime'])
  etatStock!: 'excellent' | 'bon' | 'moyen' | 'deteriore' | 'perime';

  @IsOptional()
  @IsString()
  observations?: string;
}

export class CreateCompanyDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  legalForm?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  rccm?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  natId?: string;

  // Nouveaux champs v2.1
  @IsOptional()
  @ValidateNested()
  @Type(() => ActivitiesExtendedDto)
  activitiesExtended?: ActivitiesExtendedDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secteursPersnnalises?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CapitalDto)
  capital?: CapitalDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialsDto)
  financials?: FinancialsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AffiliationsDto)
  affiliations?: AffiliationsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactsDto)
  contacts?: ContactsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OwnerDto)
  owner?: OwnerDto;

  // Nouveau: Formulaire d'identification étendu pour les entreprises
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateExtendedIdentificationDto)
  extendedIdentification?: CreateExtendedIdentificationDto;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsUrl()
  facebookPage?: string;

  @IsOptional()
  @IsString()
  rccm?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssociateDto)
  associates?: AssociateDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ActivitiesDto)
  activities?: ActivitiesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CapitalDto)
  capital?: CapitalDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialsDto)
  financials?: FinancialsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AffiliationsDto)
  affiliations?: AffiliationsDto;

  // NOUVEAU v2.1 - Actifs détaillés et stocks
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetDataDto)
  equipment?: AssetDataDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetDataDto)
  vehicles?: AssetDataDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockDataDto)
  stocks?: StockDataDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ActivitiesExtendedDto)
  activitiesExtended?: ActivitiesExtendedDto;

  // Nouveau: Mise à jour du formulaire d'identification étendu
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateExtendedIdentificationDto)
  extendedIdentification?: UpdateExtendedIdentificationDto;
}

export class CompanyResponseDto {
  id!: string;
  name!: string;
  logo?: string;
  description?: string;
  legalForm?: string;
  industry?: string;
  size?: string;
  website?: string;
  facebookPage?: string;
  rccm?: string;
  taxId?: string;
  natId?: string;
  address?: AddressDto;
  locations?: LocationDto[];
  contacts?: ContactsDto;
  owner?: OwnerDto;
  associates?: AssociateDto[];
  activities?: ActivitiesDto;
  capital?: CapitalDto;
  financials?: FinancialsDto;
  affiliations?: AffiliationsDto;

  // NOUVEAU v2.1 - Secteurs d'activité étendus
  activitiesExtended?: ActivitiesExtendedDto;
  secteursPersnnalises?: string[];

  // NOUVEAU v2.1 - Actifs détaillés et stocks
  equipment?: AssetDataDto[];
  vehicles?: AssetDataDto[];
  stocks?: StockDataDto[];
  
  // Nouveau: Exposition du formulaire d'identification étendu
  extendedIdentification?: ExtendedCompanyResponseDto;
  
  subscription?: {
    plan?: {
      name?: string;
    };
    status?: string;
    currentPeriodEnd?: Date;
  };
  createdAt!: Date;
  updatedAt!: Date;
  createdBy?: string;
}

// DTOs pour la mise à jour des assets
export class UpdateAssetDataDto extends PartialType(AssetDataDto) {}

// DTO de réponse pour les assets
export class AssetResponseDto extends AssetDataDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsISO8601()
  createdAt?: string;

  @IsOptional()
  @IsISO8601()
  updatedAt?: string;
}

// DTOs pour la mise à jour des stocks
export class UpdateStockDataDto extends PartialType(StockDataDto) {}

// DTO de réponse pour les stocks
export class StockResponseDto extends StockDataDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsISO8601()
  createdAt?: string;

  @IsOptional()
  @IsISO8601()
  updatedAt?: string;
}

// ApiResponseDto, ApiErrorResponseDto et PaginationDto maintenant importés de shared
