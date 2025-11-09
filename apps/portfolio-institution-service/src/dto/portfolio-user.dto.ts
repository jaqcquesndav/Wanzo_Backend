import { IsEmail, IsString, IsOptional, IsArray, IsBoolean, IsEnum, IsUUID } from 'class-validator';

/**
 * Rôles disponibles pour les utilisateurs du portefeuille
 */
export enum PortfolioUserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  MANAGER = 'manager',
  VIEWER = 'viewer'
}

/**
 * Permissions disponibles dans le système
 */
export enum PortfolioPermission {
  PORTFOLIO_READ = 'portfolio:read',
  PORTFOLIO_WRITE = 'portfolio:write',
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_WRITE = 'analytics:write',
  USERS_MANAGE = 'users:manage',
  REPORTS_GENERATE = 'reports:generate',
  ALL = 'all'
}

/**
 * DTO pour créer un nouvel utilisateur du portefeuille
 */
export class CreatePortfolioUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEnum(PortfolioUserRole)
  role!: PortfolioUserRole;

  @IsUUID()
  institutionId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  position?: string;
}

/**
 * DTO pour mettre à jour un utilisateur du portefeuille
 */
export class UpdatePortfolioUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(PortfolioUserRole)
  role?: PortfolioUserRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  position?: string;
}

/**
 * DTO de réponse pour un utilisateur du portefeuille
 */
export class PortfolioUserResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  role!: string;
  institutionId!: string;
  permissions!: string[];
  isActive!: boolean;
  phone?: string;
  department?: string;
  position?: string;
  lastLoginAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * DTO pour la requête de recherche d'utilisateurs
 */
export class PortfolioUserQueryDto {
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @IsOptional()
  @IsEnum(PortfolioUserRole)
  role?: PortfolioUserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

/**
 * DTO pour l'assignation de permissions
 */
export class AssignPermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];
}

/**
 * DTO pour changer le statut d'un utilisateur
 */
export class ChangeUserStatusDto {
  @IsBoolean()
  isActive!: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}