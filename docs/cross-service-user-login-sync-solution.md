# Solution : Synchronisation Cross-Service des Connexions Utilisateur

## Problème Identifié

Actuellement, les services métier (accounting-service, gestion_commerciale_service, etc.) créent directement des utilisateurs locaux lors de la première connexion, **sans informer le Customer Service**. Cela crée une incohérence dans les données utilisateur et empêche la propagation automatique des informations.

## Architecture Actuelle (Problématique)

```typescript
// Dans accounting-service/src/modules/auth/strategies/jwt.strategy.ts
if (!user) {
  // ❌ Création directe sans informer Customer Service
  user = this.userRepository.create({
    auth0Id,
    email: payload.email,
    firstName: payload.given_name || 'User',
    lastName: payload.family_name || '',
    organizationId: companyId,
  });
  await this.userRepository.save(user);
}
```

## Solution Proposée

### 1. Service de Synchronisation Cross-Service

Créer un service dans chaque application métier qui communique avec le Customer Service :

```typescript
// apps/accounting-service/src/modules/auth/services/customer-sync.service.ts
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
    this.customerServiceUrl = this.configService.get('CUSTOMER_SERVICE_URL');
  }

  async syncUserWithCustomerService(userData: UserSyncData): Promise<any> {
    try {
      this.logger.log(`Syncing user ${userData.auth0Id} with Customer Service`);
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.customerServiceUrl}/land/api/v1/users/sync`,
          userData,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Service-Name': 'accounting-service', // Identifier le service appelant
            },
          }
        )
      );

      this.logger.log(`User sync successful for ${userData.auth0Id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to sync user with Customer Service: ${error.message}`);
      throw error;
    }
  }
}
```

### 2. Modification des Stratégies JWT

Modifier les stratégies JWT pour utiliser le service de synchronisation :

```typescript
// apps/accounting-service/src/modules/auth/strategies/jwt.strategy.ts (Modifié)
import { CustomerSyncService } from '../services/customer-sync.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
    private readonly customerSyncService: CustomerSyncService, // ✅ Ajout du service
  ) {
    // ... configuration JWT existante
  }

  async validate(req: any, payload: any): Promise<any> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    // Vérification blacklist existante...
    
    this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);
    const auth0Id = payload.sub;

    let user = await this.userRepository.findOne({ where: { auth0Id } });
    
    if (!user) {
      this.logger.log(`User with Auth0 ID ${auth0Id} not found. Syncing with Customer Service first.`);
      
      const companyId = payload['https://wanzo.com/company_id'];
      const userType = payload['https://wanzo.com/user_type'];

      if (!companyId || !userType) {
        this.logger.warn(`Unauthorized access: missing company_id or user_type for user: ${auth0Id}`);
        throw new UnauthorizedException('User is not authorized for this service.');
      }

      try {
        // ✅ Synchronisation avec Customer Service AVANT création locale
        await this.customerSyncService.syncUserWithCustomerService({
          auth0Id,
          email: payload.email,
          name: `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
          firstName: payload.given_name,
          lastName: payload.family_name,
          picture: payload.picture,
          companyId,
          userType,
          metadata: {
            source: 'accounting-service',
            firstLoginFrom: 'accounting-app'
          }
        });

        // À ce point, l'événement user.login a été émis par Customer Service
        // et notre consumer devrait avoir créé/mis à jour l'utilisateur local
        
        // Attendre un court délai pour que l'événement soit traité
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Rechercher à nouveau l'utilisateur (il devrait maintenant exister)
        user = await this.userRepository.findOne({ where: { auth0Id } });
        
        if (!user) {
          // Si l'utilisateur n'existe toujours pas, créer localement en fallback
          this.logger.warn(`User still not found after sync, creating locally as fallback`);
          const existingUsers = await this.userRepository.count({ where: { organizationId: companyId } });
          
          user = this.userRepository.create({
            auth0Id,
            email: payload.email,
            firstName: payload.given_name || 'User',
            lastName: payload.family_name || '',
            profilePicture: payload.picture,
            role: existingUsers === 0 ? UserRole.ADMIN : UserRole.VIEWER,
            organizationId: companyId,
          });
          await this.userRepository.save(user);
        }
        
      } catch (syncError) {
        this.logger.error(`Customer Service sync failed: ${syncError.message}`);
        
        // Fallback : créer l'utilisateur localement si la sync échoue
        const existingUsers = await this.userRepository.count({ where: { organizationId: companyId } });
        
        user = this.userRepository.create({
          auth0Id,
          email: payload.email,
          firstName: payload.given_name || 'User',
          lastName: payload.family_name || '',
          profilePicture: payload.picture,
          role: existingUsers === 0 ? UserRole.ADMIN : UserRole.VIEWER,
          organizationId: companyId,
        });
        await this.userRepository.save(user);
        
        this.logger.log(`Created user locally as fallback for ${auth0Id}`);
      }
    } else {
      // ✅ Pour les utilisateurs existants, informer aussi Customer Service
      try {
        await this.customerSyncService.syncUserWithCustomerService({
          auth0Id,
          email: payload.email,
          name: `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
          firstName: payload.given_name,
          lastName: payload.family_name,
          picture: payload.picture,
          companyId: payload['https://wanzo.com/company_id'],
          userType: payload['https://wanzo.com/user_type'],
          metadata: {
            source: 'accounting-service',
            existingUser: true
          }
        });
      } catch (syncError) {
        this.logger.warn(`Failed to sync existing user login: ${syncError.message}`);
        // Ne pas bloquer si la sync échoue pour un utilisateur existant
      }
    }
    
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const permissions = payload.permissions || [];

    return {
      id: user.id,
      auth0Id: payload.sub,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: permissions,
      organizationId: user.organizationId,
    };
  }
}
```

### 3. Amélioration du Consumer d'Événements

Modifier le consumer existant pour gérer les connexions depuis les apps métier :

```typescript
// apps/accounting-service/src/modules/events/consumers/user-events.consumer.ts (Modifié)
@MessagePattern('user.login')
async handleUserLogin(data: any) {
  const { 
    userId, auth0Id, customerId, companyId, financialInstitutionId,
    email, name, role, userType, accessibleApps, isFirstLogin, metadata 
  } = data;

  this.logger.log(`Received user.login event for ${auth0Id} from ${metadata?.source || 'unknown'}`);

  // Vérification des droits d'accès
  if (!this.hasAccountingAccess(accessibleApps)) {
    this.logger.log(`User ${auth0Id} does not have accounting access`);
    return;
  }

  // ✅ Création/Mise à jour de l'utilisateur local
  let localUser = await this.userRepository.findOne({ where: { auth0Id } });
  
  if (!localUser && isFirstLogin) {
    this.logger.log(`Creating local user for ${auth0Id} from customer service sync`);
    
    const existingUsers = await this.userRepository.count({ 
      where: { organizationId: financialInstitutionId || companyId } 
    });
    
    localUser = this.userRepository.create({
      auth0Id,
      email,
      firstName: name.split(' ')[0] || 'User',
      lastName: name.split(' ').slice(1).join(' ') || '',
      role: existingUsers === 0 ? UserRole.ADMIN : UserRole.VIEWER,
      organizationId: financialInstitutionId || companyId,
      lastLoginAt: new Date(),
    });
    
    await this.userRepository.save(localUser);
    this.logger.log(`Created local user ${localUser.id} for ${auth0Id}`);
  } else if (localUser) {
    // Mise à jour des informations utilisateur
    localUser.email = email;
    localUser.lastLoginAt = new Date();
    await this.userRepository.save(localUser);
    this.logger.log(`Updated local user ${localUser.id} for ${auth0Id}`);
  }

  // Mise à jour de l'activité de l'organisation
  if (financialInstitutionId) {
    await this.organizationService.updateLastActivity(financialInstitutionId);
    
    // Initialisation du compte par défaut si première connexion
    if (isFirstLogin) {
      await this.accountService.initializeDefaultAccount(financialInstitutionId, userId);
    }
  }
}
```

### 4. Configuration et Module

```typescript
// apps/accounting-service/src/modules/auth/auth.module.ts (Modifié)
import { HttpModule } from '@nestjs/axios';
import { CustomerSyncService } from './services/customer-sync.service';

@Module({
  imports: [
    // ... autres imports
    HttpModule, // ✅ Ajout pour les appels HTTP
  ],
  providers: [
    // ... autres providers
    CustomerSyncService, // ✅ Ajout du service de sync
    JwtStrategy,
  ],
  exports: [
    CustomerSyncService, // ✅ Export pour utilisation dans d'autres modules
  ],
})
export class AuthModule {}
```

## Avantages de cette Solution

### ✅ Cohérence des Données
- Toutes les connexions passent par le Customer Service
- Source unique de vérité pour les utilisateurs
- Propagation automatique des événements

### ✅ Résilience
- Système de fallback si Customer Service indisponible
- Gestion des timeouts et erreurs réseau
- Pas de blocage des connexions

### ✅ Traçabilité
- Logs détaillés des synchronisations
- Métadonnées pour identifier l'origine des connexions
- Suivi des échecs de synchronisation

### ✅ Flexibilité
- Chaque service métier peut avoir sa logique spécifique
- Support pour différents types d'utilisateurs
- Configuration per-service

## Flux de Données Amélioré

```mermaid
graph TD
    A[Utilisateur se connecte] --> B[App Métier Frontend]
    B --> C[Service Métier Backend]
    C --> D[JwtStrategy.validate()]
    
    D --> E{Utilisateur existe localement?}
    E -->|Non| F[Appel Customer Service /users/sync]
    E -->|Oui| G[Appel Customer Service /users/sync pour MAJ]
    
    F --> H[Customer Service traite et émet user.login]
    G --> H
    
    H --> I[Kafka: user.login event]
    I --> J[Service Métier Consumer]
    J --> K[Création/MAJ utilisateur local]
    
    D --> L[Continuer authentification]
    L --> M[Utilisateur authentifié]
```

Cette solution garantit que **peu importe l'application** depuis laquelle un utilisateur se connecte, le Customer Service est toujours informé et peut propager les données vers tous les services concernés, tout en maintenant la résilience du système.
