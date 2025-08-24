import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface UserSyncData {
  auth0Id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  companyId?: string;
  userType: string;
  metadata?: any;
}

@Injectable()
export class CustomerSyncService {
  private readonly logger = new Logger(CustomerSyncService.name);
  private readonly customerServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.customerServiceUrl = this.configService.get('CUSTOMER_SERVICE_URL') || 'http://localhost:3001';
  }

  async syncUserWithCustomerService(userData: UserSyncData): Promise<any> {
    try {
      this.logger.log(`🔄 Syncing user ${userData.auth0Id} with Customer Service`);
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.customerServiceUrl}/land/api/v1/users/sync/cross-service`,
          userData,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Service-Name': 'accounting-service',
              'X-Sync-Source': 'cross-service-login',
            },
            timeout: 5000, // 5 secondes timeout
          }
        )
      );

      this.logger.log(`✅ User sync successful for ${userData.auth0Id}`);
      return response.data;
    } catch (syncError: any) {
      this.logger.error(`❌ Failed to sync user with Customer Service: ${syncError.message}`);
      throw syncError;
    }
  }

  async notifyUserLogin(userData: UserSyncData): Promise<boolean> {
    try {
      await this.syncUserWithCustomerService(userData);
      return true;
    } catch (syncError: any) {
      this.logger.warn(`Sync failed but continuing with local authentication: ${syncError.message}`);
      return false;
    }
  }
}
