import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow, WorkflowType, WorkflowStatus } from '../entities/workflow.entity';
import { WorkflowStep, StepType, StepStatus } from '../entities/workflow-step.entity';
import { Operation } from '../entities/operation.entity';
import { CreateWorkflowDto, UpdateWorkflowDto, UpdateWorkflowStepDto, ManagerValidationDto, SystemCheckDto } from '../dtos/workflow.dto';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowStep)
    private workflowStepRepository: Repository<WorkflowStep>,
  ) {}

  async createInitialWorkflow(operation: Operation): Promise<Workflow> {
    // Créer les étapes selon le type d'opération
    const steps = this.getInitialSteps(operation);

    const workflow = this.workflowRepository.create({
      name: `Workflow for ${operation.type} operation`,
      type: WorkflowType.VALIDATION,
      status: WorkflowStatus.PENDING,
      currentStepId: steps[0].id,
      steps,
    });

    return await this.workflowRepository.save(workflow);
  }

  private getInitialSteps(operation: Operation): Partial<WorkflowStep>[] {
    const commonSteps = [
      {
        stepType: StepType.DOCUMENT_UPLOAD,
        label: 'Document submission',
        description: 'Upload required documents',
        assignedTo: 'client',
        externalApp: 'pme_app',
        requiresValidationToken: false,
      },
      {
        stepType: StepType.MANAGER_VALIDATION,
        label: 'Manager validation',
        description: 'Internal validation by manager',
        assignedTo: 'manager',
        externalApp: 'pme_app',
        requiresValidationToken: true,
      },
    ];

    const specificSteps = operation.type === 'credit' ? [
      {
        stepType: StepType.SYSTEM_CHECK,
        label: 'Credit scoring',
        description: 'Automatic credit score calculation',
        assignedTo: 'system',
        externalApp: 'investor_app',
        requiresValidationToken: false,
      },
    ] : [
      {
        stepType: StepType.EXTERNAL_VALIDATION,
        label: 'Equipment verification',
        description: 'Verify equipment availability',
        assignedTo: 'investor',
        externalApp: 'investor_app',
        requiresValidationToken: false,
      },
    ];

    return [...commonSteps, ...specificSteps];
  }

  async findById(id: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id },
      relations: ['steps'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return workflow;
  }

  async findByOperationId(operationId: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { operation: { id: operationId } },
      relations: ['steps'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow for operation ${operationId} not found`);
    }

    return workflow;
  }

  async update(id: string, updateWorkflowDto: UpdateWorkflowDto): Promise<Workflow> {
    const workflow = await this.findById(id);

    if (updateWorkflowDto.status) {
      this.validateStatusTransition(workflow.status, updateWorkflowDto.status);
    }

    Object.assign(workflow, updateWorkflowDto);
    return await this.workflowRepository.save(workflow);
  }

  async updateStep(
    workflowId: string,
    stepId: string,
    updateStepDto: UpdateWorkflowStepDto,
  ): Promise<WorkflowStep> {
    const workflow = await this.findById(workflowId);
    const step = workflow.steps.find(s => s.id === stepId);

    if (!step) {
      throw new NotFoundException(`Step ${stepId} not found in workflow ${workflowId}`);
    }

    if (updateStepDto.status) {
      this.validateStepStatusTransition(step.status, updateStepDto.status);
    }

    Object.assign(step, updateStepDto);
    return await this.workflowStepRepository.save(step);
  }

  async managerValidation(
    workflowId: string,
    stepId: string,
    validationDto: ManagerValidationDto,
  ): Promise<WorkflowStep> {
    const workflow = await this.findById(workflowId);
    const step = workflow.steps.find(s => s.id === stepId);

    if (!step) {
      throw new NotFoundException(`Step ${stepId} not found in workflow ${workflowId}`);
    }

    if (step.stepType !== StepType.MANAGER_VALIDATION) {
      throw new BadRequestException('This step does not support manager validation');
    }

    step.status = validationDto.status;
    step.metadata = {
      ...step.metadata,
      managerValidation: {
        status: validationDto.status,
        comment: validationDto.comment,
        validatedAt: new Date(),
      },
    };

    return await this.workflowStepRepository.save(step);
  }

  async systemCheck(
    workflowId: string,
    stepId: string,
    checkDto: SystemCheckDto,
  ): Promise<WorkflowStep> {
    const workflow = await this.findById(workflowId);
    const step = workflow.steps.find(s => s.id === stepId);

    if (!step) {
      throw new NotFoundException(`Step ${stepId} not found in workflow ${workflowId}`);
    }

    if (step.stepType !== StepType.SYSTEM_CHECK) {
      throw new BadRequestException('This step does not support system check');
    }

    step.status = checkDto.status;
    step.metadata = {
      ...step.metadata,
      systemCheck: {
        status: checkDto.status,
        checkedAt: checkDto.checkedAt,
        result: checkDto.result,
      },
    };

    return await this.workflowStepRepository.save(step);
  }

  async refresh(id: string): Promise<Workflow> {
    const workflow = await this.findById(id);
    // Ici, on pourrait synchroniser avec l'app investisseur
    // Pour l'instant, on retourne juste le workflow à jour
    return workflow;
  }

  private validateStatusTransition(currentStatus: WorkflowStatus, newStatus: WorkflowStatus): void {
    const validTransitions: Record<WorkflowStatus, WorkflowStatus[]> = {
      [WorkflowStatus.PENDING]: [WorkflowStatus.IN_PROGRESS, WorkflowStatus.CANCELLED],
      [WorkflowStatus.IN_PROGRESS]: [WorkflowStatus.COMPLETED, WorkflowStatus.REJECTED],
      [WorkflowStatus.COMPLETED]: [],
      [WorkflowStatus.REJECTED]: [],
      [WorkflowStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private validateStepStatusTransition(currentStatus: StepStatus, newStatus: StepStatus): void {
    const validTransitions: Record<StepStatus, StepStatus[]> = {
      [StepStatus.PENDING]: [StepStatus.IN_PROGRESS, StepStatus.SKIPPED],
      [StepStatus.IN_PROGRESS]: [StepStatus.COMPLETED, StepStatus.REJECTED],
      [StepStatus.COMPLETED]: [],
      [StepStatus.REJECTED]: [StepStatus.PENDING],
      [StepStatus.SKIPPED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(`Invalid step status transition from ${currentStatus} to ${newStatus}`);
    }
  }
}