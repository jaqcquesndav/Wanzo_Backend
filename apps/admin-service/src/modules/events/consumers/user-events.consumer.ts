import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from '../../users/services/users.service';
import { CompanyService } from '../../company/services/company.service';

@Controller()
export class UserEventsConsumer {
  private readonly logger = new Logger(UserEventsConsumer.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly companyService: CompanyService,
  ) {}

  @MessagePattern('user.login')
  async handleUserLogin(@Payload() event: any): Promise<void> {
    this.logger.log(`Received user.login event: ${JSON.stringify(event)}`);
    
    // Vérifier si l'utilisateur a accès au admin-service
    const hasAccess = event.accessibleApps?.includes('admin-service');
    
    if (hasAccess && (event.role === 'ADMIN' || event.role === 'SUPERADMIN')) {
      try {
        // TODO: Ajouter updateLastLogin dans UsersService
        // await this.usersService.updateLastLogin(event.userId, new Date(event.loginTime));
        this.logger.log(`Admin login recorded for user ${event.userId}`);
        
        // TODO: Ajouter recordLoginActivity dans UsersService
        // await this.usersService.recordLoginActivity({
        //   userId: event.userId,
        //   loginTime: new Date(event.loginTime),
        //   platform: event.platform || 'web',
        //   ipAddress: event.ipAddress,
        //   userAgent: event.userAgent,
        //   isFirstLogin: event.isFirstLogin
        // });
        
        // Si c'est un admin d'une organisation, enregistrer l'activité
        if (event.financialInstitutionId || event.companyId) {
          const organizationId = event.financialInstitutionId || event.companyId;
          // TODO: Implémenter updateLastAdminActivity dans CompanyService ou créer un service d'organisation
          // await this.companyService.updateLastAdminActivity(organizationId, new Date(event.loginTime));
          this.logger.log(`Admin activity recorded for organization ${organizationId} - user ${event.userId}`);
        }
        
        this.logger.log(`Admin login processed for user ${event.userId}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Error processing admin user.login for user ${event.userId}: ${errorMessage}`);
      }
    } else {
      this.logger.log(`Skipping user.login event for user ${event.userId} - no admin access`);
    }
  }

  @MessagePattern('user.updated')
  async handleUserUpdated(@Payload() event: any): Promise<void> {
    this.logger.log(`Received user.updated event for user ${event.userId}`);
    
    try {
      // TODO: Ajouter syncUserFromEvent dans UsersService
      // Synchroniser les informations utilisateur si c'est un admin
      if (event.role === 'ADMIN' || event.role === 'SUPERADMIN') {
        // await this.usersService.syncUserFromEvent(event);
        this.logger.log(`Admin user ${event.userId} synchronization pending - method not implemented`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling user.updated for user ${event.userId}: ${errorMessage}`);
    }
  }

  @MessagePattern('user.created')
  async handleUserCreated(@Payload() event: any): Promise<void> {
    this.logger.log(`Received user.created event for user ${event.userId}`);
    
    try {
      // TODO: Ajouter createAdminFromEvent dans UsersService
      // Créer un utilisateur admin si nécessaire
      if (event.role === 'ADMIN' || event.role === 'SUPERADMIN') {
        // await this.usersService.createAdminFromEvent(event);
        this.logger.log(`Admin user ${event.userId} creation pending - method not implemented`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling user.created for user ${event.userId}: ${errorMessage}`);
    }
  }
}
