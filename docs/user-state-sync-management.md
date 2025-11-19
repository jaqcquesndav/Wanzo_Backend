# Gestion des États Intermédiaires et Synchronisation Asynchrone

## 📋 Vue d'Ensemble

Ce document décrit l'implémentation de la gestion robuste des états intermédiaires et de la synchronisation asynchrone pour le système Wanzo.

## 🎯 Problèmes Résolus

### 1. États Intermédiaires des Utilisateurs

**Problème**: Les utilisateurs créés au premier login n'avaient pas de company associée, créant un état indéterminé.

**Solution**: Nouveau système d'états avec gestion du cycle de vie:

```typescript
export enum UserStatus {
  ACTIVE = 'active',
  PENDING_PROFILE = 'pending_profile',  // ✅ NOUVEAU: User sans organisation
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum ProfileCompletionStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}
```

**Fonctionnalités**:
- ✅ Deadline de 7 jours pour compléter le profil
- ✅ Rappels automatiques à J-5, J-3, J-1
- ✅ Désactivation automatique après expiration
- ✅ Réactivation manuelle par admin

### 2. Synchronisation Kafka avec Retry

**Problème**: Les événements Kafka pouvaient échouer sans mécanisme de retry, causant des désynchronisations.

**Solution**: Système de retry avec exponential backoff:

```typescript
export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SYNCED = 'synced',
  FAILED = 'failed',
  RETRY = 'retry',
}
```

**Fonctionnalités**:
- ✅ Retry automatique avec délais croissants: 1s, 5s, 15s, 1min, 5min
- ✅ Maximum 5 tentatives
- ✅ Réinitialisation du compteur après 24h
- ✅ Cron job pour vérifier les syncs en échec toutes les 30 minutes

### 3. Idempotence et Réconciliation

**Problème**: Risque de traiter plusieurs fois le même événement ou d'avoir des données incohérentes.

**Solution**: Système de confirmation bidirectionnel:

```typescript
// Dans customer-service
await customerEventsProducer.emitUserCreated(user);

// Dans accounting-service (exemple)
@MessagePattern(UserEventTopics.USER_CREATED)
async handleUserCreated(event: UserCreatedEvent) {
  // Vérifier idempotence
  const exists = await this.userService.findByAuth0Id(event.userId);
  if (exists) {
    await this.syncHelper.confirmUserSync(event.userId, this.kafkaClient);
    return;
  }
  
  // Traiter et confirmer
  const user = await this.userService.create(...);
  await this.syncHelper.confirmUserSync(event.userId, this.kafkaClient);
}
```

## 🏗️ Architecture

### Services Créés

#### 1. `UserStateManagerService`
Gère les états intermédiaires des profils utilisateurs:

```typescript
class UserStateManagerService {
  // Initialiser l'état pour un nouveau user
  initializeUserState(user: User): void
  
  // Marquer comme complété
  markProfileCompleted(userId: string): Promise<void>
  
  // Vérifier et envoyer rappels (Cron: tous les jours à 10h)
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  checkIncompleteProfiles(): Promise<void>
  
  // Gérer les profils expirés
  handleExpiredProfile(user: User): Promise<void>
  
  // Réactiver un profil expiré (admin)
  reactivateExpiredProfile(userId: string, extensionDays: number): Promise<void>
}
```

#### 2. `UserSyncManagerService`
Gère la synchronisation Kafka avec retry et réconciliation:

```typescript
class UserSyncManagerService {
  // Initialiser le statut de sync
  initializeSyncStatus(user: User, servicesToSync: string[]): void
  
  // Synchroniser avec retry automatique
  syncUserWithRetry(userId: string): Promise<boolean>
  
  // Vérifier les syncs en échec (Cron: toutes les 30 minutes)
  @Cron(CronExpression.EVERY_30_MINUTES)
  checkFailedSyncs(): Promise<void>
  
  // Marquer un service comme synchronisé
  markServiceSynced(userId: string, serviceName: string): Promise<void>
  
  // Réconcilier les données
  reconcileUserData(userId: string): Promise<ReconciliationResult>
  
  // Forcer une resynchronisation
  forceResync(userId: string): Promise<void>
}
```

#### 3. `SyncConfirmationConsumer`
Consumer pour les confirmations des autres services:

```typescript
class SyncConfirmationConsumer {
  @EventPattern('sync.user.confirmed')
  handleSyncConfirmed(event): Promise<void>
  
  @EventPattern('sync.user.failed')
  handleSyncFailed(event): Promise<void>
  
  @EventPattern('sync.user.reconciliation.request')
  handleReconciliationRequest(event): Promise<void>
}
```

#### 4. `UserSyncConfirmationHelper`
Helper partagé pour les autres microservices:

```typescript
class UserSyncConfirmationHelper {
  // Confirmer succès
  confirmUserSync(userId: string, kafkaClient: any): Promise<void>
  
  // Signaler échec
  reportSyncFailure(userId: string, kafkaClient: any, error: Error): Promise<void>
  
  // Demander réconciliation
  requestReconciliation(userId: string, kafkaClient: any, reason: string): Promise<void>
}
```

## 🔄 Workflow Complet

### Création d'un Nouveau User

```
1. User Login (Auth0)
   ↓
2. UserService.syncUser()
   ↓
3. Créer User avec status = PENDING_PROFILE
   ↓
4. UserStateManager.initializeUserState()
   ├─ profileCompletionDeadline = now + 7 days
   ├─ profileCompletionStatus = NOT_STARTED
   └─ status = PENDING_PROFILE
   ↓
5. UserSyncManager.initializeSyncStatus()
   ├─ syncStatus = PENDING
   ├─ servicesToSync = ['gestion_commerciale', 'accounting', ...]
   └─ syncMetadata = { ... }
   ↓
6. UserSyncManager.syncUserWithRetry()
   ├─ Tente d'émettre événement Kafka
   ├─ Si échec → Schedule retry avec backoff
   └─ Si succès → syncStatus = SYNCED
   ↓
7. Autres services consument l'événement
   ├─ Traitement local
   └─ Émission 'sync.user.confirmed' ou 'sync.user.failed'
   ↓
8. SyncConfirmationConsumer reçoit les confirmations
   └─ Met à jour syncMetadata.syncedServices
```

### Complétion du Profil

```
1. User complète son profil (crée company/institution)
   ↓
2. UserStateManager.markProfileCompleted()
   ├─ profileCompletionStatus = COMPLETED
   ├─ profileCompletedAt = now
   ├─ status = ACTIVE
   └─ profileCompletionDeadline = null
   ↓
3. Association User ↔ Customer
   ├─ user.customerId = customer.id
   └─ user.companyId ou financialInstitutionId = customer.id
   ↓
4. Resynchronisation si nécessaire
   └─ UserSyncManager.forceResync()
```

### Gestion des Rappels (Cron Job)

```
Tous les jours à 10h00:
1. UserStateManager.checkIncompleteProfiles()
   ↓
2. Pour chaque user avec PENDING_PROFILE:
   ├─ Calculer jours restants
   │
   ├─ Si deadline dépassée:
   │  ├─ profileCompletionStatus = EXPIRED
   │  ├─ status = INACTIVE
   │  └─ Notification admin
   │
   └─ Si J-5, J-3, ou J-1:
      ├─ Envoyer rappel email
      └─ Incrémenter profileCompletionReminders
```

### Gestion des Sync en Échec (Cron Job)

```
Toutes les 30 minutes:
1. UserSyncManager.checkFailedSyncs()
   ↓
2. Pour chaque user avec syncStatus = RETRY ou FAILED:
   ├─ Si > 24h depuis dernière tentative:
   │  └─ Réinitialiser syncRetryCount = 0
   │
   └─ Si syncRetryCount < 5:
      └─ syncUserWithRetry()
```

## 📊 Nouveaux Champs dans User Entity

```typescript
// États de profil
profileCompletionStatus: ProfileCompletionStatus
profileCompletionDeadline: Date | null
profileCompletedAt: Date | null
profileCompletionReminders: number

// États de synchronisation
syncStatus: SyncStatus
lastSyncAttempt: Date | null
syncRetryCount: number
lastSyncError: string | null
syncMetadata: {
  servicesToSync: string[]
  syncedServices: string[]
  failedServices: string[]
  lastSuccessfulSync: Record<string, string>
}
```

## 🛠️ Nouveaux Endpoints

### Gestion d'État

```
GET    /users/state-management/profile-completion/stats
GET    /users/state-management/sync/stats
POST   /users/state-management/:userId/profile/mark-in-progress
POST   /users/state-management/:userId/profile/complete
POST   /users/state-management/:userId/profile/reactivate
POST   /users/state-management/:userId/sync/force
POST   /users/state-management/:userId/sync/reconcile
POST   /users/state-management/:userId/sync/mark-service-synced
POST   /users/state-management/:userId/sync/mark-service-failed
```

## 📈 Monitoring et Métriques

### Statistiques de Profil
```json
{
  "notStarted": 15,
  "inProgress": 8,
  "completed": 234,
  "expired": 3,
  "total": 260
}
```

### Statistiques de Sync
```json
{
  "pending": 5,
  "inProgress": 2,
  "synced": 248,
  "failed": 3,
  "retry": 2,
  "total": 260
}
```

## 🔧 Configuration Recommandée

### Environment Variables
```bash
# Timeouts
PROFILE_COMPLETION_DEADLINE_DAYS=7
MAX_PROFILE_REMINDERS=3

# Retry Configuration
MAX_SYNC_RETRY_ATTEMPTS=5
SYNC_RETRY_DELAYS=1000,5000,15000,60000,300000  # ms

# Cron Jobs
PROFILE_CHECK_CRON="0 10 * * *"  # Tous les jours à 10h
SYNC_CHECK_CRON="*/30 * * * *"   # Toutes les 30 minutes
CLEANUP_CRON="0 0 * * *"         # Tous les jours à minuit
```

## 🎯 Bénéfices

1. **Résilience**: Retry automatique avec exponential backoff
2. **Traçabilité**: Tous les états de sync sont enregistrés
3. **Cohérence**: Système de confirmation bidirectionnel
4. **Idempotence**: Protection contre les doublons
5. **Monitoring**: Statistiques et métriques détaillées
6. **Réconciliation**: Détection et correction des incohérences
7. **Expérience Utilisateur**: Rappels automatiques pour complétion du profil
8. **Administration**: Outils de gestion et déboggage

## 🚀 Prochaines Étapes

1. Implémenter le système de notifications (email/SMS) pour les rappels
2. Ajouter un dashboard de monitoring
3. Créer des alertes pour les taux de sync en échec
4. Implémenter le helper dans tous les microservices
5. Ajouter des tests unitaires et d'intégration
6. Documenter les patterns d'implémentation pour les nouveaux services
