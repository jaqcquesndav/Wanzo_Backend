# Comptable IA API

![CRES Logo](https://example.com/cres_logo.png)

## Propriété du CRES - Centre Recherche et d'Expertise Scientifique

**Comptable IA API** est une plateforme d'intelligence artificielle avancée développée par le CRES pour révolutionner les processus comptables et financiers des entreprises et administrations africaines.

## 📚 Introduction

Dans un contexte économique où la précision et l'efficacité des processus comptables sont cruciales pour la prise de décisions stratégiques, le CRES a développé cette suite d'agents IA spécialisés pour automatiser et optimiser les tâches comptables complexes. Ce projet s'inscrit dans la vision plus large de démocratisation des technologies avancées pour le développement des économies africaines.

### Ambition et Vision

L'ambition de **Comptable IA API** est de fournir aux administrations et entreprises des outils d'intelligence artificielle de pointe qui :

- **Automatisent** les tâches comptables répétitives et chronophages
- **Réduisent** les erreurs humaines dans le traitement des documents financiers
- **Optimisent** la conformité aux normes SYSCOHADA et aux réglementations locales
- **Facilitent** la prise de décision grâce à des analyses financières avancées
- **Renforcent** la gouvernance et la transparence financière

La vision à long terme inclut le développement d'une suite complète d'agents experts couvrant différents domaines :
- 📊 Experts comptables IA
- 💹 Analystes financiers IA
- 📈 Gestionnaires de portefeuilles IA
- ⚖️ Consultants en droit des affaires IA
- 🧮 Contrôleurs de gestion IA

## 🚀 Technologies Principales

- **Django & DRF**: Framework backend robuste et API REST
- **OpenAI GPT-4**: Modèles de langage de pointe (gpt-4o-2024-08-06 pour OCR)
- **SentenceTransformers**: Embeddings vectoriels pour recherche sémantique
- **ChromaDB**: Base de données vectorielle pour stockage des connaissances comptables
- **PyMuPDF**: Traitement et analyse avancés de documents PDF
- **tiktoken**: Gestion précise des compteurs de tokens OpenAI

## 🧠 Architecture des Agents IA

Notre système repose sur une architecture multi-agents spécialisés, chacun expert dans son domaine :

### 1. Document Detection & Extraction (DDE) Agent
- **Rôle**: Analyse initiale des documents et extraction de texte structuré
- **Capacités**: Reconnaissance OCR avancée, compréhension des contextes comptables
- **Technologies**: GPT-4 Vision, PyMuPDF
- **Entrée**: Documents comptables (PDF, images, scans)
- **Sortie**: Texte structuré et métadonnées contextuelles

### 2. Accounting Analysis (AA) Agent
- **Rôle**: Analyse comptable et génération des écritures
- **Capacités**: Application des règles SYSCOHADA, classification des opérations
- **Technologies**: GPT-4, contexte enrichi de règles comptables
- **Entrée**: Texte extrait, type de document, intention comptable
- **Sortie**: Propositions d'écritures comptables conformes

### 3. Retriever Agent
- **Rôle**: Recherche intelligente de règles et précédents comptables
- **Capacités**: Compréhension sémantique des requêtes, vectorisation des connaissances
- **Technologies**: SentenceTransformers, ChromaDB
- **Entrée**: Requête comptable contextuelle
- **Sortie**: Règles SYSCOHADA applicables et jurisprudence pertinente

### 4. Coherence & Compliance Check (CCC) Agent
- **Rôle**: Vérification et validation des écritures proposées
- **Capacités**: Détection d'anomalies, équilibrage automatique
- **Entrée**: Propositions d'écritures comptables
- **Sortie**: Écritures validées, rapport de conformité

### 5. Journal Entry Presentation (JEP) Agent
- **Rôle**: Préparation et formatage professionnel des écritures
- **Capacités**: Génération de libellés clairs, adaptation au format d'export souhaité
- **Entrée**: Écritures comptables validées
- **Sortie**: Journal comptable standardisé, prêt à l'import

### 6. History Agent
- **Rôle**: Gestion de l'historique des écritures et apprentissage continu
- **Capacités**: Traçabilité, recherche historique, analyse des tendances
- **Entrée**: Journal des opérations, requêtes utilisateur
- **Sortie**: Rapports analytiques, suggestions basées sur l'historique

## 🔄 Flux de Traitement des Données

```mermaid
graph TD
    A[Document/Prompt] --> B[DDE Agent]
    B --> C[Texte Structuré]
    C --> D[AA Agent]
    D <--> E[Retriever Agent]
    E --> F[Règles SYSCOHADA]
    D --> G[Propositions d'Écritures]
    G --> H[CCC Agent]
    H --> I[Écritures Validées]
    I --> J[JEP Agent]
    J --> K[Journal Comptable]
    K --> L[History Agent]
    L --> M[Rapports/Analytics]
```

## 🖥️ Installation et Configuration

### Prérequis
- Python 3.9+
- Django 4.2+
- Base de données PostgreSQL recommandée (SQLite pour développement)
- Tesseract OCR (required for document OCR capabilities)

### Étapes d'installation

1. **Clonez le dépôt**:
```bash
git clone https://github.com/cres/comptable_ia_api.git
cd comptable_ia_api
```

2. **Créez et activez l'environnement virtuel**:
```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
```

3. **Installez les dépendances**:
```bash
pip install -r requirements.txt
```

4. **Installez Tesseract OCR**:
   - **Windows**: 
     - Téléchargez l'installateur depuis [https://github.com/UB-Mannheim/tesseract/wiki](https://github.com/UB-Mannheim/tesseract/wiki)
     - Ajoutez le répertoire d'installation de Tesseract à votre PATH
   - **Linux**:
     ```bash
     sudo apt-get update
     sudo apt-get install tesseract-ocr
     sudo apt-get install tesseract-ocr-fra  # Pack de langue français
     ```
   - **macOS**:
     ```bash
     brew install tesseract
     brew install tesseract-lang  # Tous les packs de langue
     ```

5. **Configurez les variables d'environnement**:
Créez un fichier `.env` à la racine du projet :

## 🔐 Authentification API

L'API utilise l'authentification JWT (JSON Web Token) pour sécuriser les endpoints. Voici comment l'utiliser:

### 1. Créer un compte utilisateur

```bash
POST /api/signup/

{
  "email": "utilisateur@example.com",
  "password": "votre_mot_de_passe_securise"
}
```

### 2. Obtenir un token JWT

```bash
POST /api/login/

{
  "email": "utilisateur@example.com",
  "password": "votre_mot_de_passe_securise"
}
```

Réponse:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "utilisateur@example.com"
  }
}
```

### 3. Utiliser le token pour accéder aux endpoints protégés

Ajoutez l'en-tête `Authorization` avec la valeur `Bearer <votre_token>` à vos requêtes:

```bash
GET /api/accounts/512/summary/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

⚠️ **Important**: N'oubliez pas d'ajouter le préfixe `Bearer` suivi d'un espace avant votre token JWT. Sans ce préfixe, l'authentification échouera.

### 4. Rafraîchir un token expiré

Si votre token d'accès a expiré (après 60 minutes par défaut), vous pouvez en obtenir un nouveau:

```bash
POST /api/token/refresh/

{
  "refresh": "votre_refresh_token"
}
```

Réponse:
```json
{
  "access": "nouveau_token_d_acces"
}
```

## 📚 Documentation des API

Cette section fournit des exemples pour chaque endpoint disponible dans l'API. Pour toutes les requêtes qui nécessitent une authentification, n'oubliez pas d'inclure l'en-tête `Authorization: Bearer <votre_token>`.

### 1. Gestion des utilisateurs

#### 1.1. Inscription d'un utilisateur

**Endpoint**: `POST /api/signup/`  
**Auth**: Non requis

**Requête**:
```json
{
  "email": "nouvel.utilisateur@example.com",
  "password": "MotDePasse123!"
}
```

**Réponse réussie** (201 Created):
```json
{
  "message": "User created successfully."
}
```

**Réponse erreur** (400 Bad Request):
```json
{
  "error": "Email already exists."
}
```

#### 1.2. Connexion (obtention du token)

**Endpoint**: `POST /api/login/`  
**Auth**: Non requis

**Requête**:
```json
{
  "email": "utilisateur@example.com",
  "password": "MotDePasse123!"
}
```

**Réponse réussie** (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjU1MzQ2NjgwLCJpYXQiOjE2NTUzNDYzODAsImp0aSI6ImQ3YWRmOGQ4NGJiOTQ0Njk...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTY1NTQzMjc4MCwiaWF0IjoxNjU1MzQ2MzgwLCJqdGkiOiJmZDczNDY5MWM5Y2E...",
  "user": {
    "id": 1,
    "email": "utilisateur@example.com"
  }
}
```

**Réponse erreur** (401 Unauthorized):
```json
{
  "error": "Identifiants incorrects"
}
```

#### 1.3. Rafraîchir le token d'accès

**Endpoint**: `POST /api/token/refresh/`  
**Auth**: Non requis

**Requête**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTY1NTQzMjc4MCwiaWF0IjoxNjU1MzQ2MzgwLCJqdGkiOiJmZDczNDY5MWM5Y2E..."
}
```

**Réponse réussie** (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjU1MzUwMjgwLCJpYXQiOjE2NTUzNDYzODAsImp0aSI6IjU0MzYxOGE3..."
}
```

**Réponse erreur** (401 Unauthorized):
```json
{
  "error": "Token invalide ou expiré"
}
```

### 2. Gestion des documents comptables

#### 2.1. Téléchargement et analyse d'un document comptable

**Endpoint**: `POST /api/upload/`  
**Auth**: Requis  
**Format**: multipart/form-data

**Requête**:
```bash
curl -X POST http://localhost:8000/api/upload/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -F "file=@/chemin/vers/facture.pdf" \
  -F "intention=ecriture_simple" \
  -F "save_to_history=true"
```

**Paramètres**:
- `file`: Le fichier à analyser (PDF, JPG, PNG)
- `intention`: Le type de traitement souhaité (optionnel, défaut: ecriture_simple)
- `save_to_history`: Indique si les écritures doivent être sauvegardées dans l'historique (optionnel, défaut: false)
- `detail`: Inclure les détails d'interprétation (query parameter, optionnel, défaut: false)

**Réponse réussie** (200 OK):
```json
{
  "entries": [
    {
      "debit": [
        {
          "compte": "601100",
          "montant": 5000.00,
          "libelle": "Achat fournitures bureau - Facture F2023-456 - Fournisseur ABC"
        },
        {
          "compte": "445600",
          "montant": 900.00,
          "libelle": "TVA déductible - Facture F2023-456"
        }
      ],
      "credit": [
        {
          "compte": "401100",
          "montant": 5900.00,
          "libelle": "Dette fournisseur ABC - Facture F2023-456"
        }
      ],
      "date": "15/03/2024",
      "piece_reference": "F2023-456",
      "description": "Achat fournitures bureau auprès de ABC"
    }
  ],
  "verification": {
    "is_coherent": true,
    "is_compliant": true,
    "errors": []
  },
  "details": {
    "ocr_text": "Facture N°F2023-456\nDate: 15/03/2024\nFournisseur: ABC\nArticle: Fournitures bureau\nQuantité: 10\nPrix unitaire: 500 FCFA\nTotal HT: 5000 FCFA\nTVA (18%): 900 FCFA\nTotal TTC: 5900 FCFA",
    "confidence": 0.92,
    "missing_info": [],
    "applied_rules": ["Règle achat fournitures bureau"]
  }
}
```

**Réponse erreur** (400 Bad Request):
```json
{
  "error": "No file provided"
}
```

#### 2.2. Traitement par prompt en langage naturel

**Endpoint**: `POST /api/prompt/`  
**Auth**: Requis

**Requête**:
```json
{
  "prompt": "J'ai payé le loyer du bureau de 350 000 FCFA pour le mois de mars par virement bancaire le 5 mars 2024",
  "context": {
    "entreprise": "SARL Tech Solutions",
    "date": "05/03/2024",
    "devise": "FCFA"
  },
  "save_to_history": true
}
```

**Réponse réussie** (200 OK):
```json
{
  "debit": [
    {
      "compte": "6131",
      "montant": 350000.00,
      "libelle": "Loyer bureau mois de mars 2024 - SARL Tech Solutions"
    }
  ],
  "credit": [
    {
      "compte": "5211",
      "montant": 350000.00,
      "libelle": "Paiement loyer par virement - Mars 2024"
    }
  ],
  "date": "05/03/2024",
  "piece_reference": "VIR-05032024",
  "description": "Paiement loyer bureau mois de mars 2024",
  "token_usage": 387
}
```

**Réponse erreur** (400 Bad Request):
```json
{
  "error": "Prompt is required."
}
```

#### 2.3. Traitement par lots de documents

**Endpoint**: `POST /api/batch/process/`  
**Auth**: Requis  
**Format**: multipart/form-data

**Requête**:
```bash
curl -X POST http://localhost:8000/api/batch/process/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -F "file=@/chemin/vers/facture1.pdf" \
  -F "file=@/chemin/vers/facture2.pdf" \
  -F "intention=ecriture_simple"
```

**Réponse réussie** (202 Accepted):
```json
{
  "batch_id": "65f3a8d7-c5e0-4b9c-8f24-3e9c4b5a6d7e",
  "message": "Traitement par lot initié pour 2 documents",
  "status_endpoint": "/api/batch/65f3a8d7-c5e0-4b9c-8f24-3e9c4b5a6d7e/status"
}
```

**Réponse erreur** (400 Bad Request):
```json
{
  "error": "Aucun fichier fourni"
}
```

#### 2.4. Vérification du statut d'un traitement par lot

**Endpoint**: `GET /api/batch/{batch_id}/status/`  
**Auth**: Requis

**Requête**:
```bash
curl -X GET http://localhost:8000/api/batch/65f3a8d7-c5e0-4b9c-8f24-3e9c4b5a6d7e/status/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Réponse réussie** (200 OK):
```json
{
  "batch_id": "65f3a8d7-c5e0-4b9c-8f24-3e9c4b5a6d7e",
  "status": "completed",
  "progress": 100,
  "results": [
    {
      "file": "facture1.pdf",
      "status": "success",
      "entries": [
        {
          "debit": [{"compte": "601100", "montant": 5000.00, "libelle": "Achat fournitures"}],
          "credit": [{"compte": "401100", "montant": 5000.00, "libelle": "Dette fournisseur"}],
          "date": "15/03/2024",
          "piece_reference": "F2023-456",
          "description": "Achat fournitures"
        }
      ]
    },
    {
      "file": "facture2.pdf",
      "status": "success",
      "entries": [
        {
          "debit": [{"compte": "601200", "montant": 3000.00, "libelle": "Achat petit matériel"}],
          "credit": [{"compte": "401100", "montant": 3000.00, "libelle": "Dette fournisseur"}],
          "date": "18/03/2024",
          "piece_reference": "F2023-457",
          "description": "Achat petit matériel"
        }
      ]
    }
  ]
}
```

**Réponse erreur** (404 Not Found):
```json
{
  "error": "Traitement par lot non trouvé: 65f3a8d7-c5e0-4b9c-8f24-3e9c4b5a6d7e"
}
```

### 3. Gestion des écritures comptables

#### 3.1. Récupération de toutes les écritures

**Endpoint**: `GET /api/entries/`  
**Auth**: Requis

**Requête**:
```bash
curl -X GET http://localhost:8000/api/entries/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Réponse réussie** (200 OK):
```json
[
  {
    "debit": [
      {"compte": "601100", "montant": 5000.00, "libelle": "Achat fournitures bureau"}
    ],
    "credit": [
      {"compte": "401100", "montant": 5000.00, "libelle": "Dette fournisseur"}
    ],
    "date": "15/03/2024",
    "piece_reference": "F2023-456",
    "description": "Achat fournitures bureau"
  },
  {
    "debit": [
      {"compte": "512100", "montant": 10000.00, "libelle": "Dépôt en banque"}
    ],
    "credit": [
      {"compte": "571000", "montant": 10000.00, "libelle": "Sortie caisse"}
    ],
    "date": "10/03/2024",
    "piece_reference": "DEP-123",
    "description": "Dépôt espèces en banque"
  }
]
```

#### 3.2. Création d'une écriture comptable

**Endpoint**: `POST /api/entries/`  
**Auth**: Requis

**Requête**:
```json
{
  "debit": [
    {"compte": "512100", "montant": 150000.00, "libelle": "Virement reçu du client ABC"}
  ],
  "credit": [
    {"compte": "411000", "montant": 150000.00, "libelle": "Règlement facture FA-2023-123"}
  ],
  "date": "20/03/2024",
  "piece_reference": "VR-2024-045",
  "description": "Encaissement virement client ABC"
}
```

**Réponse réussie** (201 Created):
```json
{
  "debit": [
    {"compte": "512100", "montant": 150000.00, "libelle": "Virement reçu du client ABC"}
  ],
  "credit": [
    {"compte": "411000", "montant": 150000.00, "libelle": "Règlement facture FA-2023-123"}
  ],
  "date": "20/03/2024",
  "piece_reference": "VR-2024-045",
  "description": "Encaissement virement client ABC"
}
```

**Réponse erreur** (400 Bad Request):
```json
{
  "debit": ["Ce champ est obligatoire."],
  "credit": ["Ce champ est obligatoire."]
}
```

#### 3.3. Modification d'une écriture comptable

**Endpoint**: `PUT /api/entries/{id}/`  
**Auth**: Requis

**Requête**:
```json
{
  "debit": [
    {"compte": "512100", "montant": 155000.00, "libelle": "Virement reçu du client ABC (corrigé)"}
  ],
  "credit": [
    {"compte": "411000", "montant": 155000.00, "libelle": "Règlement facture FA-2023-123 (corrigé)"}
  ],
  "date": "20/03/2024",
  "piece_reference": "VR-2024-045",
  "description": "Encaissement virement client ABC - montant corrigé"
}
```

**Réponse réussie** (200 OK):
```json
{
  "debit": [
    {"compte": "512100", "montant": 155000.00, "libelle": "Virement reçu du client ABC (corrigé)"}
  ],
  "credit": [
    {"compte": "411000", "montant": 155000.00, "libelle": "Règlement facture FA-2023-123 (corrigé)"}
  ],
  "date": "20/03/2024",
  "piece_reference": "VR-2024-045",
  "description": "Encaissement virement client ABC - montant corrigé"
}
```

**Réponse erreur** (404 Not Found):
```json
{
  "error": "Journal entry not found"
}
```

### 4. Consultation et analyse de l'historique

#### 4.1. Résumé d'un compte

**Endpoint**: `GET /api/accounts/{account}/summary/`  
**Auth**: Requis

**Requête**:
```bash
curl -X GET http://localhost:8000/api/accounts/512100/summary/?start_date=2024-01-01&end_date=2024-03-31 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Paramètres**:
- `start_date`: Date de début de la période (optionnel)
- `end_date`: Date de fin de la période (optionnel)

**Réponse réussie** (200 OK):
```json
{
  "account": "512100",
  "total_debit": 315000.00,
  "total_credit": 75000.00,
  "balance": 240000.00,
  "movements": [
    {
      "date": "10/03/2024",
      "description": "Dépôt espèces en banque",
      "debit": 10000.00,
      "credit": 0.00,
      "entry_id": "entry_123"
    },
    {
      "date": "15/03/2024",
      "description": "Paiement loyer",
      "debit": 0.00,
      "credit": 75000.00,
      "entry_id": "entry_124"
    },
    {
      "date": "20/03/2024",
      "description": "Encaissement virement client ABC",
      "debit": 155000.00,
      "credit": 0.00,