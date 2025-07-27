import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Prospect, ProspectStatus, PortfolioType } from '../entities/prospect.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Prospect)
    private prospectRepository: Repository<Prospect>,
  ) {}

  async getProspectionStats(period: 'week' | 'month' | 'quarter' | 'year'): Promise<any> {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1); // Default to month
    }

    // Fetch prospects within the date range
    const prospects = await this.prospectRepository.find({
      where: {
        createdAt: MoreThanOrEqual(startDate),
      },
    });

    // Count new opportunities
    const newOpportunities = prospects.length;

    // Count qualified opportunities
    const qualifiedOpportunities = prospects.filter(
      prospect => prospect.status === ProspectStatus.QUALIFIED
    ).length;

    // Count won opportunities
    const wonOpportunities = prospects.filter(
      prospect => prospect.status === ProspectStatus.CLOSED_WON
    ).length;

    // Count lost opportunities
    const lostOpportunities = prospects.filter(
      prospect => prospect.status === ProspectStatus.CLOSED_LOST
    ).length;

    // Calculate conversion rate
    const conversionRate = newOpportunities > 0
      ? Math.round((wonOpportunities / newOpportunities) * 100)
      : 0;

    // Calculate average deal size
    const wonProspects = prospects.filter(
      prospect => prospect.status === ProspectStatus.CLOSED_WON && prospect.amount
    );
    const totalAmount = wonProspects.reduce((sum, prospect) => sum + (prospect.amount || 0), 0);
    const averageDealSize = wonProspects.length > 0 ? totalAmount / wonProspects.length : 0;

    // Calculate total potential value
    const qualifiedProspects = prospects.filter(
      prospect => 
        (prospect.status === ProspectStatus.QUALIFIED || 
         prospect.status === ProspectStatus.PROPOSAL ||
         prospect.status === ProspectStatus.NEGOTIATION) && 
        prospect.amount
    );
    const totalPotentialValue = qualifiedProspects.reduce((sum, prospect) => sum + (prospect.amount || 0), 0);

    // Group by type
    const byType = {
      traditional: prospects.filter(p => p.portfolioType === PortfolioType.TRADITIONAL).length,
      investment: prospects.filter(p => p.portfolioType === PortfolioType.INVESTMENT).length,
      leasing: prospects.filter(p => p.portfolioType === PortfolioType.LEASING).length,
    };

    // Group by stage
    const byStage = {
      new: prospects.filter(p => p.status === ProspectStatus.NEW).length,
      qualified: prospects.filter(p => p.status === ProspectStatus.QUALIFIED).length,
      proposal: prospects.filter(p => p.status === ProspectStatus.PROPOSAL).length,
      negotiation: prospects.filter(p => p.status === ProspectStatus.NEGOTIATION).length,
    };

    // Top performers (mock data - in a real implementation this would use user data)
    const topPerformers = [
      {
        userId: 'user-123456',
        name: 'Jean Dupont',
        opportunities: 8,
        closed: 3,
        value: 1500000,
      },
      {
        userId: 'user-123457',
        name: 'Marie Martin',
        opportunities: 7,
        closed: 2,
        value: 1200000,
      },
    ];

    return {
      period,
      newOpportunities,
      qualifiedOpportunities,
      wonOpportunities,
      lostOpportunities,
      conversionRate,
      averageDealSize,
      totalPotentialValue,
      averageSalesCycle: 45, // Mock data - in a real implementation this would be calculated
      topPerformers,
      byType,
      byStage,
    };
  }
}
