import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkflowService } from './workflow.service';
import { Workflow, WorkflowType, WorkflowStatus } from '../entities/workflow.entity';
import { WorkflowStep, StepType, StepStatus } from '../entities/workflow-step.entity';
import { Operation, OperationType } from '../entities/operation.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WorkflowService', () => {
  let service: WorkflowService;

  const mockWorkflowRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockStepRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        {
          provide: getRepositoryToken(Workflow),
          useValue: mockWorkflowRepository,
        },
        {
          provide: getRepositoryToken(WorkflowStep),
          useValue: mockStepRepository,
        },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInitialWorkflow', () => {
    it('should create workflow with steps for credit operation', async () => {
      const operation = {
        id: 'operation-123',
        type: OperationType.CREDIT,
      };

      const workflow = {
        id: 'workflow-123',
        name: 'Workflow for credit operation',
        type: WorkflowType.VALIDATION,
        status: WorkflowStatus.PENDING,
        steps: [
          {
            id: 'step-1',
            stepType: StepType.DOCUMENT_UPLOAD,
            status: StepStatus.PENDING,
          },
        ],
      };

      mockWorkflowRepository.create.mockReturnValue(workflow);
      mockWorkflowRepository.save.mockResolvedValue(workflow);

      const result = await service.createInitialWorkflow(operation as Operation);

      expect(result).toEqual(workflow);
      expect(mockWorkflowRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: workflow.name,
          type: workflow.type,
          status: workflow.status,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a workflow if found', async () => {
      const workflow = {
        id: 'workflow-123',
        steps: [],
      };

      mockWorkflowRepository.findOne.mockResolvedValue(workflow);

      const result = await service.findById('workflow-123');

      expect(result).toEqual(workflow);
    });

    it('should throw NotFoundException if workflow not found', async () => {
      mockWorkflowRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOperationId', () => {
    it('should return workflow for operation', async () => {
      const workflow = {
        id: 'workflow-123',
        steps: [],
      };

      mockWorkflowRepository.findOne.mockResolvedValue(workflow);

      const result = await service.findByOperationId('operation-123');

      expect(result).toEqual(workflow);
    });
  });

  describe('update', () => {
    it('should update workflow status', async () => {
      const workflow = {
        id: 'workflow-123',
        status: WorkflowStatus.PENDING,
      };

      const updateDto = {
        status: WorkflowStatus.IN_PROGRESS,
      };

      mockWorkflowRepository.findOne.mockResolvedValue(workflow);
      mockWorkflowRepository.save.mockResolvedValue({ ...workflow, ...updateDto });

      const result = await service.update('workflow-123', updateDto);

      expect(result.status).toBe(WorkflowStatus.IN_PROGRESS);
    });

    it('should validate status transitions', async () => {
      const workflow = {
        id: 'workflow-123',
        status: WorkflowStatus.COMPLETED,
      };

      mockWorkflowRepository.findOne.mockResolvedValue(workflow);

      await expect(
        service.update('workflow-123', { status: WorkflowStatus.PENDING }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStep', () => {
    it('should update step status', async () => {
      const workflow = {
        id: 'workflow-123',
        steps: [
          {
            id: 'step-1',
            status: StepStatus.PENDING,
          },
        ],
      };

      const updateDto = {
        status: StepStatus.IN_PROGRESS,
      };

      mockWorkflowRepository.findOne.mockResolvedValue(workflow);
      mockStepRepository.save.mockResolvedValue({
        ...workflow.steps[0],
        ...updateDto,
      });

      const result = await service.updateStep('workflow-123', 'step-1', updateDto);

      expect(result.status).toBe(StepStatus.IN_PROGRESS);
    });

    it('should validate step status transitions', async () => {
      const workflow = {
        id: 'workflow-123',
        steps: [
          {
            id: 'step-1',
            status: StepStatus.COMPLETED,
          },
        ],
      };

      mockWorkflowRepository.findOne.mockResolvedValue(workflow);

      await expect(
        service.updateStep('workflow-123', 'step-1', { status: StepStatus.PENDING }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('managerValidation', () => {
    it('should handle manager validation step', async () => {
      const workflow = {
        id: 'workflow-123',
        steps: [
          {
            id: 'step-1',
            stepType: StepType.MANAGER_VALIDATION,
            status: StepStatus.PENDING,
          },
        ],
      };

      const validationDto = {
        status: StepStatus.COMPLETED,
        comment: 'Approved',
      };

      mockWorkflowRepository.findOne.mockResolvedValue(workflow);
      mockStepRepository.save.mockResolvedValue({
        ...workflow.steps[0],
        status: validationDto.status,
        metadata: {
          managerValidation: {
            status: validationDto.status,
            comment: validationDto.comment,
            validatedAt: expect.any(String),
          },
        },
      });

      const result = await service.managerValidation('workflow-123', 'step-1', validationDto);

      expect(result.status).toBe(StepStatus.COMPLETED);
      expect(result.metadata?.managerValidation?.comment).toBe('Approved');
    });
  });

  describe('systemCheck', () => {
    it('should handle system check step', async () => {
      const workflow = {
        id: 'workflow-123',
        steps: [
          {
            id: 'step-1',
            stepType: StepType.SYSTEM_CHECK,
            status: StepStatus.PENDING,
          },
        ],
      };

      const checkDto = {
        status: StepStatus.COMPLETED,
        checkedAt: new Date().toISOString(),
        result: 'Pass',
      };

      mockWorkflowRepository.findOne.mockResolvedValue(workflow);
      mockStepRepository.save.mockResolvedValue({
        ...workflow.steps[0],
        status: checkDto.status,
        metadata: {
          systemCheck: {
            status: checkDto.status,
            checkedAt: checkDto.checkedAt,
            result: checkDto.result,
          },
        },
      });

      const result = await service.systemCheck('workflow-123', 'step-1', checkDto);

      expect(result.status).toBe(StepStatus.COMPLETED);
      expect((result as any).metadata?.systemCheck?.result).toBe('Pass');
    });
  });

  describe('refresh', () => {
    it('should refresh workflow state', async () => {
      const workflow = {
        id: 'workflow-123',
        steps: [],
      };

      mockWorkflowRepository.findOne.mockResolvedValue(workflow);

      const result = await service.refresh('workflow-123');

      expect(result).toEqual(workflow);
    });
  });
});