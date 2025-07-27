import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignStatus } from '../entities/campaign.entity';
import { CreateCampaignDto } from '../dto/create-campaign.dto';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
  ) {}

  async findAll(
    status?: CampaignStatus,
    type?: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: Campaign[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const queryBuilder = this.campaignRepository.createQueryBuilder('campaign');

    if (status) {
      queryBuilder.andWhere('campaign.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('campaign.type = :type', { type });
    }

    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / limit);

    const campaigns = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('campaign.createdAt', 'DESC')
      .getMany();

    return {
      data: campaigns,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({ where: { id } });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return campaign;
  }

  async create(createCampaignDto: CreateCampaignDto, userId: string): Promise<Campaign> {
    const campaign = this.campaignRepository.create({
      ...createCampaignDto,
      createdBy: userId,
      metrics: {
        reached: 0,
        responded: 0,
        converted: 0,
        roi: 0,
      },
    });

    return this.campaignRepository.save(campaign);
  }

  async update(id: string, updateCampaignDto: Partial<CreateCampaignDto>): Promise<Campaign> {
    await this.campaignRepository.update(id, updateCampaignDto);
    return this.findOne(id);
  }

  async updateMetrics(
    id: string,
    metrics: { reached?: number; responded?: number; converted?: number; roi?: number },
  ): Promise<Campaign> {
    const campaign = await this.findOne(id);

    campaign.metrics = {
      ...campaign.metrics,
      ...metrics,
    };

    return this.campaignRepository.save(campaign);
  }

  async remove(id: string): Promise<void> {
    await this.campaignRepository.delete(id);
  }
}
