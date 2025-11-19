import { Controller, Get, Param, Post, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserStateManagerService } from '../services/user-state-manager.service';
import { UserSyncManagerService } from '../services/user-sync-manager.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Contrôleur pour la gestion des états intermédiaires et de la synchronisation
 * Endpoints d'administration et de monitoring
 */
@ApiTags('User State & Sync Management')
@ApiBearerAuth()
@Controller('users/state-management')
@UseGuards(JwtAuthGuard)
export class UserStateManagementController {
  constructor(
    private readonly userStateManager: UserStateManagerService,
    private readonly userSyncManager: UserSyncManagerService,
  ) {}

  /**
   * Obtenir les statistiques de complétion des profils
   */
  @Get('profile-completion/stats')
  @ApiOperation({ summary: 'Statistiques de complétion des profils' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistiques récupérées' })
  async getProfileCompletionStats() {
    return await this.userStateManager.getProfileCompletionStats();
  }

  /**
   * Obtenir les statistiques de synchronisation
   */
  @Get('sync/stats')
  @ApiOperation({ summary: 'Statistiques de synchronisation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistiques récupérées' })
  async getSyncStats() {
    return await this.userSyncManager.getSyncStats();
  }

  /**
   * Marquer un profil comme en cours de complétion
   */
  @Post(':userId/profile/mark-in-progress')
  @ApiOperation({ summary: 'Marquer le profil comme en cours' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profil marqué en cours' })
  async markProfileInProgress(@Param('userId') userId: string) {
    await this.userStateManager.markProfileInProgress(userId);
    return { success: true, message: 'Profile marked as in progress' };
  }

  /**
   * Marquer un profil comme complété
   */
  @Post(':userId/profile/complete')
  @ApiOperation({ summary: 'Marquer le profil comme complété' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profil complété' })
  async markProfileCompleted(@Param('userId') userId: string) {
    await this.userStateManager.markProfileCompleted(userId);
    return { success: true, message: 'Profile marked as completed' };
  }

  /**
   * Réactiver un profil expiré
   */
  @Post(':userId/profile/reactivate')
  @ApiOperation({ summary: 'Réactiver un profil expiré' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profil réactivé' })
  async reactivateExpiredProfile(
    @Param('userId') userId: string,
    @Body() body: { extensionDays?: number }
  ) {
    await this.userStateManager.reactivateExpiredProfile(userId, body.extensionDays || 7);
    return { success: true, message: 'Profile reactivated' };
  }

  /**
   * Forcer la synchronisation d'un user
   */
  @Post(':userId/sync/force')
  @ApiOperation({ summary: 'Forcer la synchronisation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Synchronisation lancée' })
  async forceSync(@Param('userId') userId: string) {
    await this.userSyncManager.forceResync(userId);
    return { success: true, message: 'Sync initiated' };
  }

  /**
   * Réconcilier les données d'un user
   */
  @Post(':userId/sync/reconcile')
  @ApiOperation({ summary: 'Réconcilier les données utilisateur' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Réconciliation effectuée' })
  async reconcileUser(@Param('userId') userId: string) {
    const result = await this.userSyncManager.reconcileUserData(userId);
    return {
      success: true,
      isConsistent: result.isConsistent,
      discrepancies: result.discrepancies,
    };
  }

  /**
   * Marquer un service comme synchronisé (pour tests)
   */
  @Post(':userId/sync/mark-service-synced')
  @ApiOperation({ summary: 'Marquer un service comme synchronisé' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service marqué' })
  async markServiceSynced(
    @Param('userId') userId: string,
    @Body() body: { serviceName: string }
  ) {
    await this.userSyncManager.markServiceSynced(userId, body.serviceName);
    return { success: true, message: `Service ${body.serviceName} marked as synced` };
  }

  /**
   * Marquer un service comme en échec (pour tests)
   */
  @Post(':userId/sync/mark-service-failed')
  @ApiOperation({ summary: 'Marquer un service comme en échec' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service marqué' })
  async markServiceFailed(
    @Param('userId') userId: string,
    @Body() body: { serviceName: string; error: string }
  ) {
    await this.userSyncManager.markServiceFailed(userId, body.serviceName, body.error);
    return { success: true, message: `Service ${body.serviceName} marked as failed` };
  }
}
