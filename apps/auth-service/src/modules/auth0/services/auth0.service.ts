import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios, { AxiosError } from 'axios';

@Injectable()
export class Auth0Service {
  private readonly logger = new Logger(Auth0Service.name);

  /**
   * Cache pour le token de management, évite de redemander à Auth0
   */
  private managementTokenCache: { token: string; expiresAt: number } | null = null;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valide le token en appelant Auth0 /userinfo
   * (Éventuellement, tu peux faire un check sur l'aud/iss)
   */
  async validateToken(token: string): Promise<any> {
    const domain = this.configService.get<string>('auth0.domain');
    try {
      // On appelle /userinfo pour valider le token
      const response = await axios.get(`https://${domain}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'Error validating token');
      // Par exemple, si c’est 401 => token expiré
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Échange le code + code_verifier contre un access_token, id_token, refresh_token
   * (en supposant que ton application Auth0 est configurée pour offline_access)
   */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<any> {
    const domain = this.configService.get<string>('auth0.domain');
    const clientId = this.configService.get<string>('auth0.clientId');
    const clientSecret = this.configService.get<string>('auth0.clientSecret');
    const redirectUri = this.configService.get<string>('auth0.callbackUrl');

    this.logger.debug(`Exchanging code for token with domain: ${domain}`);

    const payload = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    };

    try {
      const response = await axios.post(`https://${domain}/oauth/token`, payload);

      // Pour la sécurité, on peut logger la forme de la réponse, mais pas le token en entier
      this.logger.debug(`Received tokens from Auth0: ${Object.keys(response.data).join(', ')}`);

      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'Error exchanging code for token');
      throw new UnauthorizedException(
        'Could not exchange authorization code for tokens (Auth0 error)',
      );
    }
  }

  /**
   * Rafraîchit un access_token grâce au refresh_token
   */
  async refreshToken(refreshToken: string): Promise<any> {
    const domain = this.configService.get<string>('auth0.domain');
    const clientId = this.configService.get<string>('auth0.clientId');
    const clientSecret = this.configService.get<string>('auth0.clientSecret');

    this.logger.debug(`Refreshing token with domain: ${domain}`);

    const payload = {
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    };

    try {
      const response = await axios.post(`https://${domain}/oauth/token`, payload);

      this.logger.debug('Successfully refreshed token');
      this.logger.debug(`New access_token keys: ${Object.keys(response.data).join(', ')}`);

      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'Error refreshing token');

      // Vérifie si c’est un invalid_grant => refresh token expiré
      if (error instanceof AxiosError && error.response?.data?.error === 'invalid_grant') {
        throw new UnauthorizedException('Refresh token invalid or expired');
      }

      // Autre erreur
      throw new UnauthorizedException('Failed to refresh token');
    }
  }

  /**
   * Récupère le token de management. Mise en cache pour éviter de le regénérer.
   * On ajoute un buffer de 5 minutes avant expiration.
   */
  async getManagementApiToken(): Promise<string> {
    // Check si on a déjà un token valide
    const now = Date.now();
    if (
      this.managementTokenCache &&
      this.managementTokenCache.expiresAt > now + 5 * 60 * 1000 // 5min buffer
    ) {
      this.logger.debug('Using cached management API token');
      return this.managementTokenCache.token;
    }

    // Sinon, on en demande un nouveau
    const domain = this.configService.get<string>('auth0.domain');
    const clientId = this.configService.get<string>('auth0.clientId');
    const clientSecret = this.configService.get<string>('auth0.clientSecret');

    this.logger.debug(`Requesting new management API token for domain: ${domain}`);

    try {
      const response = await axios.post(`https://${domain}/oauth/token`, {
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`,
        grant_type: 'client_credentials',
        // scopes si besoin
        scope: 'create:users update:users read:users',
      });

      const { access_token, expires_in } = response.data;
      if (!access_token) {
        throw new InternalServerErrorException('No access_token received from Auth0');
      }

      // On calcule la date d’expiration
      const expiresAt = now + expires_in * 1000;
      this.managementTokenCache = { token: access_token, expiresAt };

      this.logger.debug('Successfully obtained new management API token');
      this.logger.debug(`Management token will expire at: ${new Date(expiresAt).toISOString()}`);

      return access_token;
    } catch (error) {
      this.handleAxiosError(error, 'Error getting management API token');
      throw new InternalServerErrorException('Could not retrieve management API token');
    }
  }

  /**
   * Récupère les rôles d’un utilisateur
   */
  async getUserRoles(userId: string): Promise<string[]> {
    const token = await this.getManagementApiToken();
    const domain = this.configService.get<string>('auth0.domain');

    try {
      const response = await axios.get(`https://${domain}/api/v2/users/${userId}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.map((role: any) => role.name);
    } catch (error) {
      this.handleAxiosError(error, `Error getting roles for user ${userId}`);
      throw new UnauthorizedException('Could not get user roles');
    }
  }

  /**
   * Crée un utilisateur dans Auth0 (Username-Password-Authentication)
   */
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    companyId?: string;
    role?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const token = await this.getManagementApiToken();
    const domain = this.configService.get<string>('auth0.domain');
    const connection = 'Username-Password-Authentication';

    const user = {
      email: userData.email,
      password: userData.password,
      name: userData.name,
      connection,
      user_metadata: {
        companyId: userData.companyId,
        ...userData.metadata,
      },
      app_metadata: {
        role: userData.role || 'user',
      },
      email_verified: false,
    };

    this.logger.debug(`Creating user with email: ${userData.email}, role: ${userData.role}`);

    try {
      const response = await axios.post(`https://${domain}/api/v2/users`, user, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Si un rôle est spécifié, l'assigner
      const createdUser = response.data;
      if (userData.role) {
        await this.assignRoleToUser(createdUser.user_id, userData.role);
      }

      this.logger.debug(`User created successfully: ${createdUser.user_id}`);
      return createdUser;
    } catch (error) {
      this.handleAxiosError(error, 'Error creating user');

      // ex: si Auth0 retourne "user_exists"
      if (error instanceof AxiosError && error.response?.data?.error === 'user_exists') {
        throw new UnauthorizedException('User already exists');
      }

      throw new InternalServerErrorException('Failed to create user in Auth0');
    }
  }

  /**
   * Assigne un rôle à un utilisateur
   */
  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    const token = await this.getManagementApiToken();
    const domain = this.configService.get<string>('auth0.domain');

    this.logger.debug(`Assigning role ${roleName} to user ${userId}`);

    try {
      // 1. Récupérer tous les rôles
      const rolesResponse = await axios.get(`https://${domain}/api/v2/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 2. Trouver celui qui correspond au roleName
      const role = rolesResponse.data.find((r: any) => r.name === roleName);
      if (!role) {
        this.logger.error(`Role "${roleName}" not found in Auth0 tenant`);
        throw new UnauthorizedException(`Role "${roleName}" not found`);
      }
      this.logger.debug(`Found role ID: ${role.id} for role name: ${roleName}`);

      // 3. Assigner le rôle
      await axios.post(
        `https://${domain}/api/v2/users/${userId}/roles`,
        { roles: [role.id] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.debug(`Role ${roleName} successfully assigned to user ${userId}`);
    } catch (error) {
      this.handleAxiosError(error, `Error assigning role ${roleName} to user ${userId}`);
      throw new InternalServerErrorException('Failed to assign role to user');
    }
  }

  /**
   * Crée un compte initial (superadmin + entreprise)
   * Appelle createUser(...) et assigne le rôle "superadmin"
   */
  async createInitialAccount(data: {
    name: string;
    adminEmail: string;
    adminPassword: string;
    adminName: string;
    companyDetails: Record<string, any>;
  }): Promise<{
    user: Record<string, any>;
    companyId: string;
  }> {
    const companyId = `company-${Date.now()}`;

    this.logger.debug(
      `Creating initial account for company: ${data.name}, admin: ${data.adminEmail}`,
    );

    try {
      // On crée l'utilisateur superadmin
      const user = await this.createUser({
        email: data.adminEmail,
        password: data.adminPassword,
        name: data.adminName,
        companyId,
        role: 'superadmin',
        metadata: {
          isCompanyOwner: true,
          initialCompanyName: data.name,
        },
      });

      this.logger.debug(`Initial account created successfully for user ID: ${user.user_id}`);

      // Dans un vrai système, on notifierait le service admin (webhook ou MQ)
      return {
        user,
        companyId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create initial account: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Gère et loggue les erreurs Axios
   */
  private handleAxiosError(error: any, context: string): void {
    if (error instanceof AxiosError) {
      this.logger.error(`${context}: ${error.message}`);
      if (error.response) {
        this.logger.error(`Status: ${error.response.status}`);
        this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      if (error.config) {
        this.logger.debug(`Request URL: ${error.config.url}`);
        this.logger.debug(`Request method: ${error.config.method}`);
      }
    } else {
      this.logger.error(`${context}: ${error.message}`);
    }
  }
}
