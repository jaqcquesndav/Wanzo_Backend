# Gestion des Institutions Financières

## Structure des données

Basée sur les interfaces du code source (`src/types/financialInstitution.ts` et `src/types/api.ts`) et le service `financialInstitution.ts` :

### Institution Financière

```typescript
interface FinancialInstitutionResponse {
  id: string;
  name: string;
  type: 'bank' | 'microfinance' | 'cooperative';
  category: 'commercial' | 'development' | 'investment';
  approvalNumber?: string;
  logo?: string;
  address: {
    street: string;
    city: string;
    province: string;
    country: string;
  };
  contacts: {
    email: string;
    phone: string;
    website?: string;
  };
  ceoPhoto?: string;
  branches?: Array<{
    id: string;
    name: string;
    address: string;
    phone: string;
    manager?: string;
  }>;
  managementTeam?: Array<{
    id: string;
    name: string;
    position: string;
    photo?: string;
    bio?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

## Endpoints API

### Récupérer une institution financière

```
GET /financial-institutions/{institutionId}
```

**Implémentation** : `getFinancialInstitution(institutionId)`

#### Réponse

```json
{
  "id": "fin-123",
  "name": "Banque Congolaise du Commerce",
  "type": "bank",
  "category": "commercial", 
  "approvalNumber": "BCC/2015/123",
  "logo": "https://cdn.example.com/logos/bcc.png",
  "address": {
    "street": "789, Boulevard du 30 Juin",
    "city": "Kinshasa",
    "province": "Kinshasa",
    "country": "République Démocratique du Congo"
  },
  "contacts": {
    "email": "info@bcc-bank.cd",
    "phone": "+243 850 123 456",
    "website": "https://www.bcc-bank.cd"
  },
  "ceoPhoto": "https://cdn.example.com/photos/ceo.jpg",
  "branches": [
    {
      "id": "branch-123",
      "name": "Agence Gombe",
      "address": "789, Boulevard du 30 Juin, Gombe",
      "phone": "+243 854 321 987",
      "manager": "Alice Nzinga"
    }
  ],
  "managementTeam": [
    {
      "id": "mgmt-123",
      "name": "Marie Kabongo",
      "position": "Directrice Générale Adjointe",
      "photo": "https://cdn.example.com/photos/marie.jpg",
      "bio": "15 ans d'expérience dans la finance"
    }
  ],
  "createdAt": "2015-03-12T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Créer une institution financière

```
POST /financial-institutions
```

**Implémentation** : `createFinancialInstitution(institutionData)`

#### Corps de la requête

```json
{
  "name": "Nouvelle Banque",
  "type": "bank",
  "category": "commercial",
  "approvalNumber": "NBK/2024/001",
  "address": {
    "street": "123 Avenue Commerce",
    "city": "Kinshasa", 
    "province": "Kinshasa",
    "country": "RDC"
  },
  "contacts": {
    "email": "info@nouvellebanque.cd",
    "phone": "+243 890 123 456",
    "website": "https://www.nouvellebanque.cd"
  }
}
```

### Mettre à jour une institution financière  

```
PATCH /financial-institutions/{institutionId}
```

**Implémentation** : `updateFinancialInstitution(institutionId, updates)`

#### Corps de la requête

```json
{
  "name": "Nouveau Nom de la Banque",
  "contacts": {
    "phone": "+243 890 999 888"
  }
}
```

### Supprimer une institution financière

```
DELETE /financial-institutions/{institutionId}
```

**Implémentation** : `deleteFinancialInstitution(institutionId)`

### Upload du logo

```
POST /financial-institutions/logo/upload
```

**Implémentation** : `uploadInstitutionLogo(institutionId, logoFile)`

#### Corps de la requête (multipart/form-data)

```
file: [File - Image du logo]
institutionId: "fin-123"
```

#### Réponse

```json
{
  "url": "https://cdn.example.com/logos/fin-123-logo.png"
}
```
        "title": "Directrice Financière",
        "department": "Finance",
        "email": "m.kabongo@bcc-bank.cd",
        "phone": "+243 850 123 461"
      },
      {
        "id": "usr_fghij67890",
        "name": "Jean Luc Mabele",
        "gender": "male",
        "title": "Directeur des Opérations",
        "department": "Opérations",
        "email": "jl.mabele@bcc-bank.cd",
        "phone": "+243 850 123 462"
      }
    ],
    "boardMembers": [
      {
        "name": "Emmanuel Tshisekedi",
        "position": "Président du Conseil",
        "organization": "Groupe Financier International"
      },
      {
        "name": "Sophie Ilunga",
        "position": "Membre",
        "organization": "Association des Banques Congolaises"
      }
    ]
  },
  "services": {
    "personalBanking": [
      "Comptes courants et d'épargne",
      "Prêts personnels",
      "Cartes de crédit et de débit",
      "Banque mobile"
    ],
    "businessBanking": [
      "Comptes entreprises",
      "Financement commercial",
      "Prêts aux entreprises",
      "Services de change"
    ],
    "specializedServices": [
      "Financement de projets",
      "Services de conseil aux entreprises",
      "Gestion de patrimoine"
    ]
  },
  "financialInfo": {
    "assets": 1200000000,
    "capital": 250000000,
    "currency": "USD",
    "yearFounded": 2015,
    "regulatoryCompliance": {
      "bcc": true,
      "fatca": true,
      "aml": true
    }
  },
  "creditRating": {
    "agency": "Moody's",
    "rating": "Ba1",
    "outlook": "stable",
    "lastUpdated": "2023-06-20"
  },
  "digitalPresence": {
    "hasMobileBanking": true,
    "hasInternetBanking": true,
    "appLinks": {
      "android": "https://play.google.com/store/apps/details?id=cd.bcc.mobilebanking",
      "ios": "https://apps.apple.com/cd/app/bcc-mobile/id1234567890"
    }
  },
  "subscription": {
    "plan": {
      "name": "Entreprise"
    },
    "status": "active",
    "currentPeriodEnd": "2025-12-31"
  },
  "createdAt": "2023-10-15T14:30:00Z",
  "updatedAt": "2023-11-20T09:45:00Z",
  "createdBy": "usr_12345abcde"
}
```

## Endpoints API

### Créer une institution financière

```
POST /land/api/v1/financial-institutions
```

#### Corps de la requête

```json
{
  "name": "Banque Congolaise du Commerce",
  "type": "bank",
  "category": "commercial",
  "licenseNumber": "BCC/2015/123",
  "establishedDate": "2015-03-12",
  "address": {
    "headquarters": {
      "street": "789, Boulevard du 30 Juin",
      "commune": "Gombe",
      "city": "Kinshasa",
      "province": "Kinshasa",
      "country": "République Démocratique du Congo"
    }
  },
  "contacts": {
    "general": {
      "email": "info@bcc-bank.cd",
      "phone": "+243 850 123 456"
    }
  },
  "leadership": {
    "ceo": {
      "name": "Pierre Mukendi",
      "gender": "male",
      "title": "Directeur Général",
      "email": "p.mukendi@bcc-bank.cd"
    }
  }
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "fin-123",
    "name": "Banque Congolaise du Commerce",
    "type": "bank",
    "category": "commercial",
    "licenseNumber": "BCC/2015/123",
    "establishedDate": "2015-03-12",
    "address": {
      "headquarters": {
        "street": "789, Boulevard du 30 Juin",
        "commune": "Gombe",
        "city": "Kinshasa",
        "province": "Kinshasa",
        "country": "République Démocratique du Congo"
      }
    },
    "contacts": {
      "general": {
        "email": "info@bcc-bank.cd",
        "phone": "+243 850 123 456"
      }
    },
    "leadership": {
      "ceo": {
        "id": "usr_12345abcde",
        "name": "Pierre Mukendi",
        "gender": "male",
        "title": "Directeur Général",
        "email": "p.mukendi@bcc-bank.cd"
      }
    },
    "createdAt": "2023-10-15T14:30:00Z",
    "updatedAt": "2023-10-15T14:30:00Z"
  }
}
```

### Récupérer une institution financière

```
GET /land/api/v1/financial-institutions/{institutionId}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "fin-123",
    "name": "Banque Congolaise du Commerce",
    // ... autres champs de l'institution
  }
}
```

### Mettre à jour une institution financière

```
PATCH /land/api/v1/financial-institutions/{institutionId}
```

#### Corps de la requête

```json
{
  "description": "Établissement financier de premier plan offrant des services bancaires aux entreprises et aux particuliers en RDC.",
  "website": "https://www.bcc-bank.cd",
  "facebookPage": "https://facebook.com/bccbank",
  "linkedinPage": "https://linkedin.com/company/bcc-bank",
  "leadership": {
    "executiveTeam": [
      {
        "name": "Marie Kabongo",
        "gender": "female",
        "title": "Directrice Financière",
        "department": "Finance",
        "email": "m.kabongo@bcc-bank.cd",
        "phone": "+243 850 123 461"
      }
    ]
  },
  "services": {
    "personalBanking": [
      "Comptes courants et d'épargne",
      "Prêts personnels"
    ]
  }
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "fin-123",
    "name": "Banque Congolaise du Commerce",
    "description": "Établissement financier de premier plan offrant des services bancaires aux entreprises et aux particuliers en RDC.",
    "website": "https://www.bcc-bank.cd",
    "facebookPage": "https://facebook.com/bccbank",
    "linkedinPage": "https://linkedin.com/company/bcc-bank",
    "leadership": {
      "ceo": {
        "id": "usr_12345abcde",
        "name": "Pierre Mukendi",
        "gender": "male",
        "title": "Directeur Général",
        "email": "p.mukendi@bcc-bank.cd"
      },
      "executiveTeam": [
        {
          "id": "usr_abcde12345",
          "name": "Marie Kabongo",
          "gender": "female",
          "title": "Directrice Financière",
          "department": "Finance",
          "email": "m.kabongo@bcc-bank.cd",
          "phone": "+243 850 123 461"
        }
      ]
    },
    "services": {
      "personalBanking": [
        "Comptes courants et d'épargne",
        "Prêts personnels"
      ]
    },
    // ... autres champs de l'institution
    "updatedAt": "2023-11-20T09:45:00Z"
  }
}
```

### Télécharger un logo d'institution

```
POST /land/api/v1/financial-institutions/{institutionId}/logo
Content-Type: multipart/form-data
```

#### Corps de la requête

```
logo: [FILE]
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "logo": "https://cdn.example.com/logos/bcc.png",
    "message": "Logo téléchargé avec succès"
  }
}
```

### Télécharger une photo du CEO

```
POST /land/api/v1/financial-institutions/{institutionId}/ceo/photo
Content-Type: multipart/form-data
```

#### Corps de la requête

```
photo: [FILE]
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "photo": "https://cdn.example.com/photos/pierre-mukendi.jpg",
    "message": "Photo téléchargée avec succès"
  }
}
```

### Ajouter une agence

```
POST /land/api/v1/financial-institutions/{institutionId}/branches
```

#### Corps de la requête

```json
{
  "name": "Agence Limete",
  "address": {
    "street": "456, Avenue des Poids Lourds",
    "commune": "Limete",
    "city": "Kinshasa",
    "province": "Kinshasa",
    "country": "République Démocratique du Congo"
  },
  "coordinates": {
    "lat": -4.342,
    "lng": 15.353
  },
  "manager": "Robert Kimbembe",
  "phone": "+243 854 321 988",
  "email": "limete@bcc-bank.cd",
  "openingHours": "Lun-Ven: 8h-16h"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "branch-456",
    "name": "Agence Limete",
    "address": {
      "street": "456, Avenue des Poids Lourds",
      "commune": "Limete",
      "city": "Kinshasa",
      "province": "Kinshasa",
      "country": "République Démocratique du Congo"
    },
    "coordinates": {
      "lat": -4.342,
      "lng": 15.353
    },
    "manager": "Robert Kimbembe",
    "phone": "+243 854 321 988",
    "email": "limete@bcc-bank.cd",
    "openingHours": "Lun-Ven: 8h-16h"
  }
}
```

### Supprimer une agence

```
DELETE /land/api/v1/financial-institutions/{institutionId}/branches/{branchId}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Agence supprimée avec succès"
  }
}
```

### Ajouter un membre de l'équipe de direction

```
POST /land/api/v1/financial-institutions/{institutionId}/leadership/executives
```

#### Corps de la requête

```json
{
  "name": "Jean Luc Mabele",
  "gender": "male",
  "title": "Directeur des Opérations",
  "department": "Opérations",
  "email": "jl.mabele@bcc-bank.cd",
  "phone": "+243 850 123 462"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "usr_fghij67890",
    "name": "Jean Luc Mabele",
    "gender": "male",
    "title": "Directeur des Opérations",
    "department": "Opérations",
    "email": "jl.mabele@bcc-bank.cd",
    "phone": "+243 850 123 462"
  }
}
```

### Supprimer un membre de l'équipe de direction

```
DELETE /land/api/v1/financial-institutions/{institutionId}/leadership/executives/{executiveId}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Membre de l'équipe de direction supprimé avec succès"
  }
}
```

### Lister les institutions financières (pour les admins)

```
GET /land/api/v1/financial-institutions?page=1&limit=10
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": [
    {
      "id": "fin-123",
      "name": "Banque Congolaise du Commerce",
      "type": "bank",
      "category": "commercial",
      "createdAt": "2023-10-15T14:30:00Z"
    },
    // ... autres institutions
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

## Logique métier

### Création d'institution financière

Lorsqu'un utilisateur crée une institution financière :
1. Un profil d'institution financière est créé
2. L'utilisateur est automatiquement défini comme le CEO ou administrateur de l'institution
3. Le champ `userType` de l'utilisateur est défini sur `financial_institution`
4. Le champ `financialInstitutionId` de l'utilisateur est défini sur l'ID de l'institution

### Mise à jour du profil

La mise à jour du profil d'institution financière peut se faire par étapes, comme implémenté dans le formulaire `FinancialInstitutionFormModal` :
1. Informations générales
2. Leadership
3. Services et informations financières
4. Présence numérique et agences

### Upload de fichiers

Les fichiers (logo, photos) sont téléchargés sur Cloudinary. L'API retourne l'URL du fichier téléchargé, qui est ensuite stockée dans la base de données.

### Validation des données

Toutes les données sont validées côté serveur selon les règles définies dans le schéma Zod.
