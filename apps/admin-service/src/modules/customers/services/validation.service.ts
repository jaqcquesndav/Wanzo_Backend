import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerStatus } from '../entities/customer.entity';
import { CustomerDetailedProfile, AdminStatus } from '../entities/customer-detailed-profile.entity';
import { ValidationProcess, ValidationStep, ValidationStepStatus } from '../entities/validation.entity';
import { DocumentType } from '../entities/document.entity';
import { User } from '@/modules/users/entities/user.entity';

@Injectable()
export class ValidationService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(CustomerDetailedProfile)
    private detailedProfilesRepository: Repository<CustomerDetailedProfile>,
    @InjectRepository(ValidationProcess)
    private validationProcessRepository: Repository<ValidationProcess>,
  ) {}

  async getValidationProcess(customerId: string) {
    // Vérifier que le profil existe dans CustomerDetailedProfile
    const profile = await this.detailedProfilesRepository.findOne({ where: { customerId } });
    if (!profile) {
      throw new NotFoundException(`Customer profile with ID ${customerId} not found`);
    }

    // Find active validation process or return empty state
    const validationProcess = await this.validationProcessRepository.findOne({
      where: { customerId },
      order: { startedAt: 'DESC' }
    });

    return validationProcess || { 
      customerId,
      status: CustomerStatus.INACTIVE,
      steps: [] as ValidationStep[]
    };
  }

  async initiateValidationProcess(customerId: string, user: User) {
    // Récupérer le profil complet
    const profile = await this.detailedProfilesRepository.findOne({ where: { customerId } });
    if (!profile) {
      throw new NotFoundException(`Customer profile with ID ${customerId} not found`);
    }

    // Check if there's already an active validation process
    const existingProcess = await this.validationProcessRepository.findOne({
      where: { 
        customerId,
        status: CustomerStatus.VALIDATION_IN_PROGRESS
      }
    });

    if (existingProcess) {
      throw new BadRequestException(`Validation process already in progress for customer ${customerId}`);
    }

    // Create default validation steps
    const steps = this.createDefaultValidationSteps();

    // Create new validation process
    const validationProcess = this.validationProcessRepository.create({
      customerId,
      status: CustomerStatus.VALIDATION_IN_PROGRESS,
      steps,
      currentStepIndex: 0,
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
      validatedBy: user.id,
      notes: [`Validation process initiated by ${user.name} (${user.email})`]
    });

    // Mettre à jour le statut admin dans CustomerDetailedProfile
    profile.adminStatus = AdminStatus.UNDER_REVIEW;
    profile.status = 'validation_in_progress';
    await this.detailedProfilesRepository.save(profile);

    // Créer ou mettre à jour Customer pour tracking validation
    let customer = await this.customersRepository.findOne({ where: { customerId } });
    if (!customer) {
      customer = this.customersRepository.create({ customerId });
    }
    await this.customersRepository.save(customer);

    // Save validation process
    return this.validationProcessRepository.save(validationProcess);
  }

  async updateValidationStep(customerId: string, stepId: string, updateData: any, user: User) {
    const validationProcess = await this.validationProcessRepository.findOne({
      where: { customerId }
    });

    if (!validationProcess) {
      throw new NotFoundException(`No validation process found for customer ${customerId}`);
    }

    // Find and update the specific step
    const stepIndex = validationProcess.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) {
      throw new NotFoundException(`Step with ID ${stepId} not found in validation process`);
    }

    // Update step status
    validationProcess.steps[stepIndex] = {
      ...validationProcess.steps[stepIndex],
      ...updateData,
      lastUpdatedAt: new Date()
    };

    // Update notes
    validationProcess.notes = [
      ...(validationProcess.notes || []),
      `Step "${validationProcess.steps[stepIndex].name}" updated by ${user.name} (${user.email})`
    ];

    validationProcess.lastUpdatedAt = new Date();

    // Check if all steps are completed, then complete the process
    const allStepsCompleted = validationProcess.steps.every(
      step => step.status === ValidationStepStatus.COMPLETED
    );

    if (allStepsCompleted) {
      validationProcess.status = CustomerStatus.ACTIVE;
      validationProcess.completedAt = new Date();

      // Mettre à jour le profil détaillé
      const profile = await this.detailedProfilesRepository.findOne({ where: { customerId } });
      if (profile) {
        profile.adminStatus = AdminStatus.VALIDATED;
        profile.status = 'active';
        profile.lastReviewedAt = new Date();
        profile.reviewedBy = user.id;
        await this.detailedProfilesRepository.save(profile);
      }

      // Mettre à jour Customer pour historique
      const customer = await this.customersRepository.findOne({ where: { customerId } });
      if (customer) {
        customer.validatedAt = new Date();
        customer.validatedBy = user.id;
        await this.customersRepository.save(customer);
      }
    }

    return this.validationProcessRepository.save(validationProcess);
  }

  async getExtendedCustomerInfo(customerId: string) {
    // Récupérer le profil complet depuis CustomerDetailedProfile
    const profile = await this.detailedProfilesRepository.findOne({ where: { customerId } });

    if (!profile) {
      throw new NotFoundException(`Customer profile with ID ${customerId} not found`);
    }

    // Récupérer les relations Customer pour documents et activités
    const customer = await this.customersRepository.findOne({
      where: { customerId },
      relations: ['documents', 'activities']
    });

    // Get additional information as needed
    return {
      profile,
      customer,
      documents: customer?.documents || [],
      activities: customer?.activities || [],
      validationProcess: await this.getValidationProcess(customerId),
    };
  }

  private createDefaultValidationSteps(): ValidationStep[] {
    return [
      {
        id: this.generateUuid(),
        name: 'Document Verification',
        description: 'Verify the authenticity of submitted documents',
        status: ValidationStepStatus.PENDING,
        order: 1,
        requiredDocuments: [],
        completedAt: null,
        completedBy: null,
        notes: null
      },
      {
        id: this.generateUuid(),
        name: 'Company Information Verification',
        description: 'Verify company details and business legitimacy',
        status: ValidationStepStatus.PENDING,
        order: 2,
        requiredDocuments: [],
        completedAt: null,
        completedBy: null,
        notes: null
      },
      {
        id: this.generateUuid(),
        name: 'Contact Information Verification',
        description: 'Verify contact details and communication channels',
        status: ValidationStepStatus.PENDING,
        order: 3,
        requiredDocuments: [],
        completedAt: null,
        completedBy: null,
        notes: null
      },
      {
        id: this.generateUuid(),
        name: 'Final Approval',
        description: 'Final review and approval by administrator',
        status: ValidationStepStatus.PENDING,
        order: 4,
        requiredDocuments: [],
        completedAt: null,
        completedBy: null,
        notes: null
      },
    ];
  }

  private generateUuid(): string {
    // Simple UUID generation for testing purposes
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
