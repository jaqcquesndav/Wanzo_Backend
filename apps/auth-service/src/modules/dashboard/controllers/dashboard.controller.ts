import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../oidc/guards/jwt-auth.guard';
import { RolesGuard } from '../../oidc/guards/roles.guard';
import { Roles } from '../../oidc/decorators/roles.decorator';

@ApiTags('dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('statistics')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Obtenir les statistiques du tableau de bord', 
    description: 'Récupère les statistiques globales pour le tableau de bord d\'administration. Réservé aux administrateurs système.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistiques récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        totalUsers: { type: 'number', example: 1250 },
        activeUsers: { type: 'number', example: 987 },
        totalCompanies: { type: 'number', example: 42 },
        activeCompanies: { type: 'number', example: 38 },
        recentLogins: { type: 'number', example: 125 },
        totalSessions: { type: 'number', example: 578 },
        failedLogins: { type: 'number', example: 23 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non autorisé - Token invalide ou expiré' })
  @ApiResponse({ status: 403, description: 'Interdit - Rôle insuffisant' })
  async getStatistics() {
    const statistics = await this.dashboardService.getStatistics();
    return {
      success: true,
      ...statistics,
    };
  }
}