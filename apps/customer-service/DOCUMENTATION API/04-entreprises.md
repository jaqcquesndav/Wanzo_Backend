# Gestion des Entreprises (PME)

## Structure des données

Basée sur l'interface `Company` du code source (`src/types/user.ts`) et le service `CompanyService` (`src/services/company.ts`) :

### Entreprise

```typescript
interface Company {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  legalForm?: string;
  industry?: string;
  size?: string;
  website?: string;
  facebookPage?: string;
  // Identifiants légaux et fiscaux
  rccm?: string;
  taxId?: string;
  natId?: string;
  // Adresse (format legacy)
  address?: {
    street?: string;
    city?: string;
    commune?: string;
    province?: string;
    country?: string;
  };
  // Emplacements avec coordonnées
  locations?: Array<{
    id: string;
    name: string;
    type: 'headquarters' | 'branch' | 'store' | 'warehouse' | 'factory' | 'other';
    address?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  }>;
  // Contacts
  contacts?: {
    email?: string;
    phone?: string;
    altPhone?: string;
  };
  // Propriétaire
  owner?: {
    id: string;
    name: string;
    gender?: 'male' | 'female';
    email?: string;
    phone?: string;
    hasOtherJob?: boolean;
    cv?: string; // URL du CV sur Cloudinary
    linkedin?: string;
    facebook?: string;
  };
  associates?: Array<{
    id?: string;
    name: string;
    gender?: 'male' | 'female';
    role?: string;
    shares?: number;
    email?: string;
    phone?: string;
  }>;
  // Activités
  activities?: {
    primary?: string;
    secondary?: string[];
  };
  // Capital
  capital?: {
    isApplicable?: boolean;
    amount?: number;
    currency?: 'USD' | 'CDF' | 'EUR';
  };
  // Données financières
  financials?: {
    revenue?: number;
    netIncome?: number;
    totalAssets?: number;
    equity?: number;
  };
  // Affiliations
  affiliations?: {
    cnss?: string;
    inpp?: string;
    onem?: string;
    intraCoop?: string;
    interCoop?: string;
    partners?: string[];
  };
  // Abonnement
  subscription?: {
    plan?: {
      name: string;
    };
    status: 'active' | 'inactive' | 'pending' | 'expired';
    currentPeriodEnd?: string;
  };
}
```

## Implémentation actuelle

**Service** : `CompanyService` (src/services/company.ts)
- **Stockage** : localStorage (`company_${id}`)
- **Données de test** : Entreprise KIOTA TECH pré-configurée
- **Persistance** : Modifications sauvegardées automatiquement

### Exemple de données (KIOTA TECH)

```json
{
  "id": "comp-123",
  "name": "KIOTA TECH",
  "logo": "https://i.imgur.com/JfaStwU.png",
  "description": "Leader en solutions numériques innovantes en RDC, spécialisé dans le développement logiciel, le conseil technologique et la formation IT pour accélérer la transformation digitale des entreprises.",
  "legalForm": "SARL",
  "industry": "Technologie", 
  "size": "11-50 employés",
  "website": "https://www.kiota.tech",
  "rccm": "CD/KIN/RCCM/22-B-01234",
  "taxId": "A1234567B",
  "natId": "01-2345-C67890D",
  "address": {
    "street": "123, Avenue de la Libération, Croisement Boulevard du 30 Juin",
    "commune": "Gombe",
    "city": "Kinshasa",
    "province": "Kinshasa",
    "country": "République Démocratique du Congo"
  },
  "contacts": {
    "email": "contact@kiota.tech",
    "phone": "+243 810 987 654",
    "altPhone": "+243 990 123 456"
  },
  "owner": {
    "id": "user-123",
    "name": "Jean Mutombo",
    "email": "j.mutombo@kiota.tech",
    "phone": "+243 820 123 456"
  },
  "associates": [
    {
      "id": "user-456",
      "name": "Marie Lukusa",
      "role": "Directrice financière",
      "shares": 25,
      "email": "m.lukusa@kiota.tech",
      "phone": "+243 821 234 567"
    },
    {
      "id": "user-789", 
      "name": "Patrick Kabongo",
      "role": "Directeur technique",
      "shares": 15,
      "email": "p.kabongo@kiota.tech",
      "phone": "+243 822 345 678"
    }
  ],
  "activities": {
    "primary": "Développement de logiciels et solutions numériques sur mesure.",
    "secondary": [
      "Conseil en transformation digitale",
      "Formation professionnelle en IT", 
      "Vente et intégration de matériel informatique"
    ]
  },
  "capital": {
    "isApplicable": true,
    "amount": 50000,
    "currency": "USD"
  },
  "financials": {
    "revenue": 1200000,
    "netIncome": 150000,
    "totalAssets": 750000,
    "equity": 400000
  },
  "affiliations": {
    "cnss": "1234567-A",
    "inpp": "INPP/KIN/12345",
    "onem": "ONEM/KIN/67890",
    "intraCoop": "Groupe Innov-RDC",
    "interCoop": "Chambre de Commerce Franco-Congolaise",
    "partners": ["Microsoft Partner Network", "Google Cloud Partner"]
  },
  "subscription": {
    "plan": { "name": "Entreprise" },
    "status": "active",
    "currentPeriodEnd": "2025-12-31"
  }
}
```

## Méthodes disponibles

### Récupérer les données d'entreprise

**Méthode** : `CompanyService.getCompany(id?: string)`
- Récupère depuis localStorage
- Initialise avec les données KIOTA TECH si aucune donnée

### Mettre à jour les données

**Méthode** : `CompanyService.updateCompany(updates: Partial<Company>)`
- Met à jour partiellement les données
- Sauvegarde automatique dans localStorage

### Uploader un logo

**Méthode** : `CompanyService.uploadLogo(file: File)`
- Simulation d'upload
- Retourne URL temporaire via createObjectURL

### Uploader le CV du propriétaire

**Méthode** : `CompanyService.uploadOwnerCV(file: File)`
- Simulation d'upload du CV
- Met à jour owner.cv avec l'URL

**Note** : Le service actuel utilise localStorage pour la persistance. Pour une API backend réelle, ces méthodes devraient être adaptées pour utiliser les endpoints HTTP correspondants.
    "netIncome": 150000,
    "totalAssets": 750000,
    "equity": 400000
  },
  "affiliations": {
    "cnss": "1234567-A",
    "inpp": "INPP/KIN/12345",
    "onem": "ONEM/KIN/67890",
    "intraCoop": "Groupe Innov-RDC",
    "interCoop": "Chambre de Commerce Franco-Congolaise",
    "partners": ["Microsoft Partner Network", "Google Cloud Partner"]
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

### Créer une entreprise

```
POST /land/api/v1/companies
```

#### Corps de la requête

```json
{
  "name": "KIOTA TECH",
  "legalForm": "SARL",
  "industry": "Technologie",
  "size": "11-50 employés",
  "address": {
    "street": "123, Avenue de la Libération",
    "commune": "Gombe",
    "city": "Kinshasa",
    "province": "Kinshasa",
    "country": "République Démocratique du Congo"
  },
  "contacts": {
    "email": "contact@kiota.tech",
    "phone": "+243 810 987 654"
  },
  "owner": {
    "name": "Jean Mutombo",
    "email": "j.mutombo@kiota.tech",
    "phone": "+243 820 123 456"
  }
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "comp-123",
    "name": "KIOTA TECH",
    "legalForm": "SARL",
    "industry": "Technologie",
    "size": "11-50 employés",
    "address": {
      "street": "123, Avenue de la Libération",
      "commune": "Gombe",
      "city": "Kinshasa",
      "province": "Kinshasa",
      "country": "République Démocratique du Congo"
    },
    "contacts": {
      "email": "contact@kiota.tech",
      "phone": "+243 810 987 654"
    },
    "owner": {
      "id": "usr_12345abcde",
      "name": "Jean Mutombo",
      "email": "j.mutombo@kiota.tech",
      "phone": "+243 820 123 456"
    },
    "createdAt": "2023-10-15T14:30:00Z",
    "updatedAt": "2023-10-15T14:30:00Z"
  }
}
```

### Récupérer une entreprise

```
GET /land/api/v1/companies/{companyId}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "comp-123",
    "name": "KIOTA TECH",
    // ... autres champs de l'entreprise
  }
}
```

### Mettre à jour une entreprise

```
PATCH /land/api/v1/companies/{companyId}
```

#### Corps de la requête

```json
{
  "description": "Leader en solutions numériques innovantes en RDC, spécialisé dans le développement logiciel.",
  "website": "https://www.kiota.tech",
  "facebookPage": "https://facebook.com/kiotatech",
  "rccm": "CD/KIN/RCCM/22-B-01234",
  "taxId": "A1234567B",
  "associates": [
    {
      "name": "Marie Lukusa",
      "gender": "female",
      "role": "Directrice financière",
      "shares": 25,
      "email": "m.lukusa@kiota.tech",
      "phone": "+243 821 234 567"
    }
  ]
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "comp-123",
    "name": "KIOTA TECH",
    "description": "Leader en solutions numériques innovantes en RDC, spécialisé dans le développement logiciel.",
    "website": "https://www.kiota.tech",
    "facebookPage": "https://facebook.com/kiotatech",
    "rccm": "CD/KIN/RCCM/22-B-01234",
    "taxId": "A1234567B",
    "associates": [
      {
        "id": "usr_abcde12345",
        "name": "Marie Lukusa",
        "gender": "female",
        "role": "Directrice financière",
        "shares": 25,
        "email": "m.lukusa@kiota.tech",
        "phone": "+243 821 234 567"
      }
    ],
    // ... autres champs de l'entreprise
    "updatedAt": "2023-11-20T09:45:00Z"
  }
}
```

### Télécharger un logo d'entreprise

```
POST /land/api/v1/companies/{companyId}/logo
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
    "logo": "https://cdn.example.com/logos/kiota-tech.png",
    "message": "Logo téléchargé avec succès"
  }
}
```

### Télécharger un CV de dirigeant

```
POST /land/api/v1/companies/{companyId}/owner/cv
Content-Type: multipart/form-data
```

#### Corps de la requête

```
cv: [FILE]
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "cv": "https://cdn.example.com/cvs/jean-mutombo.pdf",
    "message": "CV téléchargé avec succès"
  }
}
```

### Ajouter un emplacement

```
POST /land/api/v1/companies/{companyId}/locations
```

#### Corps de la requête

```json
{
  "name": "Centre de formation",
  "type": "branch",
  "address": "45, Avenue des Écoles, Limete, Kinshasa",
  "coordinates": {
    "lat": -4.337,
    "lng": 15.351
  }
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "loc-456",
    "name": "Centre de formation",
    "type": "branch",
    "address": "45, Avenue des Écoles, Limete, Kinshasa",
    "coordinates": {
      "lat": -4.337,
      "lng": 15.351
    }
  }
}
```

### Supprimer un emplacement

```
DELETE /land/api/v1/companies/{companyId}/locations/{locationId}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Emplacement supprimé avec succès"
  }
}
```

### Ajouter un associé

```
POST /land/api/v1/companies/{companyId}/associates
```

#### Corps de la requête

```json
{
  "name": "Patrick Kabongo",
  "gender": "male",
  "role": "Directeur technique",
  "shares": 15,
  "email": "p.kabongo@kiota.tech",
  "phone": "+243 822 345 678"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "usr_fghij67890",
    "name": "Patrick Kabongo",
    "gender": "male",
    "role": "Directeur technique",
    "shares": 15,
    "email": "p.kabongo@kiota.tech",
    "phone": "+243 822 345 678"
  }
}
```

### Supprimer un associé

```
DELETE /land/api/v1/companies/{companyId}/associates/{associateId}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Associé supprimé avec succès"
  }
}
```

### Lister les entreprises (pour les admins)

```
GET /land/api/v1/companies?page=1&limit=10
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": [
    {
      "id": "comp-123",
      "name": "KIOTA TECH",
      "industry": "Technologie",
      "size": "11-50 employés",
      "createdAt": "2023-10-15T14:30:00Z"
    },
    // ... autres entreprises
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "pages": 5
    }
  }
}
```

## Logique métier

### Création d'entreprise

Lorsqu'un utilisateur crée une entreprise :
1. Un profil d'entreprise est créé
2. L'utilisateur est automatiquement défini comme le dirigeant de l'entreprise
3. Le champ `userType` de l'utilisateur est défini sur `sme`
4. Le champ `companyId` de l'utilisateur est défini sur l'ID de l'entreprise
5. Le champ `isCompanyOwner` de l'utilisateur est défini sur `true`

### Mise à jour du profil

La mise à jour du profil d'entreprise peut se faire par étapes, comme implémenté dans le formulaire `CompanyFormModal` :
1. Informations générales
2. Dirigeant et associés
3. Coordonnées et activités

### Upload de fichiers

Les fichiers (logo, CV) sont téléchargés sur Cloudinary. L'API retourne l'URL du fichier téléchargé, qui est ensuite stockée dans la base de données.

### Validation des données

Toutes les données sont validées côté serveur selon les règles définies dans le schéma Zod.
