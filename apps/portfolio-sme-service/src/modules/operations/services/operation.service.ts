import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Operation, OperationType, OperationStatus } from '../entities/operation.entity';
import { CreateOperationDto, UpdateOperationDto, OperationFilterDto } from '../dtos/operation.dto';
import { WorkflowService } from './workflow.service';

@Injectable()
export class OperationService {
  constructor(
    @InjectRepository(Operation)
    private operationRepository: Repository<Operation>,
    private workflowService: WorkflowService,
  ) {}

  async create(createOperationDto: CreateOperationDto, userId: string): Promise<Operation> {
    // Validation spécifique selon le type d'opération
    if (createOperationDto.type === OperationType.CREDIT) {
      if (!createOperationDto.requestedAmount) {
        throw new BadRequestException('Requested amount is required for credit operations');
      }
      if (!createOperationDto.productId) {
        throw new BadRequestException('Product ID is required for credit operations');
      }
    } else if (createOperationDto.type === OperationType.LEASING) {
      if (!createOperationDto.equipmentId) {
        throw new BadRequestException('Equipment ID is required for leasing operations');
      }
    }

    const kiotaId = `KIOTA-OP-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const operation = this.operationRepository.create({
      ...createOperationDto,
      kiotaId,
      createdBy: userId,
      status: OperationStatus.PENDING,
    });

    const savedOperation = await this.operationRepository.save(operation);

    // Créer le workflow associé
    await this.workflowService.createInitialWorkflow(savedOperation);

    return savedOperation;
  }

  async findAll(
    filters: OperationFilterDto,
    page = 1,
    perPage = 10,
  ): Promise<{
    operations: Operation[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.portfolioId) {
      where.portfolioId = filters.portfolioId;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.search) {
      where.description = Like(`%${filters.search}%`);
    }

    const [operations, total] = await this.operationRepository.findAndCount({
      where,
      relations: ['workflow', 'workflow.steps'],
      skip: (page - 1) * perPage,
      take: perPage,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      operations,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<Operation> {
    const operation = await this.operationRepository.findOne({
      where: { id },
      relations: ['workflow', 'workflow.steps'],
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${id} not found`);
    }

    return operation;
  }

  async update(id: string, updateOperationDto: UpdateOperationDto): Promise<Operation> {
    const operation = await this.findById(id);

    // Vérifier si la mise à jour du statut est valide
    if (updateOperationDto.status) {
      this.validateStatusTransition(operation.status, updateOperationDto.status);
    }

    Object.assign(operation, updateOperationDto);
    return await this.operationRepository.save(operation);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const operation = await this.findById(id);

    if (operation.status !== OperationStatus.PENDING) {
      throw new BadRequestException('Only pending operations can be deleted');
    }

    await this.operationRepository.remove(operation);
    return {
      success: true,
      message: 'Operation deleted successfully',
    };
  }

  private validateStatusTransition(currentStatus: OperationStatus, newStatus: OperationStatus): void {
    const validTransitions: Record<OperationStatus, OperationStatus[]> = {
      [OperationStatus.PENDING]: [OperationStatus.ACTIVE, OperationStatus.REJECTED, OperationStatus.CANCELLED],
      [OperationStatus.ACTIVE]: [OperationStatus.COMPLETED, OperationStatus.CANCELLED],
      [OperationStatus.COMPLETED]: [],
      [OperationStatus.REJECTED]: [],
      [OperationStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }
}