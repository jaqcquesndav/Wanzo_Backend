import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

interface Auth0User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  user_metadata?: any;
  app_metadata?: any;
}

interface CreateAuth0UserDto {
  email: string;
  password?: string;
  name: string;
  connection: string;
  user_metadata?: any;
  app_metadata?: any;
}

@Injectable()
export class Auth0ManagementService {
  private readonly logger = new Logger(Auth0ManagementService.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get Auth0 Management API access token using M2M credentials
   */
  private async getManagementToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const domain = this.configService.get('AUTH0_DOMAIN');
      const clientId = this.configService.get('AUTH0_M2M_CLIENT_ID');
      const clientSecret = this.configService.get('AUTH0_M2M_CLIENT_SECRET');
      const audience = `https://${domain}/api/v2/`;

      const response = await axios.post(`https://${domain}/oauth/token`, {
        client_id: clientId,
        client_secret: clientSecret,
        audience,
        grant_type: 'client_credentials',
      });

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in;
      this.tokenExpiry = new Date(Date.now() + (expiresIn - 60) * 1000); // Refresh 1 minute before expiry

      this.logger.debug('Successfully obtained Auth0 Management API token');
      return this.accessToken!;
    } catch (error) {
      this.logger.error('Failed to get Auth0 Management API token', error);
      throw new Error('Failed to authenticate with Auth0 Management API');
    }
  }

  /**
   * Create a secondary user in Auth0 for a company
   */
  async createSecondaryUser(createUserDto: CreateAuth0UserDto): Promise<Auth0User> {
    try {
      const token = await this.getManagementToken();
      const domain = this.configService.get('AUTH0_DOMAIN');

      const response = await axios.post(
        `https://${domain}/api/v2/users`,
        {
          email: createUserDto.email,
          password: createUserDto.password || this.generateTemporaryPassword(),
          name: createUserDto.name,
          connection: createUserDto.connection || 'Username-Password-Authentication',
          user_metadata: createUserDto.user_metadata || {},
          app_metadata: createUserDto.app_metadata || {},
          email_verified: false, // User will need to verify email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.debug(`Successfully created Auth0 user: ${createUserDto.email}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Failed to create Auth0 user: ${createUserDto.email}`, axiosError.response?.data || axiosError);
      throw new Error(`Failed to create user in Auth0: ${(axiosError.response?.data as any)?.message || axiosError.message}`);
    }
  }

  /**
   * Update user metadata in Auth0
   */
  async updateUserMetadata(userId: string, userMetadata: any, appMetadata?: any): Promise<Auth0User> {
    try {
      const token = await this.getManagementToken();
      const domain = this.configService.get('AUTH0_DOMAIN');

      const updateData: any = {};
      if (userMetadata) updateData.user_metadata = userMetadata;
      if (appMetadata) updateData.app_metadata = appMetadata;

      const response = await axios.patch(
        `https://${domain}/api/v2/users/${userId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.debug(`Successfully updated Auth0 user metadata: ${userId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Failed to update Auth0 user metadata: ${userId}`, axiosError);
      throw new Error(`Failed to update user metadata in Auth0: ${(axiosError.response?.data as any)?.message || axiosError.message}`);
    }
  }

  /**
   * Get user by ID from Auth0
   */
  async getUserById(userId: string): Promise<Auth0User> {
    try {
      const token = await this.getManagementToken();
      const domain = this.configService.get('AUTH0_DOMAIN');

      const response = await axios.get(
        `https://${domain}/api/v2/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Failed to get Auth0 user: ${userId}`, axiosError);
      throw new Error(`Failed to get user from Auth0: ${(axiosError.response?.data as any)?.message || axiosError.message}`);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const token = await this.getManagementToken();
      const domain = this.configService.get('AUTH0_DOMAIN');

      await axios.post(
        `https://${domain}/api/v2/tickets/password-change`,
        {
          result_url: this.configService.get('FRONTEND_URL'),
          user_id: undefined, // Will be resolved by email
          email,
          connection_id: 'Username-Password-Authentication',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.debug(`Successfully sent password reset email to: ${email}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Failed to send password reset email to: ${email}`, axiosError);
      throw new Error(`Failed to send password reset email: ${(axiosError.response?.data as any)?.message || axiosError.message}`);
    }
  }

  /**
   * Generate a temporary password for new users
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Assign roles to user in Auth0
   */
  async assignRolesToUser(userId: string, roleIds: string[]): Promise<void> {
    try {
      const token = await this.getManagementToken();
      const domain = this.configService.get('AUTH0_DOMAIN');

      await axios.post(
        `https://${domain}/api/v2/users/${userId}/roles`,
        { roles: roleIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.debug(`Successfully assigned roles to user: ${userId}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Failed to assign roles to user: ${userId}`, axiosError);
      throw new Error(`Failed to assign roles: ${(axiosError.response?.data as any)?.message || axiosError.message}`);
    }
  }
}
