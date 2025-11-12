import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LeadershipRole {
  CEO = 'ceo',
  PRESIDENT = 'president',
  VICE_PRESIDENT = 'vice_president',
  DIRECTOR_GENERAL = 'director_general',
  DEPUTY_DIRECTOR = 'deputy_director',
  BOARD_MEMBER = 'board_member',
  CHAIRMAN = 'chairman',
  CFO = 'cfo',
  CTO = 'cto',
  COO = 'coo',
  RISK_MANAGER = 'risk_manager',
  COMPLIANCE_OFFICER = 'compliance_officer',
  AUDIT_MANAGER = 'audit_manager',
  BRANCH_MANAGER = 'branch_manager',
  DEPARTMENT_HEAD = 'department_head'
}

export enum LeadershipStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  RETIRED = 'retired',
  RESIGNED = 'resigned'
}

export enum EducationLevel {
  HIGH_SCHOOL = 'high_school',
  BACHELOR = 'bachelor',
  MASTER = 'master',
  PHD = 'phd',
  MBA = 'mba',
  PROFESSIONAL_CERTIFICATION = 'professional_certification'
}

/**
 * DTO pour l'éducation d'un dirigeant
 */
export class EducationDto {
  @ApiProperty({ description: 'Niveau d\'éducation', enum: EducationLevel })
  @IsEnum(EducationLevel)
  level!: EducationLevel;

  @ApiProperty({ description: 'Institution éducative' })
  @IsString()
  institution!: string;

  @ApiProperty({ description: 'Domaine d\'étude' })
  @IsString()
  fieldOfStudy!: string;

  @ApiPropertyOptional({ description: 'Année d\'obtention' })
  @IsOptional()
  @IsNumber()
  graduationYear?: number;

  @ApiPropertyOptional({ description: 'Mention ou GPA' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ description: 'Certificats ou prix obtenus' })
  @IsOptional()
  @IsString()
  certifications?: string;
}

/**
 * DTO pour l'expérience professionnelle
 */
export class ProfessionalExperienceDto {
  @ApiProperty({ description: 'Nom de l\'entreprise' })
  @IsString()
  company!: string;

  @ApiProperty({ description: 'Poste occupé' })
  @IsString()
  position!: string;

  @ApiProperty({ description: 'Date de début' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ description: 'Date de fin' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Description des responsabilités' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Réalisations clés' })
  @IsOptional()
  @IsString()
  achievements?: string;

  @ApiProperty({ description: 'Poste actuel' })
  @IsBoolean()
  isCurrent!: boolean;
}

/**
 * DTO pour les compétences et certifications
 */
export class SkillDto {
  @ApiProperty({ description: 'Nom de la compétence' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Catégorie de compétence' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ description: 'Niveau de maîtrise (1-10)' })
  @IsOptional()
  @IsNumber()
  proficiencyLevel?: number;

  @ApiPropertyOptional({ description: 'Certifié officiellement' })
  @IsOptional()
  @IsBoolean()
  isCertified?: boolean;

  @ApiPropertyOptional({ description: 'Organisme de certification' })
  @IsOptional()
  @IsString()
  certifyingBody?: string;

  @ApiPropertyOptional({ description: 'Date d\'obtention de certification' })
  @IsOptional()
  @IsDateString()
  certificationDate?: string;

  @ApiPropertyOptional({ description: 'Date d\'expiration de certification' })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}

/**
 * DTO pour les langues parlées
 */
export class LanguageDto {
  @ApiProperty({ description: 'Nom de la langue' })
  @IsString()
  language!: string;

  @ApiProperty({ description: 'Niveau de maîtrise' })
  @IsString()
  proficiency!: string; // Native, Fluent, Intermediate, Basic

  @ApiPropertyOptional({ description: 'Certification officielle' })
  @IsOptional()
  @IsString()
  certification?: string;
}

/**
 * DTO pour les informations de contact d'un dirigeant
 */
export class LeaderContactDto {
  @ApiPropertyOptional({ description: 'Email professionnel' })
  @IsOptional()
  @IsEmail()
  professionalEmail?: string;

  @ApiPropertyOptional({ description: 'Email personnel' })
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @ApiPropertyOptional({ description: 'Téléphone professionnel' })
  @IsOptional()
  @IsString()
  professionalPhone?: string;

  @ApiPropertyOptional({ description: 'Téléphone personnel' })
  @IsOptional()
  @IsString()
  personalPhone?: string;

  @ApiPropertyOptional({ description: 'LinkedIn' })
  @IsOptional()
  @IsString()
  linkedIn?: string;

  @ApiPropertyOptional({ description: 'Adresse professionnelle' })
  @IsOptional()
  @IsString()
  officeAddress?: string;
}

/**
 * DTO pour les responsabilités et autorisations
 */
export class ResponsibilityDto {
  @ApiProperty({ description: 'Domaine de responsabilité' })
  @IsString()
  area!: string;

  @ApiProperty({ description: 'Description détaillée' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'Niveau d\'autorisation (1-10)' })
  @IsOptional()
  @IsNumber()
  authorizationLevel?: number;

  @ApiPropertyOptional({ description: 'Limite budgétaire' })
  @IsOptional()
  @IsNumber()
  budgetLimit?: number;

  @ApiProperty({ description: 'Responsabilité active' })
  @IsBoolean()
  isActive!: boolean;
}

/**
 * DTO principal pour un dirigeant
 */
export class LeadershipDto {
  @ApiProperty({ description: 'Prénom' })
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'Nom de famille' })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({ description: 'Nom de jeune fille' })
  @IsOptional()
  @IsString()
  maidenName?: string;

  @ApiProperty({ description: 'Rôle/Fonction', enum: LeadershipRole })
  @IsEnum(LeadershipRole)
  role!: LeadershipRole;

  @ApiProperty({ description: 'Titre du poste' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Statut', enum: LeadershipStatus })
  @IsEnum(LeadershipStatus)
  status!: LeadershipStatus;

  @ApiProperty({ description: 'Date de nomination' })
  @IsDateString()
  appointmentDate!: string;

  @ApiPropertyOptional({ description: 'Date de fin de mandat' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Date de naissance' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Lieu de naissance' })
  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  @ApiPropertyOptional({ description: 'Nationalité' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ description: 'Genre' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Situation matrimoniale' })
  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @ApiPropertyOptional({ description: 'Informations de contact' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LeaderContactDto)
  contact?: LeaderContactDto;

  @ApiPropertyOptional({ description: 'Photo de profil (URL)' })
  @IsOptional()
  @IsString()
  profilePhotoUrl?: string;

  @ApiPropertyOptional({ description: 'Biographie' })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiPropertyOptional({ description: 'Formation académique' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];

  @ApiPropertyOptional({ description: 'Expérience professionnelle' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfessionalExperienceDto)
  experience?: ProfessionalExperienceDto[];

  @ApiPropertyOptional({ description: 'Compétences et certifications' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills?: SkillDto[];

  @ApiPropertyOptional({ description: 'Langues parlées' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageDto)
  languages?: LanguageDto[];

  @ApiPropertyOptional({ description: 'Responsabilités et autorisations' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponsibilityDto)
  responsibilities?: ResponsibilityDto[];

  @ApiPropertyOptional({ description: 'Salaire annuel' })
  @IsOptional()
  @IsNumber()
  annualSalary?: number;

  @ApiPropertyOptional({ description: 'Bonus et primes' })
  @IsOptional()
  @IsNumber()
  bonuses?: number;

  @ApiPropertyOptional({ description: 'Actions détenues' })
  @IsOptional()
  @IsNumber()
  sharesOwned?: number;

  @ApiPropertyOptional({ description: 'Pourcentage de participation' })
  @IsOptional()
  @IsNumber()
  ownershipPercentage?: number;

  @ApiPropertyOptional({ description: 'Période d\'essai terminée' })
  @IsOptional()
  @IsBoolean()
  probationCompleted?: boolean;

  @ApiPropertyOptional({ description: 'Évaluation de performance (1-10)' })
  @IsOptional()
  @IsNumber()
  performanceRating?: number;

  @ApiPropertyOptional({ description: 'Remarques et notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO pour créer un dirigeant
 */
export class CreateLeadershipDto {
  @ApiProperty({ description: 'ID de l\'institution financière' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Données du dirigeant' })
  @ValidateNested()
  @Type(() => LeadershipDto)
  leadership!: LeadershipDto;
}

/**
 * DTO pour mettre à jour un dirigeant
 */
export class UpdateLeadershipDto {
  @ApiProperty({ description: 'ID du dirigeant à mettre à jour' })
  @IsString()
  leadershipId!: string;

  @ApiProperty({ description: 'Nouvelles données du dirigeant' })
  @ValidateNested()
  @Type(() => LeadershipDto)
  leadership!: Partial<LeadershipDto>;
}

/**
 * DTO de réponse pour un dirigeant
 */
export class LeadershipResponseDto extends LeadershipDto {
  @ApiProperty({ description: 'Identifiant unique du dirigeant' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'ID de l\'institution' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Date de création' })
  @IsString()
  createdAt!: string;

  @ApiProperty({ description: 'Date de mise à jour' })
  @IsString()
  updatedAt!: string;
}

/**
 * DTO pour l'organigramme de l'institution
 */
export class OrganizationalChartDto {
  @ApiProperty({ description: 'ID de l\'institution' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Liste hiérarchique des dirigeants' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeadershipResponseDto)
  hierarchy!: LeadershipResponseDto[];

  @ApiPropertyOptional({ description: 'Date de dernière mise à jour' })
  @IsOptional()
  @IsString()
  lastUpdated?: string;
}

// Aliases pour compatibilité avec les contrôleurs
export { LeadershipDto as InstitutionLeadershipDataDto };
export { CreateLeadershipDto as CreateInstitutionLeadershipDto };
export { UpdateLeadershipDto as UpdateInstitutionLeadershipDto };
export { LeadershipResponseDto as InstitutionLeadershipResponseDto };
export { LeadershipRole as ExecutiveRole };
export { LeadershipStatus as AppointmentStatus };

// Export des enums manquants
export enum PositionLevel {
  BOARD = 'board',
  EXECUTIVE = 'executive',
  SENIOR_MANAGEMENT = 'senior_management',
  MIDDLE_MANAGEMENT = 'middle_management',
  DEPARTMENT_HEAD = 'department_head'
}