import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerType } from '../entities/customer.entity';
import { User } from '../../system-users/entities/user.entity';
import { SmeService } from './sme.service';
import { InstitutionService } from './institution.service';

export interface OwnershipValidationResult {
  valid: boolean;
  totalEntities: number;
  validEntities: number;
  issues: Array<{
    entityType: 'SME' | 'FINANCIAL_INSTITUTION';
    entityId: string;
    entityName: string;
    issueType: 'NO_OWNER' | 'INVALID_OWNER' | 'OWNER_NOT_LINKED';
    description: string;
    suggestedFix?: string;
  }>;
}

@Injectable()
export class OwnershipValidatorService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly smeService: SmeService,
    private readonly institutionService: InstitutionService,
  ) {}

  /**
   * Comprehensive validation of all ownership relationships
   */
  async validateAllOwnerships(): Promise<OwnershipValidationResult> {
    const issues: OwnershipValidationResult['issues'] = [];
    
    // Validate SMEs
    const smeValidation = await this.smeService.validateCompanyOwnership();
    smeValidation.issues.forEach(issue => {
      issues.push({
        entityType: 'SME',
        entityId: this.extractIdFromIssue(issue),
        entityName: this.extractNameFromIssue(issue),
        issueType: this.determineIssueType(issue),
        description: issue,
        suggestedFix: this.getSuggestedFix(issue),
      });
    });

    // Validate Financial Institutions
    const institutionValidation = await this.institutionService.validateInstitutionOwnership();
    institutionValidation.issues.forEach(issue => {
      issues.push({
        entityType: 'FINANCIAL_INSTITUTION',
        entityId: this.extractIdFromIssue(issue),
        entityName: this.extractNameFromIssue(issue),
        issueType: this.determineIssueType(issue),
        description: issue,
        suggestedFix: this.getSuggestedFix(issue),
      });
    });

    // Additional cross-validation: Check for orphaned users
    await this.validateOrphanedUsers(issues);

    const totalEntities = await this.customerRepository.count();
    const validEntities = totalEntities - issues.length;

    return {
      valid: issues.length === 0,
      totalEntities,
      validEntities,
      issues,
    };
  }

  /**
   * Auto-fix ownership issues where possible
   */
  async autoFixOwnershipIssues(): Promise<{
    fixed: number;
    failed: number;
    details: string[];
  }> {
    const validation = await this.validateAllOwnerships();
    const details: string[] = [];
    let fixed = 0;
    let failed = 0;

    for (const issue of validation.issues) {
      try {
        switch (issue.issueType) {
          case 'NO_OWNER':
            await this.attemptOwnerAssignment(issue);
            fixed++;
            details.push(`Fixed: Assigned owner to ${issue.entityName}`);
            break;
          
          case 'OWNER_NOT_LINKED':
            await this.fixUserAssociation(issue);
            fixed++;
            details.push(`Fixed: Linked user to ${issue.entityName}`);
            break;

          default:
            failed++;
            details.push(`Cannot auto-fix: ${issue.description}`);
            break;
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        details.push(`Failed to fix ${issue.entityName}: ${errorMessage}`);
      }
    }

    return { fixed, failed, details };
  }

  /**
   * Manual assignment of owner to an entity
   */
  async assignOwnerToEntity(
    entityId: string,
    userId: string,
    entityType: 'SME' | 'FINANCIAL_INSTITUTION'
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const customer = await this.customerRepository.findOne({ where: { id: entityId } });
    if (!customer) {
      throw new Error(`Entity with ID ${entityId} not found`);
    }

    // Update customer with owner information
    customer.ownerId = user.id;
    customer.ownerEmail = user.email;
    customer.owner = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };

    await this.customerRepository.save(customer);

    // Update user association
    user.customerId = customer.id;
    if (entityType === 'SME') {
      user.companyId = customer.id;
      user.userType = 'sme' as any;
    } else {
      user.financialInstitutionId = customer.id;
      user.userType = 'financial_institution' as any;
    }
    user.isCompanyOwner = true;
    user.accountType = 'OWNER' as any;

    await this.userRepository.save(user);
  }

  // Helper methods
  private extractIdFromIssue(issue: string): string {
    const match = issue.match(/\(ID: ([^)]+)\)/);
    return match ? match[1] : '';
  }

  private extractNameFromIssue(issue: string): string {
    const match = issue.match(/"([^"]+)"/);
    return match ? match[1] : 'Unknown';
  }

  private determineIssueType(issue: string): 'NO_OWNER' | 'INVALID_OWNER' | 'OWNER_NOT_LINKED' {
    if (issue.includes('has no owner assigned')) {
      return 'NO_OWNER';
    }
    if (issue.includes('has invalid owner ID')) {
      return 'INVALID_OWNER';
    }
    return 'OWNER_NOT_LINKED';
  }

  private getSuggestedFix(issue: string): string {
    if (issue.includes('has no owner assigned')) {
      return 'Assign an existing user as owner or create a new user account';
    }
    if (issue.includes('has invalid owner ID')) {
      return 'Update owner ID to reference an existing user or remove invalid reference';
    }
    return 'Review and fix ownership relationship manually';
  }

  private async validateOrphanedUsers(issues: OwnershipValidationResult['issues']): Promise<void> {
    // Find users marked as company owners but not associated with any company
    const orphanedUsers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('customers', 'customer', 'customer.ownerId = user.id')
      .where('user.isCompanyOwner = :isOwner', { isOwner: true })
      .andWhere('customer.id IS NULL')
      .getMany();

    orphanedUsers.forEach(user => {
      issues.push({
        entityType: user.userType?.includes('sme') ? 'SME' : 'FINANCIAL_INSTITUTION',
        entityId: user.id,
        entityName: user.name,
        issueType: 'OWNER_NOT_LINKED',
        description: `User "${user.name}" is marked as company owner but not linked to any entity`,
        suggestedFix: 'Link user to appropriate company/institution or remove owner flag',
      });
    });
  }

  private async attemptOwnerAssignment(issue: OwnershipValidationResult['issues'][0]): Promise<void> {
    // Try to find a user who created this entity
    const customer = await this.customerRepository.findOne({ where: { id: issue.entityId } });
    if (!customer?.createdBy) {
      throw new Error('Cannot determine creator for owner assignment');
    }

    const creatorUser = await this.userRepository.findOne({ where: { auth0Id: customer.createdBy } });
    if (!creatorUser) {
      throw new Error('Creator user not found in system');
    }

    await this.assignOwnerToEntity(issue.entityId, creatorUser.id, issue.entityType);
  }

  private async fixUserAssociation(issue: OwnershipValidationResult['issues'][0]): Promise<void> {
    const customer = await this.customerRepository.findOne({ where: { id: issue.entityId } });
    if (!customer?.ownerId) {
      throw new Error('No owner ID to fix association');
    }

    const user = await this.userRepository.findOne({ where: { id: customer.ownerId } });
    if (!user) {
      throw new Error('Owner user not found');
    }

    // Fix user association
    user.customerId = customer.id;
    if (issue.entityType === 'SME') {
      user.companyId = customer.id;
      user.userType = 'sme' as any;
    } else {
      user.financialInstitutionId = customer.id;
      user.userType = 'financial_institution' as any;
    }
    user.isCompanyOwner = true;
    user.accountType = 'OWNER' as any;

    await this.userRepository.save(user);
  }
}
