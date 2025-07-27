import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { FundingRequest, FundingRequestStatus } from '../entities/funding-request.entity';
import { CreateFundingRequestDto, UpdateFundingRequestDto, FundingRequestFilterDto } from '../dtos/funding-request.dto';

@Injectable()
export class FundingRequestService {
  constructor(
    @InjectRepository(FundingRequest)
    private fundingRequestRepository: Repository<FundingRequest>,
  ) {}

  async create(createFundingRequestDto: CreateFundingRequestDto, userId: string): Promise<FundingRequest> {
    // Generate a unique request number
    const requestNumber = `REQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const fundingRequest = this.fundingRequestRepository.create({
      ...createFundingRequestDto,
      request_number: requestNumber,
      status: FundingRequestStatus.PENDING,
      status_date: new Date(),
      assigned_to: userId,
    });

    return await this.fundingRequestRepository.save(fundingRequest);
  }

  async findAll(filters: FundingRequestFilterDto): Promise<FundingRequest[]> {
    const queryBuilder = this.fundingRequestRepository.createQueryBuilder('fr');
    
    if (filters.portfolioId) {
      queryBuilder.andWhere('fr.portfolio_id = :portfolioId', { portfolioId: filters.portfolioId });
    }
    
    if (filters.status) {
      queryBuilder.andWhere('fr.status = :status', { status: filters.status });
    }
    
    if (filters.clientId) {
      queryBuilder.andWhere('fr.client_id = :clientId', { clientId: filters.clientId });
    }
    
    if (filters.productType) {
      queryBuilder.andWhere('fr.product_type = :productType', { productType: filters.productType });
    }
    
    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere('fr.created_at BETWEEN :dateFrom AND :dateTo', { 
        dateFrom: new Date(filters.dateFrom), 
        dateTo: new Date(filters.dateTo) 
      });
    } else if (filters.dateFrom) {
      queryBuilder.andWhere('fr.created_at >= :dateFrom', { dateFrom: new Date(filters.dateFrom) });
    } else if (filters.dateTo) {
      queryBuilder.andWhere('fr.created_at <= :dateTo', { dateTo: new Date(filters.dateTo) });
    }
    
    if (filters.search) {
      queryBuilder.andWhere('(fr.request_number LIKE :search OR fr.company_name LIKE :search)', { 
        search: `%${filters.search}%` 
      });
    }
    
    if (filters.sortBy && filters.sortOrder) {
      const sortField = this.getSortField(filters.sortBy);
      queryBuilder.orderBy(sortField, filters.sortOrder.toUpperCase() as 'ASC' | 'DESC');
    } else {
      queryBuilder.orderBy('fr.created_at', 'DESC');
    }
    
    return await queryBuilder.getMany();
  }

  private getSortField(sortBy: string): string {
    switch (sortBy) {
      case 'created_at':
        return 'fr.created_at';
      case 'amount':
        return 'fr.amount';
      case 'client_name':
        return 'fr.company_name';
      default:
        return 'fr.created_at';
    }
  }

  async findById(id: string): Promise<FundingRequest> {
    const fundingRequest = await this.fundingRequestRepository.findOne({ where: { id } });
    if (!fundingRequest) {
      throw new NotFoundException(`Funding request with ID ${id} not found`);
    }
    return fundingRequest;
  }

  async update(id: string, updateFundingRequestDto: UpdateFundingRequestDto): Promise<FundingRequest> {
    const fundingRequest = await this.findById(id);
    
    // Don't allow updating a request that is already approved, rejected, or canceled
    if (
      fundingRequest.status === FundingRequestStatus.APPROVED ||
      fundingRequest.status === FundingRequestStatus.REJECTED ||
      fundingRequest.status === FundingRequestStatus.CANCELED ||
      fundingRequest.status === FundingRequestStatus.DISBURSED
    ) {
      throw new BadRequestException(`Cannot update a funding request with status ${fundingRequest.status}`);
    }
    
    Object.assign(fundingRequest, updateFundingRequestDto);
    
    return await this.fundingRequestRepository.save(fundingRequest);
  }

  async updateStatus(id: string, status: FundingRequestStatus, notes: string, userId: string): Promise<FundingRequest> {
    const fundingRequest = await this.findById(id);
    
    // Validate status transition
    this.validateStatusTransition(fundingRequest.status, status);
    
    fundingRequest.status = status;
    fundingRequest.status_date = new Date();
    
    // Update assigned_to if changing to under_review
    if (status === FundingRequestStatus.UNDER_REVIEW) {
      fundingRequest.assigned_to = userId;
    }
    
    return await this.fundingRequestRepository.save(fundingRequest);
  }

  private validateStatusTransition(currentStatus: FundingRequestStatus, newStatus: FundingRequestStatus): void {
    const validTransitions: Record<FundingRequestStatus, FundingRequestStatus[]> = {
      [FundingRequestStatus.PENDING]: [
        FundingRequestStatus.UNDER_REVIEW,
        FundingRequestStatus.CANCELED
      ],
      [FundingRequestStatus.UNDER_REVIEW]: [
        FundingRequestStatus.APPROVED,
        FundingRequestStatus.REJECTED,
        FundingRequestStatus.PENDING
      ],
      [FundingRequestStatus.APPROVED]: [
        FundingRequestStatus.DISBURSED,
        FundingRequestStatus.CANCELED
      ],
      [FundingRequestStatus.REJECTED]: [],
      [FundingRequestStatus.CANCELED]: [],
      [FundingRequestStatus.DISBURSED]: []
    };
    
    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const fundingRequest = await this.findById(id);
    
    // Only allow deleting if status is pending
    if (fundingRequest.status !== FundingRequestStatus.PENDING) {
      throw new BadRequestException(`Cannot delete a funding request with status ${fundingRequest.status}`);
    }
    
    await this.fundingRequestRepository.remove(fundingRequest);
    
    return {
      success: true,
      message: `Funding request ${id} has been successfully deleted`
    };
  }
}
