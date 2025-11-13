import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerType } from '../../entities/customer.entity';
import { User, UserRole } from '../../../system-users/entities/user.entity';
import { CustomerEventsProducer } from '../../../kafka/producers/customer-events.producer';

export interface OwnershipValidationResult {
  isValid: boolean;
  reason?: string;
  validationType: 'USER_ACCESS' | 'RESOURCE_ACCESS' | 'ADMIN_ACCESS';
  customerId: string;
  userId?: string;
  resourceId?: string;
  validatedAt: Date;
}

export interface OwnershipContext {
  userId?: string;
  userRoles?: string[];
  customerType?: CustomerType;
  requiredPermissions?: string[];
  resourceType?: string;
  adminOverride?: boolean;
}

/**
 * Service de validation d'ownership migré depuis OwnershipValidatorService
 * Gère les validations d'accès pour tous les types de clients
 * 
 * NOTE: Version simplifiée sans CustomerUser entity (non disponible)
 * Les validations sont basiques jusqu'à implémentation de l'entity
 */
@Injectable()
export class CustomerOwnershipService {
  private readonly logger = new Logger(CustomerOwnershipService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly customerEventsProducer: CustomerEventsProducer,
  ) {}

  /**
   * Valide l'accès d'un utilisateur à un client
   * NOTE: Validation simplifiée sans CustomerUser entity
   */
  async validateUserAccess(
    customerId: string,
    userId: string,
    context: OwnershipContext = {},
  ): Promise<OwnershipValidationResult> {
    this.logger.log(`Validating user access: user=${userId}, customer=${customerId}`);

    try {
      // Vérifier l'existence du client
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
      });

      if (!customer) {
        throw new NotFoundException(`Customer ${customerId} not found`);
      }

      // Vérifier l'existence de l'utilisateur
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        const result: OwnershipValidationResult = {
          isValid: false,
          reason: 'User not found',
          validationType: 'USER_ACCESS',
          customerId,
          userId,
          validatedAt: new Date(),
        };

        // NOTE: Stub - emitOwnershipValidationFailed n'existe pas dans producer
        this.logger.warn(`Ownership validation failed: ${result.reason}`);

        return result;
      }

      // Admin override - toujours valide pour les admins système
      if (context.adminOverride || user.role === UserRole.ADMIN) {
        const result: OwnershipValidationResult = {
          isValid: true,
          validationType: 'USER_ACCESS',
          customerId,
          userId,
          validatedAt: new Date(),
        };

        // NOTE: Stub - emitOwnershipValidationSuccess n'existe pas dans producer
        this.logger.log(`User access validated (admin override): user=${userId}`);

        return result;
      }

      // Validation basique - considérer valide pour l'instant
      // TODO: Implémenter CustomerUser entity et relations propres
      const result: OwnershipValidationResult = {
        isValid: true,
        validationType: 'USER_ACCESS',
        customerId,
        userId,
        validatedAt: new Date(),
      };

      this.logger.log(`User access validated: user=${userId}, customer=${customerId}`);

      return result;

    } catch (error) {
      this.logger.error(`Error validating user access: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Valide l'accès à une ressource spécifique
   */
  async validateResourceAccess(
    customerId: string,
    resourceId: string,
    userId: string,
    context: OwnershipContext = {},
  ): Promise<OwnershipValidationResult> {
    this.logger.log(`Validating resource access: resource=${resourceId}, user=${userId}, customer=${customerId}`);

    try {
      // D'abord valider l'accès utilisateur
      const userAccess = await this.validateUserAccess(customerId, userId, context);
      if (!userAccess.isValid) {
        return {
          ...userAccess,
          validationType: 'RESOURCE_ACCESS',
          resourceId,
        };
      }

      // Vérifications spécifiques au type de ressource
      const resourceOwnership = await this.checkResourceOwnership(
        customerId,
        resourceId,
        context.resourceType,
      );

      if (!resourceOwnership.isValid) {
        const result: OwnershipValidationResult = {
          isValid: false,
          reason: resourceOwnership.reason,
          validationType: 'RESOURCE_ACCESS',
          customerId,
          userId,
          resourceId,
          validatedAt: new Date(),
        };

        // NOTE: Stub - emitOwnershipValidationFailed n'existe pas dans producer
        this.logger.warn(`Resource access denied: ${result.reason}`);

        return result;
      }

      // Validation réussie
      const result: OwnershipValidationResult = {
        isValid: true,
        validationType: 'RESOURCE_ACCESS',
        customerId,
        userId,
        resourceId,
        validatedAt: new Date(),
      };

      // NOTE: Stub - emitOwnershipValidationSuccess n'existe pas dans producer
      this.logger.log(`Resource access validated: resource=${resourceId}`);

      return result;

    } catch (error) {
      this.logger.error(`Error validating resource access: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Valide l'accès administrateur
   */
  async validateAdminAccess(
    customerId: string,
    userId: string,
    context: OwnershipContext = {},
  ): Promise<OwnershipValidationResult> {
    this.logger.log(`Validating admin access: user=${userId}, customer=${customerId}`);

    try {
      // Vérifier si override admin activé
      if (context.adminOverride) {
        this.logger.warn(`Admin override used for user ${userId} on customer ${customerId}`);
        
        const result: OwnershipValidationResult = {
          isValid: true,
          validationType: 'ADMIN_ACCESS',
          customerId,
          userId,
          validatedAt: new Date(),
        };

        // NOTE: Stub - emitOwnershipValidationSuccess n'existe pas dans producer
        this.logger.log(`Admin access validated (override)`);

        return result;
      }

      // Validation standard d'accès utilisateur
      const userAccess = await this.validateUserAccess(customerId, userId, context);
      if (!userAccess.isValid) {
        return {
          ...userAccess,
          validationType: 'ADMIN_ACCESS',
        };
      }

      // Vérifier les rôles administrateur via User entity
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      const isAdmin = this.isAdminRole(user?.role);
      if (!isAdmin) {
        const result: OwnershipValidationResult = {
          isValid: false,
          reason: 'User does not have admin privileges',
          validationType: 'ADMIN_ACCESS',
          customerId,
          userId,
          validatedAt: new Date(),
        };

        // NOTE: Stub - emitOwnershipValidationFailed n'existe pas dans producer
        this.logger.warn(`Admin access denied: ${result.reason}`);

        return result;
      }

      // Validation réussie
      const result: OwnershipValidationResult = {
        isValid: true,
        validationType: 'ADMIN_ACCESS',
        customerId,
        userId,
        validatedAt: new Date(),
      };

      // NOTE: Stub - emitOwnershipValidationSuccess n'existe pas dans producer
      this.logger.log(`Admin access validated: user=${userId}`);

      return result;

    } catch (error) {
      this.logger.error(`Error validating admin access: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Vérifie et lance une exception si l'accès n'est pas valide
   */
  async enforceUserAccess(
    customerId: string,
    userId: string,
    context: OwnershipContext = {},
  ): Promise<void> {
    const validation = await this.validateUserAccess(customerId, userId, context);
    
    if (!validation.isValid) {
      throw new ForbiddenException(
        `Access denied: ${validation.reason}`,
      );
    }
  }

  /**
   * Vérifie et lance une exception si l'accès ressource n'est pas valide
   */
  async enforceResourceAccess(
    customerId: string,
    resourceId: string,
    userId: string,
    context: OwnershipContext = {},
  ): Promise<void> {
    const validation = await this.validateResourceAccess(
      customerId,
      resourceId,
      userId,
      context,
    );
    
    if (!validation.isValid) {
      throw new ForbiddenException(
        `Resource access denied: ${validation.reason}`,
      );
    }
  }

  /**
   * Vérifie et lance une exception si l'accès admin n'est pas valide
   */
  async enforceAdminAccess(
    customerId: string,
    userId: string,
    context: OwnershipContext = {},
  ): Promise<void> {
    const validation = await this.validateAdminAccess(customerId, userId, context);
    
    if (!validation.isValid) {
      throw new ForbiddenException(
        `Admin access denied: ${validation.reason}`,
      );
    }
  }

  /**
   * Obtient les permissions d'un utilisateur pour un client
   * NOTE: Version simplifiée sans CustomerUser entity
   */
  async getUserPermissions(customerId: string, userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return [];
    }

    return this.getRolePermissions(user.role);
  }

  /**
   * Vérifie l'ownership d'une ressource
   */
  private async checkResourceOwnership(
    customerId: string,
    resourceId: string,
    resourceType?: string,
  ): Promise<{ isValid: boolean; reason?: string }> {
    // Cette méthode devrait être étendue selon les types de ressources
    // Pour l'instant, on assume une validation basique
    
    if (!resourceType) {
      return { isValid: true }; // Pas de validation spécifique
    }

    // Ici on pourrait ajouter des validations spécifiques par type de ressource
    // Par exemple: portfolios, transactions, documents, etc.
    
    return { isValid: true };
  }

  /**
   * Vérifie si un rôle est administrateur
   */
  private isAdminRole(role?: string): boolean {
    const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'admin', 'owner', 'super_admin'];
    return role ? adminRoles.includes(role) : false;
  }

  /**
   * Obtient les permissions d'un rôle
   */
  private getRolePermissions(role?: string): string[] {
    if (!role) return [];

    const normalizedRole = role.toUpperCase();
    
    const rolePermissions: Record<string, string[]> = {
      'SUPER_ADMIN': ['*'], // Toutes les permissions
      'ADMIN': [
        'customer.read',
        'customer.write',
        'user.read',
        'user.write',
        'resource.read',
        'resource.write',
        'portfolio.read',
        'portfolio.write',
      ],
      'OWNER': ['*'], // Toutes les permissions
      'MANAGER': [
        'customer.read',
        'user.read',
        'resource.read',
        'resource.write',
        'portfolio.read',
        'portfolio.write',
      ],
      'USER': [
        'customer.read',
        'resource.read',
        'portfolio.read',
      ],
      'VIEWER': [
        'customer.read',
        'resource.read',
      ],
    };

    return rolePermissions[normalizedRole] || [];
  }

  /**
   * Valide un lot d'accès utilisateurs
   */
  async validateBatchUserAccess(
    validations: Array<{
      customerId: string;
      userId: string;
      context?: OwnershipContext;
    }>,
  ): Promise<OwnershipValidationResult[]> {
    this.logger.log(`Validating batch user access: ${validations.length} validations`);

    const results = await Promise.all(
      validations.map(({ customerId, userId, context }) =>
        this.validateUserAccess(customerId, userId, context)
      )
    );

    const failedCount = results.filter(r => !r.isValid).length;
    this.logger.log(`Batch validation completed: ${results.length - failedCount}/${results.length} successful`);

    return results;
  }
}
