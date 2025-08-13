import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerStatus } from '../entities/customer.entity';
import { ValidationProcess, ValidationStep, ValidationStepStatus } from '../entities/validation.entity';
import { DocumentType } from '../entities/document.entity';
import { User } from '@/modules/users/entities/user.entity';

@Injectable()
export class ValidationService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(ValidationProcess)
    private validationProcessRepository: Repository<ValidationProcess>,
  ) {}

  async getValidationProcess(customerId: string) {
    const customer = await this.customersRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
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
    const customer = await this.customersRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
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

    // Update customer status
    customer.status = CustomerStatus.VALIDATION_IN_PROGRESS;
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

      // Update customer status
      const customer = await this.customersRepository.findOne({ where: { id: customerId } });
      if (customer) {
        customer.status = CustomerStatus.ACTIVE;
        customer.validatedAt = new Date();
        customer.validatedBy = user.id;
        await this.customersRepository.save(customer);
      }
    }

    return this.validationProcessRepository.save(validationProcess);
  }

  async getExtendedCustomerInfo(customerId: string) {
    const customer = await this.customersRepository.findOne({
      where: { id: customerId },
      relations: ['documents']
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // Get additional information as needed
    // This is a placeholder for any additional customer information
    // that might be needed for validation
    
    return {
      customer,
      documents: customer.documents || [],
      validationProcess: await this.getValidationProcess(customerId),
      // Add any other relevant information
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
