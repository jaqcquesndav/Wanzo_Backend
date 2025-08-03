import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditRequest, CreditRequestStatus } from '../entities/credit-request.entity';
import { CreateCreditRequestDto, UpdateCreditRequestDto, CreditRequestFilterDto } from '../dtos/credit-request.dto';

@Injectable()
export class CreditRequestService {
  constructor(
    @InjectRepository(CreditRequest)
    private creditRequestRepository: Repository<CreditRequest>,
  ) {}

  async create(createCreditRequestDto: CreateCreditRequestDto, userId: string): Promise<CreditRequest> {
    const creditRequest = this.creditRequestRepository.create({
      ...createCreditRequestDto,
      receptionDate: new Date(createCreditRequestDto.receptionDate),
    });

    return await this.creditRequestRepository.save(creditRequest);
  }

  async findAll(filters: CreditRequestFilterDto, page: number, limit: number) {
    const queryBuilder = this.creditRequestRepository.createQueryBuilder('creditRequest');

    // Apply filters
    if (filters.portfolioId) {
      queryBuilder.andWhere('creditRequest.portfolioId = :portfolioId', { portfolioId: filters.portfolioId });
    }

    if (filters.status) {
      queryBuilder.andWhere('creditRequest.status = :status', { status: filters.status });
    }

    if (filters.clientId) {
      queryBuilder.andWhere('creditRequest.memberId = :memberId', { memberId: filters.clientId });
    }

    if (filters.productType) {
      queryBuilder.andWhere('creditRequest.productId = :productId', { productId: filters.productType });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('creditRequest.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('creditRequest.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(creditRequest.reason ILIKE :search OR creditRequest.financingPurpose ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    queryBuilder.orderBy(`creditRequest.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [creditRequests, total] = await queryBuilder.getManyAndCount();

    return {
      creditRequests,
      total,
      page,
      perPage: limit,
    };
  }

  async findById(id: string): Promise<CreditRequest> {
    const creditRequest = await this.creditRequestRepository.findOne({
      where: { id },
      relations: ['portfolio'],
    });

    if (!creditRequest) {
      throw new NotFoundException(`Credit request with ID ${id} not found`);
    }

    return creditRequest;
  }

  async update(id: string, updateCreditRequestDto: UpdateCreditRequestDto): Promise<CreditRequest> {
    const creditRequest = await this.findById(id);

    Object.assign(creditRequest, updateCreditRequestDto);

    return await this.creditRequestRepository.save(creditRequest);
  }

  async delete(id: string): Promise<{ message: string }> {
    const creditRequest = await this.findById(id);

    if (creditRequest.status === CreditRequestStatus.APPROVED || creditRequest.status === CreditRequestStatus.DISBURSED) {
      throw new ConflictException('Cannot delete approved or disbursed credit request');
    }

    await this.creditRequestRepository.remove(creditRequest);

    return { message: 'Credit request deleted successfully' };
  }

  async approve(id: string, approvalData: { notes?: string }): Promise<CreditRequest> {
    const creditRequest = await this.findById(id);

    if (creditRequest.status !== CreditRequestStatus.PENDING && creditRequest.status !== CreditRequestStatus.ANALYSIS) {
      throw new ConflictException('Credit request cannot be approved in current status');
    }

    creditRequest.status = CreditRequestStatus.APPROVED;
    creditRequest.updatedAt = new Date();

    return await this.creditRequestRepository.save(creditRequest);
  }

  async reject(id: string, rejectionData: { reason: string; notes?: string }): Promise<CreditRequest> {
    const creditRequest = await this.findById(id);

    if (creditRequest.status === CreditRequestStatus.APPROVED || creditRequest.status === CreditRequestStatus.DISBURSED) {
      throw new ConflictException('Cannot reject approved or disbursed credit request');
    }

    creditRequest.status = CreditRequestStatus.REJECTED;
    creditRequest.updatedAt = new Date();

    return await this.creditRequestRepository.save(creditRequest);
  }
}
