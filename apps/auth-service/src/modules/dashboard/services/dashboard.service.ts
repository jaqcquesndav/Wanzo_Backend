import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../../oidc/entities/user.entity';
import { OIDCClient } from '../../oidc/entities/client.entity';
import { OIDCSession } from '../../oidc/entities/session.entity';
import { AuthorizationCode } from '../../oidc/entities/authorization-code.entity';

interface DashboardStatistics {
  totalUsers: number;
  totalClients: number;
  totalSessions: number;
  activeAuthorizations: number;
  usersByRole: Array<{ role: string; count: string }>;
  sessionsByClient: Array<{ clientId: string; count: string }>;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OIDCClient)
    private clientRepository: Repository<OIDCClient>,
    @InjectRepository(OIDCSession)
    private sessionRepository: Repository<OIDCSession>,
    @InjectRepository(AuthorizationCode)
    private authorizationCodeRepository: Repository<AuthorizationCode>,
  ) {}

  async getStatistics(): Promise<DashboardStatistics> {
    const [
      totalUsers,
      totalClients,
      totalSessions,
      activeAuthorizations,
      usersByRole,
      sessionsByClient,
    ] = await Promise.all([
      this.userRepository.count(),
      this.clientRepository.count({ where: { active: true } }),
      this.sessionRepository.count(),
      this.authorizationCodeRepository.count({ 
        where: { expiresAt: MoreThan(new Date()) } 
      }),
      this.userRepository
        .createQueryBuilder('user')
        .select('user.role', 'role')
        .addSelect('COUNT(*)', 'count')
        .groupBy('user.role')
        .getRawMany(),
      this.sessionRepository
        .createQueryBuilder('session')
        .select('session.clientId', 'clientId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('session.clientId')
        .getRawMany(),
    ]);

    return {
      totalUsers,
      totalClients,
      totalSessions,
      activeAuthorizations,
      usersByRole,
      sessionsByClient,
    };
  }
}