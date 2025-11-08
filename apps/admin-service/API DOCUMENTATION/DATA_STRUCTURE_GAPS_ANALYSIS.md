# Analyse des Écarts - Structures de Données Admin Service

## Résumé Exécutif

Cette analyse identifie les écarts entre le code source actuel du service admin et sa documentation API. L'analyse révèle des différences significatives dans les structures de données, nouveaux endpoints, et évolutions des DTOs qui nécessitent une mise à jour complète de la documentation.

---

## 1. MODULE USERS - Écarts Majeurs Identifiés

### **A. Nouvelles Propriétés dans l'Entité User**

```typescript
// Nouvelles propriétés non documentées
@Column({ nullable: true, name: 'id_agent' })
idAgent?: string;  // ID Agent (exemple: 'IKH12345')

@Column({ nullable: true, name: 'validity_end' })
validityEnd?: Date;  // Date de fin de validité

@Column({ nullable: true })
language?: string;  // Langue préférée

@Column({ nullable: true })
timezone?: string;  // Fuseau horaire

@Column({ type: 'simple-json', nullable: true })
kyc?: {
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  documents?: Array<{
    type: string;
    verified: boolean;
    uploadedAt: string;
  }>;
};

@Column({ nullable: true, name: 'auth0_id' })
auth0Id?: string;  // Intégration Auth0

// Champs sécurisés
@Column({ select: false, nullable: true })
password?: string;

@Column({ nullable: true, select: false })
twoFactorSecret?: string;

@Column({ nullable: true, select: false })
resetPasswordToken?: string;

@Column({ type: 'timestamp', nullable: true, select: false })
resetPasswordExpires?: Date;
```

### **B. Nouveaux Rôles Utilisateur**

```typescript
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CTO = 'cto',
  GROWTH_FINANCE = 'growth_finance',
  CUSTOMER_SUPPORT = 'customer_support',
  CONTENT_MANAGER = 'content_manager',
  CUSTOMER_MANAGER = 'customer_manager',      // ← NOUVEAU
  FINANCIAL_ADMIN = 'financial_admin',        // ← NOUVEAU
  COMPANY_ADMIN = 'company_admin',
  COMPANY_USER = 'company_user',
}
```

### **C. Structure des Permissions Mise à Jour**

```typescript
// ANCIEN (documenté) - Tableau simple
permissions?: string[];

// NOUVEAU (implémenté) - Tableau d'objets avec applicationId
permissions?: {
  applicationId: string;
  permissions: string[];
}[];
```

### **D. DTO Controller Mismatch**

- **Documenté**: `UserQueryParamsDto`
- **Implémenté**: `UserFilterDto`

---

## 2. MODULE AUTH - Écarts Majeurs Identifiés

### **A. UserProfileDto Enrichi**

```typescript
export class UserProfileDto {
  // Nouvelles propriétés non documentées
  organizationId?: string;          // ID organisation
  idAgent?: string;                 // ID Agent
  validityEnd?: string;             // Date fin validité
  language?: string;                // Langue préférée
  timezone?: string;                // Fuseau horaire
  
  // Support KYC complet
  kyc?: KycInfoDto;
}
```

### **B. Support KYC Complet**

```typescript
export class KycDocumentDto {
  type: string;
  verified?: boolean;
  uploadedAt?: string;
}

export class KycInfoDto {
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  documents?: KycDocumentDto[];
}
```

### **C. Endpoints Manquants dans la Documentation**

- Endpoints 2FA (Enable2FAResponseDto, Verify2FADto)
- Refresh token endpoints (RefreshTokenDto, RefreshTokenResponseDto)

---

## 3. MODULE COMPANY - Écarts Identifiés

### **A. Nouveau Endpoint Statistiques**

```typescript
@Get('stats')
@Roles(UserRole.SUPER_ADMIN, UserRole.CTO, UserRole.GROWTH_FINANCE)
async getCompanyStatistics()
```

### **B. Structure Locations Plus Complexe**

```typescript
// Location avec coordonnées et type
export class AddLocationDto {
  address: string;
  coordinates?: { lat: number; lng: number };
  type: string;  // ex: 'headquarters', 'branch', 'warehouse'
}
```

---

## 4. MODULE CUSTOMERS - Écarts Identifiés

### **A. Structures de Réponse Plus Riches**

```typescript
// Support détaillé avec CustomerDetailsResponseDto
export class CustomerDetailsResponseDto {
  customer: CustomerDto;
  documents: CustomerDocumentDto[];
  activities: CustomerActivityDto[];
  statistics: any;
}
```

### **B. Upload de Documents Multipart**

```typescript
@UseInterceptors(FileInterceptor('file', {
  storage: diskStorage({...}),
  fileFilter: (...),
  limits: { fileSize: 5 * 1024 * 1024 }
}))
async uploadDocument(...)
```

### **C. Garde de Sécurité Différente**

- **Implémenté**: `JwtBlacklistGuard`
- **Documenté**: `RolesGuard`

---

## 5. MODULE DASHBOARD - Écarts Identifiés

### **A. Système de Rôles Différent**

```typescript
// Implémenté
@Roles(Role.Admin)  // Utilise Role.Admin

// Documenté  
// Utilise UserRole enum
```

### **B. Nouveaux Endpoints Non Documentés**

```typescript
@Get('widgets/:widgetId')
async getWidgetData(...)

@Get('configuration')
async getDashboardConfiguration(...)

@Put('configuration')
async updateDashboardConfiguration(...)

@Get('statistics/sales')
async getSalesStatistics(...)

@Get('statistics/user-engagement')
async getUserEngagementStatistics(...)
```

---

## 6. MODULE SETTINGS - Écarts Identifiés

### **A. Système de Permissions Granulaire**

```typescript
// Permissions string-based au lieu d'enum
@Roles('admin:settings:read')
@Roles('admin:settings:write')
```

### **B. Endpoints App-Level Settings**

```typescript
@Get('app')
async getAppSettings(): Promise<AppSettingsResponseDto>

@Put('app/:id')
async updateApplicationSetting(...)
```

### **C. DTOs Plus Détaillés**

```typescript
// Nouveaux DTOs non documentés
TwoFactorSettingsDto
ActiveSessionsResponseDto
LoginHistoryResponseDto
NotificationPreferencesResponseDto
UpdateNotificationPreferenceDto
UpdateAllNotificationPreferencesDto
```

---

## 7. MODULES NON ANALYSÉS

Les modules suivants nécessitent une analyse complète :

- **Finance**: Structures financières, abonnements, factures
- **Documents**: Gestion documentaire avancée
- **System**: Monitoring, logs, santé système
- **Chat**: Support et communication
- **Adha-context**: Intégration IA
- **Tokens**: Gestion des tokens
- **Kafka Events**: Communication inter-services

---

## 8. RECOMMANDATIONS PRIORITAIRES

### **Haute Priorité**
1. **Mettre à jour ADMIN_API_DOCUMENTATION.md** avec toutes les nouvelles structures
2. **Documenter les nouveaux rôles** CUSTOMER_MANAGER et FINANCIAL_ADMIN
3. **Corriger les structures de permissions** (objet vs array)
4. **Ajouter les propriétés KYC** dans tous les DTOs utilisateur

### **Moyenne Priorité**
1. **Documenter les nouveaux endpoints Dashboard**
2. **Mettre à jour les structures Company** avec coordinates et type
3. **Corriger les guards** utilisés dans les différents modules

### **Basse Priorité**
1. **Standardiser les systèmes de rôles** entre modules
2. **Compléter l'analyse des modules Finance, System, Documents**

---

## 9. IMPACT SUR L'INTÉGRATION FRONTEND

### **Structures de Données Modifiées**
- Les frontends utilisant les permissions doivent adapter le format objet
- Les nouveaux champs utilisateur nécessitent une mise à jour des interfaces
- Les endpoints Dashboard enrichis permettent plus de fonctionnalités

### **Nouveaux Endpoints Disponibles**
- Configuration dashboard personnalisable
- Statistiques company détaillées
- Endpoints app-level settings

### **Authentification et Sécurité**
- Support KYC complet pour validation utilisateur
- Intégration Auth0 avec auth0Id
- Support 2FA avec nouveaux DTOs

---

*Rapport généré le : 8 novembre 2025*
*Analysé par : Assistant IA - Analyse code source vs documentation*