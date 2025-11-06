# Plan de Mise en Conformité - Customer Service API v2.0

**Date** : 5 novembre 2025  
**Objectif** : Rendre le customer-service conforme à la documentation API v2.0  
**Contraintes** : Données de test supprimables, nouvelles tables autorisées  

## 🎯 Résumé de l'Analyse

### ✅ Points Déjà Conformes
- **API Gateway** : Route déjà `/land/api/v1/*` vers customer-service ✓
- **Authentification Auth0** : Système en place ✓  
- **Structure modulaire** : Séparation SME/Institution ✓
- **Base PostgreSQL** : Infrastructure correcte ✓
- **Contrôleurs Company** : Base fonctionnelle ✓

### ❌ Écarts Majeurs à Corriger
1. **Endpoints utilisateurs** : Manque `/users/me`, `/users/verify-phone`, etc.
2. **Formulaire d'identification étendu** : EnterpriseIdentificationForm absent
3. **Système d'abonnements** : Tokens pas intégrés aux plans
4. **Relations User-Customer** : Structure pas optimale
5. **DTOs modernes** : Manque UserSettings, IdentityDocument, etc.

## 🚀 Plan d'Implémentation par Phases

### 📊 PHASE 1 : Entités et Structure (Priorité Critique)

#### 1.1 Nouvelles Entités TypeORM à Créer

```typescript
// 🔧 À créer : src/modules/system-users/entities/user-settings.entity.ts
@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  userId: string;
  
  @Column('jsonb')
  notifications: {
    email: { marketing: boolean; security: boolean; updates: boolean; billing: boolean; };
    sms: { security: boolean; billing: boolean; alerts: boolean; };
    push: { enabled: boolean; marketing: boolean; updates: boolean; };
  };
  
  @Column('jsonb')
  privacy: {
    profileVisibility: 'public' | 'private' | 'company_only';
    dataSharing: boolean;
    analyticsOptOut: boolean;
  };
  
  @Column('jsonb')
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: 'fr' | 'en' | 'ln';
    dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
    currency: 'USD' | 'CDF' | 'EUR';
    timezone: string;
  };
  
  @Column('jsonb')
  security: {
    twoFactorEnabled: boolean;
    loginNotifications: boolean;
    sessionTimeout: number;
    allowedIpAddresses?: string[];
  };
}

// 🔧 À créer : src/modules/system-users/entities/identity-document.entity.ts
@Entity('identity_documents')
export class IdentityDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  userId: string;
  
  @Column({ type: 'enum', enum: ['national_id', 'passport', 'driver_license', 'residence_permit', 'other'] })
  type: string;
  
  @Column()
  number: string;
  
  @Column({ nullable: true })
  issuedDate?: Date;
  
  @Column({ nullable: true })
  expiryDate?: Date;
  
  @Column({ nullable: true })
  issuingAuthority?: string;
  
  @Column({ nullable: true })
  documentUrl?: string;
  
  @Column({ type: 'enum', enum: ['pending', 'verified', 'rejected', 'expired'], default: 'pending' })
  status: string;
  
  @Column({ nullable: true })
  verifiedAt?: Date;
  
  @Column({ nullable: true })
  rejectionReason?: string;
}

// 🔧 À créer : src/modules/customers/entities/enterprise-identification-form.entity.ts
@Entity('enterprise_identification_forms')
export class EnterpriseIdentificationForm {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  customerId: string;
  
  @Column('jsonb')
  generalInfo: {
    companyName: string;
    tradeName?: string;
    legalForm: string;
    companyType: 'startup' | 'traditional';
    sector: string;
    foundingDate?: Date;
    headquarters: {
      address: string;
      city: string;
      commune?: string;
      province: string;
      country: string;
      coordinates?: { lat: number; lng: number; };
    };
    mainContact: {
      name: string;
      position: string;
      email: string;
      phone: string;
      alternativePhone?: string;
    };
    digitalPresence?: {
      website?: string;
      facebook?: string;
      linkedin?: string;
      instagram?: string;
      twitter?: string;
    };
  };
  
  @Column('jsonb', { nullable: true })
  legalInfo?: {
    rccm?: string;
    taxNumber?: string;
    nationalId?: string;
    employerNumber?: string;
    socialSecurityNumber?: string;
    businessLicense?: {
      number: string;
      issuedBy: string;
      issuedDate: Date;
      expiryDate?: Date;
    };
    operatingLicenses?: Array<{
      type: string;
      number: string;
      issuedBy: string;
      issuedDate: Date;
      expiryDate?: Date;
    }>;
    taxCompliance: {
      isUpToDate: boolean;
      lastFilingDate?: Date;
      nextFilingDue?: Date;
    };
    legalStatus: {
      hasLegalIssues: boolean;
      issues?: string[];
      hasGovernmentContracts: boolean;
      contractTypes?: string[];
    };
  };
  
  @Column('jsonb', { nullable: true })
  patrimonyAndMeans?: {
    shareCapital: {
      authorizedCapital: number;
      paidUpCapital: number;
      currency: 'USD' | 'CDF' | 'EUR';
      shareholders: Array<{
        name: string;
        type: 'individual' | 'corporate';
        sharePercentage: number;
        paidAmount: number;
      }>;
    };
    realEstate?: Array<{
      type: 'office' | 'warehouse' | 'factory' | 'store' | 'land';
      address: string;
      surface: number;
      value: number;
      currency: string;
      isOwned: boolean;
      monthlyRent?: number;
    }>;
    equipment?: Array<{
      category: string;
      description: string;
      quantity: number;
      unitValue: number;
      totalValue: number;
      currency: string;
      acquisitionDate: Date;
      condition: 'new' | 'good' | 'fair' | 'poor';
    }>;
    vehicles?: Array<{
      type: 'car' | 'truck' | 'motorcycle' | 'other';
      brand: string;
      model: string;
      year: number;
      value: number;
      currency: string;
      isOwned: boolean;
    }>;
    humanResources: {
      totalEmployees: number;
      permanentEmployees: number;
      temporaryEmployees: number;
      consultants: number;
      keyPersonnel: Array<{
        name: string;
        position: string;
        experience: number;
        education: string;
        isShareholder: boolean;
      }>;
    };
  };
  
  @Column('jsonb', { nullable: true })
  specificities?: {
    startup?: {
      stage: 'idea' | 'prototype' | 'mvp' | 'early_revenue' | 'growth' | 'expansion';
      fundraising: {
        hasRaised: boolean;
        totalRaised?: number;
        currency?: string;
        investors?: Array<{
          name: string;
          type: 'angel' | 'vc' | 'accelerator' | 'family_office' | 'other';
          amount: number;
          date: Date;
        }>;
      };
      innovation: {
        intellectualProperty?: Array<{
          type: 'patent' | 'trademark' | 'copyright' | 'trade_secret';
          title: string;
          registrationNumber?: string;
          status: 'pending' | 'registered' | 'expired';
        }>;
        technologyStack?: string[];
        researchPartnership?: Array<{
          institution: string;
          type: 'university' | 'research_center' | 'corporate_lab';
          projectTitle: string;
        }>;
      };
    };
    traditional?: {
      operatingHistory: {
        yearsInBusiness: number;
        majorMilestones: Array<{
          year: number;
          milestone: string;
          impact: string;
        }>;
      };
      marketPosition: {
        marketShare?: number;
        competitorAnalysis?: string;
        competitiveAdvantages: string[];
      };
      supplierNetwork: Array<{
        name: string;
        relationship: 'exclusive' | 'preferred' | 'regular';
        yearsOfRelationship: number;
        isLocal: boolean;
      }>;
      customerBase: {
        totalCustomers: number;
        repeatCustomerRate: number;
        averageCustomerValue: number;
        customerTypes: ('b2b' | 'b2c' | 'government')[];
      };
    };
  };
  
  @Column('jsonb', { nullable: true })
  performance?: {
    financial: {
      revenue: Array<{
        year: number;
        amount: number;
        currency: string;
        isProjected: boolean;
      }>;
      profitability: Array<{
        year: number;
        grossProfit: number;
        netProfit: number;
        currency: string;
        margins: {
          gross: number;
          net: number;
        };
      }>;
      cashFlow: {
        monthly: Array<{
          month: string;
          inflow: number;
          outflow: number;
          netFlow: number;
        }>;
      };
      financingNeeds?: {
        amount: number;
        currency: string;
        purpose: string[];
        timeframe: string;
        hasAppliedBefore: boolean;
        previousApplications?: Array<{
          institution: string;
          amount: number;
          result: 'approved' | 'rejected' | 'pending';
          date: Date;
        }>;
      };
    };
    operational: {
      productivity: {
        outputPerEmployee?: number;
        revenuePerEmployee?: number;
        utilizationRate?: number;
      };
      quality: {
        defectRate?: number;
        customerSatisfaction?: number;
        returnRate?: number;
      };
      efficiency: {
        orderFulfillmentTime?: number;
        inventoryTurnover?: number;
        costPerUnit?: number;
      };
    };
    market: {
      growth: {
        customerGrowthRate: number;
        marketExpansion: string[];
        newProductsLaunched: number;
      };
      digital: {
        onlinePresence: {
          website: boolean;
          ecommerce: boolean;
          socialMedia: string[];
        };
        digitalSales?: number;
      };
    };
  };
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 1.2 Modifications Entités Existantes

```typescript
// 🔧 À modifier : src/modules/system-users/entities/user.entity.ts
// Ajouter relations et champs manquants
export class User {
  // ... champs existants ...
  
  // ➕ NOUVEAUX CHAMPS
  @Column({ nullable: true })
  birthdate?: Date;
  
  @Column({ nullable: true })
  bio?: string;
  
  @Column({ nullable: true })
  timezone?: string;
  
  // ➕ NOUVELLES RELATIONS
  @OneToOne(() => UserSettings, { cascade: true })
  @JoinColumn()
  settings?: UserSettings;
  
  @OneToMany(() => IdentityDocument, doc => doc.userId)
  identityDocuments?: IdentityDocument[];
  
  // ✏️ MODIFICATION: Améliorer la relation Customer
  @ManyToOne(() => Customer, customer => customer.users, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;
}

// 🔧 À modifier : src/modules/customers/entities/customer.entity.ts
// Ajouter relation au formulaire d'identification étendu
export class Customer {
  // ... champs existants ...
  
  // ➕ NOUVELLE RELATION
  @OneToOne(() => EnterpriseIdentificationForm, { cascade: true, nullable: true })
  @JoinColumn()
  extendedIdentification?: EnterpriseIdentificationForm;
}
```

### 📱 PHASE 2 : Nouveaux DTOs (Priorité Haute)

#### 2.1 DTOs Utilisateurs

```typescript
// 🔧 À créer : src/modules/system-users/dto/user.dto.ts
export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  name?: string;
  
  @IsOptional()
  @IsString()
  givenName?: string;
  
  @IsOptional()
  @IsString()
  familyName?: string;
  
  @IsOptional()
  @IsString()
  bio?: string;
  
  @IsOptional()
  @IsString()
  phone?: string;
  
  @IsOptional()
  @IsDateString()
  birthdate?: string;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => UserAddressDto)
  address?: UserAddressDto;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => UserSettingsDto)
  settings?: UserSettingsDto;
}

export class UserAddressDto {
  @IsOptional()
  @IsString()
  street?: string;
  
  @IsOptional()
  @IsString()
  city?: string;
  
  @IsOptional()
  @IsString()
  province?: string;
  
  @IsOptional()
  @IsString()
  country?: string;
  
  @IsOptional()
  @IsString()
  postalCode?: string;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

export class UserSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => PrivacySettingsDto)
  privacy?: PrivacySettingsDto;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => DisplaySettingsDto)
  display?: DisplaySettingsDto;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => SecuritySettingsDto)
  security?: SecuritySettingsDto;
}

export class VerifyPhoneDto {
  @IsString()
  phoneNumber: string;
  
  @IsEnum(['sms', 'call'])
  method: 'sms' | 'call';
}

export class ConfirmPhoneVerificationDto {
  @IsString()
  verificationId: string;
  
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Le code doit contenir 6 chiffres' })
  code: string;
}

export class ChangeUserTypeDto {
  @IsEnum(['sme', 'financial_institution'])
  userType: 'sme' | 'financial_institution';
  
  @IsOptional()
  @IsString()
  reason?: string;
}
```

#### 2.2 DTOs Formulaire d'Identification Étendu

```typescript
// 🔧 À créer : src/modules/customers/dto/enterprise-identification.dto.ts
export class GeneralInfoDto {
  @IsString()
  companyName: string;
  
  @IsOptional()
  @IsString()
  tradeName?: string;
  
  @IsEnum(['SARL', 'SA', 'SNC', 'SCS', 'GIE', 'EURL'])
  legalForm: string;
  
  @IsEnum(['startup', 'traditional'])
  companyType: 'startup' | 'traditional';
  
  @IsString()
  sector: string;
  
  @IsOptional()
  @IsDateString()
  foundingDate?: string;
  
  @ValidateNested()
  @Type(() => HeadquartersDto)
  headquarters: HeadquartersDto;
  
  @ValidateNested()
  @Type(() => MainContactDto)
  mainContact: MainContactDto;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => DigitalPresenceDto)
  digitalPresence?: DigitalPresenceDto;
}

export class CreateExtendedCompanyDto {
  @ValidateNested()
  @Type(() => GeneralInfoDto)
  generalInfo: GeneralInfoDto;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => LegalInfoDto)
  legalInfo?: LegalInfoDto;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => PatrimonyAndMeansDto)
  patrimonyAndMeans?: PatrimonyAndMeansDto;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => SpecificitiesDto)
  specificities?: SpecificitiesDto;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => PerformanceDto)
  performance?: PerformanceDto;
}
```

### 🔗 PHASE 3 : Nouveaux Contrôleurs et Endpoints (Priorité Haute)

#### 3.1 Contrôleur Utilisateurs Moderne

```typescript
// 🔧 À créer : src/modules/system-users/controllers/users.controller.ts
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  
  @Get('me')
  @ApiOperation({ summary: 'Récupérer le profil utilisateur actuel' })
  async getProfile(@Req() req: any): Promise<ApiResponseDto<UserProfileDto>> {
    // Implémentation logique profil
  }
  
  @Patch('me')
  @ApiOperation({ summary: 'Mettre à jour le profil utilisateur' })
  async updateProfile(
    @Req() req: any,
    @Body() updateData: UpdateUserProfileDto
  ): Promise<ApiResponseDto<UserProfileDto>> {
    // Implémentation mise à jour profil
  }
  
  @Patch('me/type')
  @ApiOperation({ summary: 'Changer le type d\'utilisateur' })
  async changeUserType(
    @Req() req: any,
    @Body() changeTypeData: ChangeUserTypeDto
  ): Promise<ApiResponseDto<{ userType: string; previousType: string; changedAt: Date }>> {
    // Implémentation changement type
  }
  
  @Post('me/verify-phone')
  @ApiOperation({ summary: 'Initier la vérification du téléphone' })
  async initiatePhoneVerification(
    @Req() req: any,
    @Body() verifyData: VerifyPhoneDto
  ): Promise<ApiResponseDto<PhoneVerificationResponseDto>> {
    // Implémentation vérification téléphone
  }
  
  @Post('me/verify-phone/confirm')
  @ApiOperation({ summary: 'Confirmer la vérification du téléphone' })
  async confirmPhoneVerification(
    @Req() req: any,
    @Body() confirmData: ConfirmPhoneVerificationDto
  ): Promise<ApiResponseDto<{ phoneNumber: string; verified: boolean; verifiedAt: Date }>> {
    // Implémentation confirmation
  }
  
  @Post('me/identity-document')
  @UseInterceptors(FileInterceptor('document'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Télécharger un document d\'identité' })
  async uploadIdentityDocument(
    @Req() req: any,
    @UploadedFile() file: MulterFile,
    @Body() documentData: UploadIdentityDocumentDto
  ): Promise<ApiResponseDto<IdentityDocumentResponseDto>> {
    // Implémentation upload document
  }
  
  @Get('me/identity-document/status')
  @ApiOperation({ summary: 'Consulter le statut de vérification des documents' })
  async getIdentityDocumentStatus(@Req() req: any): Promise<ApiResponseDto<IdentityDocumentStatusDto>> {
    // Implémentation statut vérification
  }
  
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Télécharger une photo de profil' })
  async uploadAvatar(
    @Req() req: any,
    @UploadedFile() file: MulterFile
  ): Promise<ApiResponseDto<AvatarUploadResponseDto>> {
    // Implémentation upload avatar
  }
}
```

#### 3.2 Extension Contrôleur Company

```typescript
// 🔧 À modifier : src/modules/customers/controllers/company.controller.ts
@Controller('companies')
export class CompanyController {
  // ... méthodes existantes ...
  
  @Post()
  @ApiOperation({ summary: 'Créer une entreprise avec formulaire d\'identification étendu' })
  async createExtended(
    @Body() createExtendedDto: CreateExtendedCompanyDto,
    @Req() req: any
  ): Promise<ApiResponseDto<ExtendedCompanyResponseDto>> {
    // Nouvelle logique avec formulaire étendu
  }
  
  @Put(':id/extended-identification')
  @ApiOperation({ summary: 'Mettre à jour le formulaire d\'identification étendu' })
  async updateExtendedIdentification(
    @Param('id') id: string,
    @Body() updateData: UpdateExtendedIdentificationDto,
    @Req() req: any
  ): Promise<ApiResponseDto<EnterpriseIdentificationFormDto>> {
    // Logique mise à jour formulaire étendu
  }
  
  @Get(':id/extended-identification')
  @ApiOperation({ summary: 'Récupérer le formulaire d\'identification étendu' })
  async getExtendedIdentification(
    @Param('id') id: string
  ): Promise<ApiResponseDto<EnterpriseIdentificationFormDto>> {
    // Logique récupération formulaire étendu
  }
  
  @Get(':id/completion-status')
  @ApiOperation({ summary: 'Statut de complétude du formulaire' })
  async getCompletionStatus(
    @Param('id') id: string
  ): Promise<ApiResponseDto<CompletionStatusDto>> {
    // Logique calcul complétude
  }
}
```

### 🔄 PHASE 4 : Refonte Système d'Abonnements (Priorité Moyenne)

#### 4.1 Nouvelles Entités Abonnements

```typescript
// 🔧 À modifier : src/modules/subscriptions/entities/subscription-plan.entity.ts
@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  name: string;
  
  @Column()
  description: string;
  
  @Column({ type: 'enum', enum: ['sme', 'financial'] })
  customerType: 'sme' | 'financial';
  
  @Column('decimal', { precision: 10, scale: 2 })
  monthlyPriceUSD: number;
  
  @Column('decimal', { precision: 10, scale: 2 })
  annualPriceUSD: number;
  
  @Column({ default: 'USD' })
  currency: string;
  
  // ➕ NOUVEAUTÉ: Allocation de tokens intégrée
  @Column('jsonb')
  tokenAllocation: {
    monthlyTokens: number;
    rolloverLimit: number;
    rolloverPeriods: number;
  };
  
  // ➕ NOUVEAUTÉ: Fonctionnalités granulaires
  @Column('jsonb')
  features: Record<string, {
    enabled: boolean;
    description?: string;
    limit?: number;
    metadata?: Record<string, any>;
  }>;
  
  @Column({ default: true })
  isVisible: boolean;
  
  @Column({ default: false })
  isPopular: boolean;
  
  @Column({ default: 0 })
  sortOrder: number;
  
  @Column('simple-array', { default: '' })
  tags: string[];
}

// 🔧 À créer : src/modules/tokens/entities/token-balance.entity.ts
@Entity('token_balances')
export class TokenBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  customerId: string;
  
  @Column('bigint', { default: 0 })
  totalTokens: number;
  
  @Column('bigint', { default: 0 })
  monthlyAllocation: number;
  
  @Column('bigint', { default: 0 })
  usedTokens: number;
  
  @Column('bigint', { default: 0 })
  remainingTokens: number;
  
  @Column('bigint', { default: 0 })
  rolledOverTokens: number;
  
  @Column('bigint', { default: 0 })
  bonusTokens: number;
  
  @Column()
  currentPeriod: string; // Format: YYYY-MM
  
  @Column()
  periodStartDate: Date;
  
  @Column()
  periodEndDate: Date;
  
  @Column('jsonb', { default: '[]' })
  rolloverHistory: Array<{
    period: string;
    rolledAmount: number;
    date: Date;
    expiryDate: Date;
  }>;
  
  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}
```

### 🔧 PHASE 5 : Services et Logique Métier (Priorité Moyenne)

#### 5.1 Nouveau Service Utilisateurs

```typescript
// 🔧 À créer : src/modules/system-users/services/modern-user.service.ts
@Injectable()
export class ModernUserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserSettings) private settingsRepo: Repository<UserSettings>,
    @InjectRepository(IdentityDocument) private identityDocRepo: Repository<IdentityDocument>,
    private cloudinaryService: CloudinaryService,
    private phoneVerificationService: PhoneVerificationService
  ) {}
  
  async getProfile(auth0Id: string): Promise<UserProfileDto> {
    // Logique récupération profil hybride Auth0 + DB
  }
  
  async updateProfile(auth0Id: string, updateData: UpdateUserProfileDto): Promise<UserProfileDto> {
    // Logique mise à jour profil
  }
  
  async changeUserType(auth0Id: string, newType: string, reason?: string): Promise<any> {
    // Logique changement type utilisateur
  }
  
  async initiatePhoneVerification(auth0Id: string, phoneNumber: string, method: string): Promise<any> {
    // Logique initiation vérification téléphone
  }
  
  async confirmPhoneVerification(auth0Id: string, verificationId: string, code: string): Promise<any> {
    // Logique confirmation vérification
  }
  
  async uploadIdentityDocument(auth0Id: string, file: any, documentData: any): Promise<any> {
    // Logique upload document identité
  }
  
  async uploadAvatar(auth0Id: string, file: any): Promise<any> {
    // Logique upload avatar
  }
}
```

#### 5.2 Service Formulaire d'Identification Étendu

```typescript
// 🔧 À créer : src/modules/customers/services/extended-identification.service.ts
@Injectable()
export class ExtendedIdentificationService {
  constructor(
    @InjectRepository(EnterpriseIdentificationForm) 
    private formRepo: Repository<EnterpriseIdentificationForm>
  ) {}
  
  async createForm(customerId: string, formData: CreateExtendedCompanyDto): Promise<EnterpriseIdentificationForm> {
    // Logique création formulaire étendu
  }
  
  async updateForm(customerId: string, updateData: any): Promise<EnterpriseIdentificationForm> {
    // Logique mise à jour progressive
  }
  
  async getCompletionStatus(customerId: string): Promise<CompletionStatusDto> {
    // Calcul du pourcentage de complétude
    const form = await this.formRepo.findOne({ where: { customerId } });
    
    let completion = 0;
    if (form?.generalInfo) completion += 30;
    if (form?.legalInfo) completion += 20;
    if (form?.patrimonyAndMeans) completion += 20;
    if (form?.specificities) completion += 15;
    if (form?.performance) completion += 15;
    
    return {
      overallCompletion: completion,
      generalInfo: !!form?.generalInfo,
      legalInfo: !!form?.legalInfo,
      patrimonyAndMeans: !!form?.patrimonyAndMeans,
      specificities: !!form?.specificities,
      performance: !!form?.performance
    };
  }
  
  async validateLegalData(legalInfo: any): Promise<ValidationResult> {
    // Validation des données légales OHADA
    // Vérification format RCCM, numéro fiscal, etc.
  }
}
```

#### 5.3 Service Abonnements Moderne

```typescript
// 🔧 À refactoriser : src/modules/subscriptions/services/modern-subscription.service.ts
@Injectable()
export class ModernSubscriptionService {
  constructor(
    @InjectRepository(SubscriptionPlan) private planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription) private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(TokenBalance) private tokenBalanceRepo: Repository<TokenBalance>
  ) {}
  
  async getPlans(customerType?: string, billingPeriod?: string): Promise<SubscriptionPlan[]> {
    // Logique récupération plans avec filtres
  }
  
  async createSubscription(customerId: string, planId: string, paymentData: any): Promise<Subscription> {
    // Logique création abonnement avec allocation tokens automatique
    const plan = await this.planRepo.findOne({ where: { id: planId } });
    
    // Créer abonnement
    const subscription = this.subscriptionRepo.create({
      customerId,
      planId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: this.calculatePeriodEnd(new Date(), plan.billingPeriod)
    });
    
    // Initialiser solde de tokens
    await this.initializeTokenBalance(customerId, plan.tokenAllocation);
    
    return subscription;
  }
  
  private async initializeTokenBalance(customerId: string, allocation: any): Promise<void> {
    const balance = this.tokenBalanceRepo.create({
      customerId,
      monthlyAllocation: allocation.monthlyTokens,
      totalTokens: allocation.monthlyTokens,
      remainingTokens: allocation.monthlyTokens,
      currentPeriod: format(new Date(), 'yyyy-MM'),
      periodStartDate: startOfMonth(new Date()),
      periodEndDate: endOfMonth(new Date())
    });
    
    await this.tokenBalanceRepo.save(balance);
  }
  
  async processMonthlyTokenAllocation(): Promise<void> {
    // Tâche CRON pour allocation mensuelle avec rollover
    const activeSubscriptions = await this.subscriptionRepo.find({
      where: { status: 'active' },
      relations: ['plan']
    });
    
    for (const subscription of activeSubscriptions) {
      await this.allocateMonthlyTokens(subscription);
    }
  }
  
  private async allocateMonthlyTokens(subscription: Subscription): Promise<void> {
    // Logique rollover intelligent et allocation
  }
}
```

## 📋 Checklist de Migration

### ✅ Infrastructure
- [ ] Créer nouvelles entités TypeORM
- [ ] Générer et exécuter migrations base de données
- [ ] Configurer relations entre entités
- [ ] Tester intégrité référentielle

### ✅ DTOs et Validation
- [ ] Créer tous les nouveaux DTOs
- [ ] Ajouter validations appropriées
- [ ] Tester sérialisation/désérialisation
- [ ] Mettre à jour documentation Swagger

### ✅ Contrôleurs et Endpoints
- [ ] Créer UsersController moderne
- [ ] Étendre CompanyController
- [ ] Modifier SubscriptionController
- [ ] Tester tous les endpoints

### ✅ Services et Logique
- [ ] Implémenter ModernUserService
- [ ] Créer ExtendedIdentificationService
- [ ] Refactoriser SubscriptionService
- [ ] Ajouter services de validation

### ✅ Tests et Documentation
- [ ] Tests unitaires nouveaux services
- [ ] Tests d'intégration endpoints
- [ ] Mise à jour documentation API
- [ ] Tests de migration de données

## ⚠️ Points d'Attention

### 🔄 Migration des Données Existantes
```sql
-- Script de migration pour transformer les données existantes
INSERT INTO enterprise_identification_forms (customer_id, general_info, created_at, updated_at)
SELECT 
  customer_id,
  jsonb_build_object(
    'companyName', name,
    'legalForm', legal_form,
    'headquarters', jsonb_build_object(
      'address', address->>'street',
      'city', address->>'city',
      'province', address->>'province',
      'country', address->>'country'
    )
  ),
  created_at,
  updated_at
FROM sme;
```

### 🚨 Risques et Mitigation
1. **Performance** : Nouvelles relations complexes → Indexation appropriée
2. **Compatibilité** : Breaking changes → Maintenir endpoints v1 temporairement
3. **Données** : Perte de données → Backup complet avant migration

### 🎯 Ordre d'Implémentation Recommandé
1. **Entités et migrations** (1 semaine)
2. **DTOs et validation** (1 semaine)  
3. **Services de base** (1 semaine)
4. **Contrôleurs simples** (1 semaine)
5. **Fonctionnalités avancées** (2 semaines)
6. **Tests et optimisation** (1 semaine)

---

**Note** : Ce plan détaillé assure une migration progressive et sûre vers l'API v2.0 tout en maintenant la compatibilité durant la transition.