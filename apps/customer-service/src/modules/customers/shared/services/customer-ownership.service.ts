import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerType } from '../../entities/customer.entity';
import { User } from '../../../system-users/entities/user.entity';
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
 */
@Injectable()
export class CustomerOwnershipService {
  private readonly logger = new Logger(CustomerOwnershipService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerUser)
    private readonly customerUserRepository: Repository<CustomerUser>,
    private readonly customerEventsProducer: CustomerEventsProducer,
  ) {}

  /**
   * Valide l'accès d'un utilisateur à un client
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
        relations: ['users'],
      });

      if (!customer) {
        throw new NotFoundException(`Customer ${customerId} not found`);
      }

      // Vérifier si l'utilisateur appartient au client
      const customerUser = await this.customerUserRepository.findOne({
        where: {
          customerId,
          userId,
          isActive: true,
        },
      });

      if (!customerUser) {
        const result: OwnershipValidationResult = {
          isValid: false,
          reason: 'User does not belong to this customer',
          validationType: 'USER_ACCESS',
          customerId,
          userId,
          validatedAt: new Date(),
        };

        // Log événement de validation échouée
        await this.customerEventsProducer.emitOwnershipValidationFailed({
          customerId,
          userId,
          validationType: 'USER_ACCESS',
          reason: result.reason,
          timestamp: new Date().toISOString(),
        });

        return result;
      }

      // Vérifications supplémentaires selon le contexte
      if (context.requiredPermissions && context.requiredPermissions.length > 0) {
        const hasPermissions = this.checkUserPermissions(
          customerUser,
          context.requiredPermissions,
        );

        if (!hasPermissions) {
          const result: OwnershipValidationResult = {
            isValid: false,
            reason: 'User lacks required permissions',
            validationType: 'USER_ACCESS',
            customerId,
            userId,
            validatedAt: new Date(),
          };

          await this.customerEventsProducer.emitOwnershipValidationFailed({
            customerId,
            userId,
            validationType: 'USER_ACCESS',
            reason: result.reason,
            requiredPermissions: context.requiredPermissions,
            timestamp: new Date().toISOString(),
          });

          return result;
        }
      }

      // Validation réussie
      const result: OwnershipValidationResult = {
        isValid: true,
        validationType: 'USER_ACCESS',
        customerId,
        userId,
        validatedAt: new Date(),
      };

      // Log événement de validation réussie
      await this.customerEventsProducer.emitOwnershipValidationSuccess({
        customerId,
        userId,
        validationType: 'USER_ACCESS',
        userRole: customerUser.role,
        timestamp: new Date().toISOString(),
      });

      return result;

    } catch (error) {
      this.logger.error(`Error validating user access: ${error.message}`, error.stack);
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

        await this.customerEventsProducer.emitOwnershipValidationFailed({
          customerId,
          userId,
          resourceId,
          validationType: 'RESOURCE_ACCESS',
          reason: result.reason,
          resourceType: context.resourceType,
          timestamp: new Date().toISOString(),
        });

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

      await this.customerEventsProducer.emitOwnershipValidationSuccess({
        customerId,
        userId,
        resourceId,
        validationType: 'RESOURCE_ACCESS',
        resourceType: context.resourceType,
        timestamp: new Date().toISOString(),
      });

      return result;

    } catch (error) {
      this.logger.error(`Error validating resource access: ${error.message}`, error.stack);
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

        await this.customerEventsProducer.emitOwnershipValidationSuccess({
          customerId,
          userId,
          validationType: 'ADMIN_ACCESS',
          adminOverride: true,
          timestamp: new Date().toISOString(),
        });

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

      // Vérifier les rôles administrateur
      const customerUser = await this.customerUserRepository.findOne({
        where: { customerId, userId },
      });

      const isAdmin = this.isAdminRole(customerUser?.role);
      if (!isAdmin) {
        const result: OwnershipValidationResult = {
          isValid: false,
          reason: 'User does not have admin privileges',
          validationType: 'ADMIN_ACCESS',
          customerId,
          userId,
          validatedAt: new Date(),
        };

        await this.customerEventsProducer.emitOwnershipValidationFailed({
          customerId,
          userId,
          validationType: 'ADMIN_ACCESS',
          reason: result.reason,
          userRole: customerUser?.role,
          timestamp: new Date().toISOString(),
        });

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

      await this.customerEventsProducer.emitOwnershipValidationSuccess({
        customerId,
        userId,
        validationType: 'ADMIN_ACCESS',
        userRole: customerUser.role,
        timestamp: new Date().toISOString(),
      });

      return result;

    } catch (error) {
      this.logger.error(`Error validating admin access: ${error.message}`, error.stack);
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
   */
  async getUserPermissions(customerId: string, userId: string): Promise<string[]> {
    const customerUser = await this.customerUserRepository.findOne({
      where: { customerId, userId, isActive: true },
    });

    if (!customerUser) {
      return [];
    }

    return this.getRolePermissions(customerUser.role);
  }

  /**
   * Vérifie si un utilisateur a des permissions spécifiques
   */
  private checkUserPermissions(
    customerUser: CustomerUser,
    requiredPermissions: string[],
  ): boolean {
    const userPermissions = this.getRolePermissions(customerUser.role);
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
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
    const adminRoles = ['admin', 'owner', 'super_admin'];
    return role ? adminRoles.includes(role.toLowerCase()) : false;
  }

  /**
   * Obtient les permissions d'un rôle
   */
  private getRolePermissions(role?: string): string[] {
    if (!role) return [];

    const rolePermissions: Record<string, string[]> = {
      owner: ['*'], // Toutes les permissions
      admin: [
        'customer.read',
        'customer.write',
        'user.read',
        'user.write',
        'resource.read',
        'resource.write',
        'portfolio.read',
        'portfolio.write',
      ],
      manager: [
        'customer.read',
        'user.read',
        'resource.read',
        'resource.write',
        'portfolio.read',
        'portfolio.write',
      ],
      user: [
        'customer.read',
        'resource.read',
        'portfolio.read',
      ],
      viewer: [
        'customer.read',
        'resource.read',
      ],
    };

    return rolePermissions[role.toLowerCase()] || [];
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