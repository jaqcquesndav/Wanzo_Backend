import { IsString, IsOptional, IsEmail, IsEnum, IsArray, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTOs basés sur la documentation 05-institutions-financieres.md
 * Source de vérité : Documentation officielle v2.0
 */

// Types d'institutions (Conforme au formulaire documenté)
export enum FinancialInstitutionType {
  BANQUE = 'BANQUE',
  MICROFINANCE = 'MICROFINANCE',
  COOPEC = 'COOPEC',
  FOND_GARANTIE = 'FOND_GARANTIE',
  ENTREPRISE_FINANCIERE = 'ENTREPRISE_FINANCIERE',
  FOND_CAPITAL_INVESTISSEMENT = 'FOND_CAPITAL_INVESTISSEMENT',
  FOND_IMPACT = 'FOND_IMPACT',
  AUTRE = 'AUTRE'
}

export enum Currency {
  USD = 'USD',
  CDF = 'CDF',
  EUR = 'EUR'
}

export enum SupervisoryAuthority {
  BCC = 'bcc',
  ARCA = 'arca',
  ASMF = 'asmf',
  OTHER = 'other'
}

/**
 * DTO principal Financial Institution (100% conforme à la documentation)
 */
export class FinancialInstitutionResponseDto {
  @ApiProperty({ description: 'Identifiant unique' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'ID utilisateur propriétaire' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'Customer associé', required: false })
  @IsOptional()
  customer?: any;

  // === IDENTIFICATION INSTITUTIONNELLE (exactement comme dans le formulaire) ===
  @ApiProperty({ description: 'Dénomination sociale' })
  @IsString()
  denominationSociale!: string;

  @ApiProperty({ description: 'Sigle/Acronyme' })
  @IsString()
  sigle!: string;

  @ApiProperty({ description: 'Type d\'institution', enum: FinancialInstitutionType })
  @IsEnum(FinancialInstitutionType)
  typeInstitution!: FinancialInstitutionType;

  @ApiProperty({ description: 'Sous-catégorie' })
  @IsString()
  sousCategorie!: string;

  @ApiProperty({ description: 'Date de création' })
  @IsDateString()
  dateCreation!: string;

  @ApiProperty({ description: 'Pays d\'origine' })
  @IsString()
  paysOrigine!: string;

  @ApiProperty({ description: 'Statut juridique' })
  @IsString()
  statutJuridique!: string;

  // === INFORMATIONS RÉGLEMENTAIRES ===
  @ApiProperty({ description: 'Autorité de supervision', enum: SupervisoryAuthority })
  @IsEnum(SupervisoryAuthority)
  autoritéSupervision!: SupervisoryAuthority;

  @ApiProperty({ description: 'Numéro d\'agrément' })
  @IsString()
  numeroAgrement!: string;

  @ApiProperty({ description: 'Date d\'agrément' })
  @IsDateString()
  dateAgrement!: string;

  @ApiProperty({ description: 'Validité agrément' })
  @IsDateString()
  validiteAgrement!: string;

  @ApiProperty({ description: 'Numéro RCCM' })
  @IsString()
  numeroRCCM!: string;

  @ApiProperty({ description: 'Numéro NIF' })
  @IsString()
  numeroNIF!: string;

  // === ACTIVITÉS AUTORISÉES ===
  @ApiProperty({ description: 'Activités autorisées', type: [String] })
  @IsArray()
  @IsString({ each: true })
  activitesAutorisees!: string[];

  // === INFORMATIONS OPÉRATIONNELLES ===
  @ApiProperty({ description: 'Adresse du siège social' })
  @IsString()
  siegeSocial!: string;

  @ApiProperty({ description: 'Nombre d\'agences' })
  @IsNumber()
  nombreAgences!: number;

  @ApiProperty({ description: 'Villes/provinces couvertes', type: [String] })
  @IsArray()
  @IsString({ each: true })
  villesProvincesCouvertes!: string[];

  @ApiProperty({ description: 'Présence internationale' })
  @IsBoolean()
  presenceInternationale!: boolean;

  // === CAPACITÉS FINANCIÈRES ===
  @ApiProperty({ description: 'Capital social minimum' })
  @IsString()
  capitalSocialMinimum!: string;

  @ApiProperty({ description: 'Capital social actuel' })
  @IsString()
  capitalSocialActuel!: string;

  @ApiProperty({ description: 'Montant fonds propres' })
  @IsString()
  fondsPropresMontant!: string;

  @ApiProperty({ description: 'Total bilan' })
  @IsString()
  totalBilan!: string;

  @ApiProperty({ description: 'Chiffre d\'affaires annuel' })
  @IsString()
  chiffreAffairesAnnuel!: string;

  @ApiProperty({ description: 'Devise de référence', enum: Currency })
  @IsEnum(Currency)
  devise!: Currency;

  // === CLIENTÈLE ET MARCHÉ ===
  @ApiProperty({ description: 'Segment clientèle principal' })
  @IsString()
  segmentClientelePrincipal!: string;

  @ApiProperty({ description: 'Nombre de clients actifs' })
  @IsNumber()
  nombreClientsActifs!: number;

  @ApiProperty({ description: 'Portefeuille crédit' })
  @IsString()
  portefeuilleCredit!: string;

  @ApiProperty({ description: 'Dépôts collectés' })
  @IsString()
  depotsCollectes!: string;

  // === SERVICES OFFERTS À WANZO ===
  @ApiProperty({ description: 'Services de crédit', type: [String] })
  @IsArray()
  @IsString({ each: true })
  servicesCredit!: string[];

  @ApiProperty({ description: 'Services d\'investissement', type: [String] })
  @IsArray()
  @IsString({ each: true })
  servicesInvestissement!: string[];

  @ApiProperty({ description: 'Services de garantie', type: [String] })
  @IsArray()
  @IsString({ each: true })
  servicesGarantie!: string[];

  @ApiProperty({ description: 'Services transactionnels', type: [String] })
  @IsArray()
  @IsString({ each: true })
  servicesTransactionnels!: string[];

  @ApiProperty({ description: 'Services de conseil', type: [String] })
  @IsArray()
  @IsString({ each: true })
  servicesConseil!: string[];

  // === PARTENARIAT WANZO ===
  @ApiProperty({ description: 'Motivation principale' })
  @IsString()
  motivationPrincipale!: string;

  @ApiProperty({ description: 'Services prioritaires', type: [String] })
  @IsArray()
  @IsString({ each: true })
  servicesPrioritaires!: string[];

  @ApiProperty({ description: 'Segments clientèle cibles', type: [String] })
  @IsArray()
  @IsString({ each: true })
  segmentsClienteleCibles!: string[];

  @ApiProperty({ description: 'Volume d\'affaires envisagé' })
  @IsString()
  volumeAffairesEnvisage!: string;

  // === CONDITIONS COMMERCIALES ===
  @ApiProperty({ description: 'Grilles tarifaires' })
  @IsString()
  grillesTarifaires!: string;

  @ApiProperty({ description: 'Conditions préférentielles' })
  @IsString()
  conditionsPreferentielles!: string;

  @ApiProperty({ description: 'Délais de traitement' })
  @IsString()
  delaisTraitement!: string;

  @ApiProperty({ description: 'Critères d\'éligibilité' })
  @IsString()
  criteresEligibilite!: string;

  // === CAPACITÉ D'ENGAGEMENT ===
  @ApiProperty({ description: 'Montant maximum par dossier' })
  @IsString()
  montantMaximumDossier!: string;

  @ApiProperty({ description: 'Enveloppe globale' })
  @IsString()
  enveloppeGlobale!: string;

  @ApiProperty({ description: 'Secteurs d\'activité privilégiés', type: [String] })
  @IsArray()
  @IsString({ each: true })
  secteursActivitePrivilegies!: string[];

  @ApiProperty({ description: 'Zones géographiques prioritaires', type: [String] })
  @IsArray()
  @IsString({ each: true })
  zonesGeographiquesPrioritaires!: string[];

  // === DOCUMENTS ===
  @ApiProperty({ description: 'Documents légaux' })
  documentsLegaux!: any[];

  @ApiProperty({ description: 'Documents financiers' })
  documentsFinanciers!: any[];

  @ApiProperty({ description: 'Documents opérationnels' })
  documentsOperationnels!: any[];

  @ApiProperty({ description: 'Documents compliance' })
  documentsCompliance!: any[];

  // === MÉTADONNÉES ===
  @ApiProperty({ description: 'Date de création' })
  @IsDateString()
  createdAt!: string;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @IsDateString()
  updatedAt!: string;
}

/**
 * DTO pour créer une institution financière (Conforme à la documentation)
 */
export class CreateFinancialInstitutionDto {
  @ApiProperty({ description: 'ID utilisateur propriétaire' })
  @IsString()
  userId!: string;

  // === IDENTIFICATION INSTITUTIONNELLE (Requis) ===
  @ApiProperty({ description: 'Dénomination sociale' })
  @IsString()
  denominationSociale!: string;

  @ApiProperty({ description: 'Sigle/Acronyme' })
  @IsString()
  sigle!: string;

  @ApiProperty({ description: 'Type d\'institution', enum: FinancialInstitutionType })
  @IsEnum(FinancialInstitutionType)
  typeInstitution!: FinancialInstitutionType;

  @ApiProperty({ description: 'Sous-catégorie' })
  @IsString()
  sousCategorie!: string;

  @ApiProperty({ description: 'Date de création' })
  @IsDateString()
  dateCreation!: string;

  @ApiProperty({ description: 'Pays d\'origine' })
  @IsString()
  paysOrigine!: string;

  @ApiProperty({ description: 'Statut juridique' })
  @IsString()
  statutJuridique!: string;

  // === INFORMATIONS RÉGLEMENTAIRES (Optionnelles à la création) ===
  @ApiPropertyOptional({ description: 'Autorité de supervision', enum: SupervisoryAuthority })
  @IsOptional()
  @IsEnum(SupervisoryAuthority)
  autoritéSupervision?: SupervisoryAuthority;

  @ApiPropertyOptional({ description: 'Numéro d\'agrément' })
  @IsOptional()
  @IsString()
  numeroAgrement?: string;

  @ApiPropertyOptional({ description: 'Date d\'agrément' })
  @IsOptional()
  @IsDateString()
  dateAgrement?: string;

  @ApiPropertyOptional({ description: 'Validité agrément' })
  @IsOptional()
  @IsDateString()
  validiteAgrement?: string;

  @ApiPropertyOptional({ description: 'Numéro RCCM' })
  @IsOptional()
  @IsString()
  numeroRCCM?: string;

  @ApiPropertyOptional({ description: 'Numéro NIF' })
  @IsOptional()
  @IsString()
  numeroNIF?: string;

  // === INFORMATIONS OPÉRATIONNELLES (Optionnelles) ===
  @ApiPropertyOptional({ description: 'Adresse du siège social' })
  @IsOptional()
  @IsString()
  siegeSocial?: string;

  @ApiPropertyOptional({ description: 'Nombre d\'agences' })
  @IsOptional()
  @IsNumber()
  nombreAgences?: number;

  @ApiPropertyOptional({ description: 'Villes/provinces couvertes', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  villesProvincesCouvertes?: string[];

  @ApiPropertyOptional({ description: 'Présence internationale' })
  @IsOptional()
  @IsBoolean()
  presenceInternationale?: boolean;

  // Autres champs optionnels...
  @ApiPropertyOptional({ description: 'Capital social actuel' })
  @IsOptional()
  @IsString()
  capitalSocialActuel?: string;

  @ApiPropertyOptional({ description: 'Devise de référence', enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  devise?: Currency;

  @ApiPropertyOptional({ description: 'Segment clientèle principal' })
  @IsOptional()
  @IsString()
  segmentClientelePrincipal?: string;

  @ApiPropertyOptional({ description: 'Nombre de clients actifs' })
  @IsOptional()
  @IsNumber()
  nombreClientsActifs?: number;
}

/**
 * DTO pour mettre à jour une institution financière
 */
export class UpdateFinancialInstitutionDto {
  @ApiPropertyOptional({ description: 'Dénomination sociale' })
  @IsOptional()
  @IsString()
  denominationSociale?: string;

  @ApiPropertyOptional({ description: 'Sigle/Acronyme' })
  @IsOptional()
  @IsString()
  sigle?: string;

  @ApiPropertyOptional({ description: 'Type d\'institution', enum: FinancialInstitutionType })
  @IsOptional()
  @IsEnum(FinancialInstitutionType)
  typeInstitution?: FinancialInstitutionType;

  @ApiPropertyOptional({ description: 'Sous-catégorie' })
  @IsOptional()
  @IsString()
  sousCategorie?: string;

  @ApiPropertyOptional({ description: 'Adresse du siège social' })
  @IsOptional()
  @IsString()
  siegeSocial?: string;

  @ApiPropertyOptional({ description: 'Nombre d\'agences' })
  @IsOptional()
  @IsNumber()
  nombreAgences?: number;

  @ApiPropertyOptional({ description: 'Capital social actuel' })
  @IsOptional()
  @IsString()
  capitalSocialActuel?: string;

  @ApiPropertyOptional({ description: 'Devise de référence', enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  devise?: Currency;

  @ApiPropertyOptional({ description: 'Segment clientèle principal' })
  @IsOptional()
  @IsString()
  segmentClientelePrincipal?: string;

  @ApiPropertyOptional({ description: 'Nombre de clients actifs' })
  @IsOptional()
  @IsNumber()
  nombreClientsActifs?: number;

  // === ADDITIONAL OPTIONAL FIELDS FOR UPDATES ===
  @ApiPropertyOptional({ description: 'Statut de l\'institution' })
  @IsOptional()
  @IsString()
  status?: any;

  @ApiPropertyOptional({ description: 'Raison du changement de statut' })
  @IsOptional()
  @IsString()
  statusChangeReason?: string;

  @ApiPropertyOptional({ description: 'Licences' })
  @IsOptional()
  @IsArray()
  licenses?: any[];

  @ApiPropertyOptional({ description: 'ID utilisateur' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Statut juridique' })
  @IsOptional()
  @IsString()
  statutJuridique?: string;

  // Tous les autres champs sont optionnels...
}

/**
 * DTOs pour les endpoints spécialisés (Conforme à ENDPOINTS_EXACT.md)
 */

// Branch/Agence
export class InstitutionBranchDto {
  @ApiProperty({ description: 'Nom de l\'agence' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Adresse de l\'agence' })
  @IsString()
  address!: string;

  @ApiPropertyOptional({ description: 'Téléphone de l\'agence' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email de l\'agence' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Heures d\'ouverture' })
  @IsOptional()
  @IsString()
  openingHours?: string;

  @ApiPropertyOptional({ description: 'Services disponibles', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];
}

// Team Member
export class InstitutionTeamMemberDto {
  @ApiProperty({ description: 'Nom complet' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Poste/Titre' })
  @IsString()
  position!: string;

  @ApiPropertyOptional({ description: 'Email professionnel' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Téléphone professionnel' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Département' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Biographie' })
  @IsOptional()
  @IsString()
  bio?: string;
}

/**
 * DTOs pour la liste et filtres
 */
export class FinancialInstitutionListQueryDto {
  @ApiPropertyOptional({ description: 'Numéro de page', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Éléments par page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Recherche par nom' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrer par type', enum: FinancialInstitutionType })
  @IsOptional()
  @IsEnum(FinancialInstitutionType)
  typeInstitution?: FinancialInstitutionType;

  @ApiPropertyOptional({ description: 'Filtrer par autorité de supervision', enum: SupervisoryAuthority })
  @IsOptional()
  @IsEnum(SupervisoryAuthority)
  autoritéSupervision?: SupervisoryAuthority;

  @ApiPropertyOptional({ description: 'Tri (denominationSociale:asc, createdAt:desc, etc.)' })
  @IsOptional()
  @IsString()
  sort?: string;
}

export class FinancialInstitutionListResponseDto {
  @ApiProperty({ description: 'Liste des institutions', type: [FinancialInstitutionResponseDto] })
  data!: FinancialInstitutionResponseDto[];

  @ApiProperty({ description: 'Métadonnées de pagination' })
  meta!: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// === TYPE ALIASES FOR BACKWARD COMPATIBILITY ===
export { FinancialInstitutionType as InstitutionType };
export type InstitutionStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
export type LicenseType = 'BANKING' | 'MICROFINANCE' | 'INVESTMENT' | 'OTHER';