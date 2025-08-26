import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardMetricsDto {
  @ApiProperty({ description: 'Nombre total d\'utilisateurs' })
  totalUsers: number;

  @ApiProperty({ description: 'Utilisateurs actifs ce mois' })
  activeUsersThisMonth: number;

  @ApiProperty({ description: 'Nouveaux utilisateurs aujourd\'hui' })
  newUsersToday: number;

  @ApiProperty({ description: 'Taux de croissance des utilisateurs' })
  userGrowthRate: number;

  @ApiProperty({ description: 'Nombre total de clients' })
  totalCustomers: number;

  @ApiProperty({ description: 'Clients actifs' })
  activeCustomers: number;

  @ApiProperty({ description: 'Nouveaux clients ce mois' })
  newCustomersThisMonth: number;

  @ApiProperty({ description: 'Taux de rétention des clients' })
  customerRetentionRate: number;

  @ApiProperty({ description: 'Revenus totaux estimés' })
  totalRevenue: number;

  @ApiProperty({ description: 'Revenus mensuels' })
  monthlyRevenue: number;

  @ApiProperty({ description: 'Taux de croissance des revenus' })
  revenueGrowthRate: number;

  @ApiProperty({ description: 'État de santé du système' })
  systemHealth: number;

  @ApiProperty({ description: 'Temps de réponse moyen' })
  averageResponseTime: number;

  @ApiProperty({ description: 'Taux d\'erreur' })
  errorRate: number;
}
