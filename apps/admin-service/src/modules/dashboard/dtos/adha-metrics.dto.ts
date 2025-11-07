import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdhaMetricsDto {
  @ApiProperty({ description: 'Nombre total de demandes de crédit' })
  totalCreditApplications: number;

  @ApiProperty({ description: 'Demandes en attente' })
  pendingApplications: number;

  @ApiProperty({ description: 'Demandes approuvées' })
  approvedApplications: number;

  @ApiProperty({ description: 'Demandes rejetées' })
  rejectedApplications: number;

  @ApiProperty({ description: 'Taux d\'approbation en pourcentage' })
  approvalRate: number;

  @ApiProperty({ description: 'Temps moyen de traitement en minutes' })
  averageProcessingTime: number;

  @ApiProperty({ description: 'Score de crédit moyen' })
  averageCreditScore: number;

  @ApiProperty({ 
    description: 'Répartition des demandes par niveau de risque',
    example: { low: 175, medium: 225, high: 100 }
  })
  applicationsByRiskLevel: Record<string, number>;

  @ApiProperty({
    description: 'Tendance mensuelle des demandes',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        month: { type: 'string', example: '2025-06' },
        count: { type: 'number', example: 85 }
      }
    }
  })
  monthlyApplicationTrend: Array<{ month: string; count: number }>;
}
