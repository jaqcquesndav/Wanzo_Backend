import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { ProspectAnalysis, AnalysisStatus } from '../entities/prospect-analysis.entity';
import { CreateAnalysisDto, UpdateAnalysisDto, AnalysisFilterDto } from '../dtos/prospect-analysis.dto';

@Injectable()
export class ProspectAnalysisService {
  constructor(
    @InjectRepository(ProspectAnalysis)
    private analysisRepository: Repository<ProspectAnalysis>,
  ) {}

  async create(
    prospectId: string,
    createAnalysisDto: CreateAnalysisDto,
    userId: string,
  ): Promise<ProspectAnalysis> {
    const analysis = this.analysisRepository.create({
      ...createAnalysisDto,
      prospectId,
      analyzedBy: userId,
      status: AnalysisStatus.IN_PROGRESS,
    });

    return await this.analysisRepository.save(analysis);
  }

  async findAll(
    filters: AnalysisFilterDto,
    page = 1,
    perPage = 10,
  ): Promise<{
    analyses: ProspectAnalysis[];
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

    if (filters.minScore) {
      where.overallScore = Between(filters.minScore, filters.maxScore || 100);
    }

    if (filters.search) {
      where.summary = Like(`%${filters.search}%`);
    }

    const [analyses, total] = await this.analysisRepository.findAndCount({
      where,
      relations: ['prospect'],
      skip: (page - 1) * perPage,
      take: perPage,
      order: { createdAt: 'DESC' },
    });

    return {
      analyses,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<ProspectAnalysis> {
    const analysis = await this.analysisRepository.findOne({
      where: { id },
      relations: ['prospect'],
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis with ID ${id} not found`);
    }

    return analysis;
  }

  async update(id: string, updateAnalysisDto: UpdateAnalysisDto, reviewerId?: string): Promise<ProspectAnalysis> {
    const analysis = await this.findById(id);

    if (updateAnalysisDto.status === AnalysisStatus.COMPLETED && reviewerId) {
      analysis.reviewedBy = reviewerId;
    }

    Object.assign(analysis, updateAnalysisDto);
    return await this.analysisRepository.save(analysis);
  }

  async findByProspect(prospectId: string): Promise<ProspectAnalysis[]> {
    return await this.analysisRepository.find({
      where: { prospectId },
      order: { createdAt: 'DESC' },
    });
  }

  async getLatestAnalysis(prospectId: string): Promise<ProspectAnalysis | null> {
    return await this.analysisRepository.findOne({
      where: { prospectId },
      order: { createdAt: 'DESC' },
    });
  }

  async calculateAggregateScore(prospectId: string): Promise<number> {
    const analyses = await this.findByProspect(prospectId);
    
    if (analyses.length === 0) {
      return 0;
    }

    const weightedScores = analyses.map(analysis => ({
      score: analysis.overallScore,
      weight: this.getAnalysisTypeWeight(analysis.type),
    }));

    const totalWeight = weightedScores.reduce((sum, item) => sum + item.weight, 0);
    const weightedSum = weightedScores.reduce((sum, item) => sum + (item.score * item.weight), 0);

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private getAnalysisTypeWeight(type: string): number {
    const weights: Record<string, number> = {
      financial: 0.4,
      market: 0.3,
      operational: 0.2,
      risk: 0.1,
    };

    return weights[type] || 0.25;
  }
}