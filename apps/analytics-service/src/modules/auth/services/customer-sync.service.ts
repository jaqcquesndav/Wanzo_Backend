import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CustomerSyncService {
  private readonly logger = new Logger(CustomerSyncService.name);
  private readonly customerServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.customerServiceUrl = this.configService.get<string>('CUSTOMER_SERVICE_URL', 'http://localhost:3001');
  }

  async syncUserWithCustomerService(userData: {
    auth0Id: string;
    email: string;
    name: string;
    companyId?: string;
    financialInstitutionId?: string;
    userType: string;
    role?: string;
  }): Promise<any> {
    try {
      this.logger.debug(`🔄 Syncing user ${userData.auth0Id} with Customer Service`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.customerServiceUrl}/users/sync/cross-service`,
          userData,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-service-name': 'analytics-service',
              'x-service-version': '1.0.0',
            },
            timeout: 5000,
          },
        ),
      );

      this.logger.debug(`✅ User sync successful for ${userData.auth0Id}`);
      return response.data;
    } catch (syncError: any) {
      this.logger.error(
        `❌ Customer Service sync failed for user ${userData.auth0Id}: ${syncError.message}`,
        syncError.stack,
      );
      
      // Re-throw l'erreur pour que la JWT strategy puisse la gérer
      throw syncError;
    }
  }
}
