import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProspectAnalysis, AnalysisStatus } from '../entities/prospect-analysis.entity';
import { Prospect } from '../entities/prospect.entity';
import { CreateAnalysisDto } from '../dto/create-analysis.dto';

@Injectable()
export class ProspectAnalysisService {
  constructor(
    @InjectRepository(ProspectAnalysis)
    private analysisRepository: Repository<ProspectAnalysis>,
    @InjectRepository(Prospect)
    private prospectRepository: Repository<Prospect>,
  ) {}

  async create(
    prospectId: string,
    createAnalysisDto: CreateAnalysisDto,
    userId: string,
  ): Promise<ProspectAnalysis> {
    // Check if prospect exists
    const prospect = await this.prospectRepository.findOne({
      where: { id: prospectId },
    });

    if (!prospect) {
      throw new NotFoundException(`Prospect with ID ${prospectId} not found`);
    }

    // Create new analysis
    const analysis = this.analysisRepository.create({
      ...createAnalysisDto,
      prospectId,
      createdBy: userId,
      status: AnalysisStatus.IN_PROGRESS,
    });

    return this.analysisRepository.save(analysis);
  }

  async findByProspect(prospectId: string): Promise<ProspectAnalysis[]> {
    // Check if prospect exists
    const prospect = await this.prospectRepository.findOne({
      where: { id: prospectId },
    });

    if (!prospect) {
      throw new NotFoundException(`Prospect with ID ${prospectId} not found`);
    }

    return this.analysisRepository.find({
      where: { prospectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ProspectAnalysis> {
    const analysis = await this.analysisRepository.findOne({
      where: { id },
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis with ID ${id} not found`);
    }

    return analysis;
  }

  async update(
    id: string,
    updateAnalysisDto: Partial<CreateAnalysisDto>,
    userId: string,
  ): Promise<ProspectAnalysis> {
    const analysis = await this.findOne(id);

    // Merge updated fields
    const updatedAnalysis = this.analysisRepository.merge(analysis, {
      ...updateAnalysisDto,
      reviewedBy: userId,
    });

    return this.analysisRepository.save(updatedAnalysis);
  }

  async updateStatus(
    id: string,
    status: AnalysisStatus,
    userId: string,
  ): Promise<ProspectAnalysis> {
    const analysis = await this.findOne(id);

    analysis.status = status;
    analysis.reviewedBy = userId;

    return this.analysisRepository.save(analysis);
  }

  async getProspectScore(prospectId: string): Promise<{ score: number }> {
    // Check if prospect exists
    const prospect = await this.prospectRepository.findOne({
      where: { id: prospectId },
    });

    if (!prospect) {
      throw new NotFoundException(`Prospect with ID ${prospectId} not found`);
    }

    // Get completed analyses
    const analyses = await this.analysisRepository.find({
      where: {
        prospectId,
        status: AnalysisStatus.COMPLETED,
      },
    });

    if (analyses.length === 0) {
      return { score: 0 };
    }

    // Calculate average score
    const totalScore = analyses.reduce((sum, analysis) => sum + analysis.overallScore, 0);
    const averageScore = totalScore / analyses.length;

    return { score: averageScore };
  }
}
