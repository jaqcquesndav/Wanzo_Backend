import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Company } from '../../companies/entities/company.entity';
import { Document } from '../../documents/entities/document.entity';
import { Activity } from '../../activities/entities/activity.entity';
import { DashboardFilterDto } from '../dtos/dashboard.dto';

interface DashboardOverview {
  totalUsers: number;
  totalCompanies: number;
  totalDocuments: number;
}

interface DocumentStatusCount {
  status: string;
  count: string;
}

interface UserRoleCount {
  role: string;
  count: string;
}

interface DashboardStatistics {
  overview: DashboardOverview;
  recentActivities: Activity[];
  documentsByStatus: DocumentStatusCount[];
  usersByRole: UserRoleCount[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
  ) {}

  async getStatistics(filters: DashboardFilterDto): Promise<DashboardStatistics> {
    const { companyId, startDate, endDate } = filters;

    // Filtre pour l'entité Activity (utilise 'timestamp')
    const activityFilter: FindOptionsWhere<Activity> = {};
    if (startDate && endDate) {
      activityFilter.timestamp = Between(new Date(startDate), new Date(endDate));
    }
    if (companyId) {
      activityFilter.companyId = companyId;
    }

    // Filtre pour l'entité Company (utilise 'createdAt')
    const companyFilter: FindOptionsWhere<Company> = {};
    if (startDate && endDate) {
      companyFilter.createdAt = Between(new Date(startDate), new Date(endDate));
    }
    // Si besoin de filtrer par ID de compagnie, décommentez la ligne suivante :
    // if (companyId) { companyFilter.id = companyId; }

    // Filtre pour l'entité Document (utilise 'createdAt')
    const documentFilter: FindOptionsWhere<Document> = {};
    if (startDate && endDate) {
      documentFilter.createdAt = Between(new Date(startDate), new Date(endDate));
    }
    if (companyId) {
      documentFilter.companyId = companyId;
    }

    // Filtre pour l'entité User (utilise 'createdAt')
    const userFilter: FindOptionsWhere<User> = {};
    if (startDate && endDate) {
      userFilter.createdAt = Between(new Date(startDate), new Date(endDate));
    }
    if (companyId) {
      //userFilter.companyId = companyId;
    }

    const [
      totalUsers,
      totalCompanies,
      totalDocuments,
      recentActivities,
      documentsByStatus,
      usersByRole,
    ] = await Promise.all([
      this.userRepository.count({
        where: Object.keys(userFilter).length ? userFilter : undefined,
      }),
      this.companyRepository.count({
        where: Object.keys(companyFilter).length ? companyFilter : undefined,
      }),
      this.documentRepository.count({
        where: Object.keys(documentFilter).length ? documentFilter : undefined,
      }),
      this.activityRepository.find({
        where: Object.keys(activityFilter).length ? activityFilter : undefined,
        order: { timestamp: 'DESC' },
        take: 10,
      }),
      // Regroupement des documents par statut
      this.documentRepository
        .createQueryBuilder('document')
        .select('document.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where(companyId ? 'document.companyId = :companyId' : '1=1', { companyId })
        .groupBy('document.status')
        .getRawMany<DocumentStatusCount>(),
      // Regroupement des utilisateurs par rôle
      this.userRepository
        .createQueryBuilder('user')
        .select('user.role', 'role')
        .addSelect('COUNT(*)', 'count')
        .where(companyId ? 'user.companyId = :companyId' : '1=1', { companyId })
        .groupBy('user.role')
        .getRawMany<UserRoleCount>(),
    ]);

    return {
      overview: {
        totalUsers,
        totalCompanies,
        totalDocuments,
      },
      recentActivities,
      documentsByStatus,
      usersByRole,
    };
  }
}
