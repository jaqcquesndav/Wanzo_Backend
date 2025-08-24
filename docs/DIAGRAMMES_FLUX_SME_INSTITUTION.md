# Diagrammes de Flux - Processus SME vs Institution

## 🏢 Flux SME (Petite/Moyenne Entreprise)

```mermaid
graph TD
    A[👤 Utilisateur SME] --> B[📝 Inscription Customer Service]
    B --> C{Type: SME}
    C --> D[🏪 Création Customer SME]
    D --> E[🔐 Création Auth0 User]
    E --> F[📤 Kafka: CustomerCreatedEvent type=SME]
    
    F --> G[📨 Gestion Commerciale Consumer]
    F --> H[📨 Accounting Consumer]
    F --> I[❌ Portfolio Consumer IGNORE]
    
    G --> J[🏢 Création Company locale]
    H --> K[📊 Création Organization locale]
    
    %% Première connexion
    L[🖥️ Frontend SME] --> M[🔑 Login Auth0]
    M --> N[🎫 JWT Token]
    N --> O[🌐 API Gateway]
    O --> P[🏢 Gestion Commerciale Service]
    
    P --> Q{Company existe?}
    Q -->|Non| R[📤 Kafka Sync Request]
    Q -->|Oui| S[✅ Profil Complet]
    R --> T[📥 Customer Service Response]
    T --> U[🔄 Création Company locale]
    U --> S
    
    S --> V[🛡️ CompanyAuthGuard]
    V --> W[📱 Accès Dashboard SME]
    
    classDef sme fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef ignore fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    
    class A,B,D,G,J,L,P,S,V,W sme
    class I ignore
    class S,V,W success
```

## 🏦 Flux Institution Financière

```mermaid
graph TD
    A[👤 Utilisateur Institution] --> B[📝 Inscription Customer Service]
    B --> C{Type: INSTITUTION}
    C --> D[🏦 Création Customer Institution]
    D --> E[🔐 Création Auth0 User]
    E --> F[📤 Kafka: CustomerCreatedEvent type=INSTITUTION]
    
    F --> G[📨 Portfolio Consumer]
    F --> H[📨 Accounting Consumer]
    F --> I[📨 Gestion Commerciale Consumer]
    
    G --> J[🏦 Création Institution locale]
    H --> K[📊 Création Organization locale]
    I --> L[🏢 Création Company locale]
    
    %% Première connexion
    M[🖥️ Frontend Institution] --> N[🔑 Login Auth0]
    N --> O[🎫 JWT Token]
    O --> P[🌐 API Gateway]
    P --> Q[🏦 Portfolio Service]
    
    Q --> R{Institution existe?}
    R -->|Non| S[📤 Kafka Customer Sync Request]
    R -->|Oui| T[✅ Profil Complet]
    S --> U[📥 Customer Service Response]
    U --> V[🔄 Création Institution locale]
    V --> T
    
    T --> W[🛡️ InstitutionAuthGuard]
    W --> X[📊 Accès Portfolio Dashboard]
    
    classDef institution fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef shared fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    
    class A,B,D,G,J,M,Q,T,W,X institution
    class T,W,X success
    class H,I,K,L shared
```

## 🔄 Flux de Synchronisation Kafka

```mermaid
sequenceDiagram
    participant CS as Customer Service
    participant K as Kafka
    participant GC as Gestion Commerciale
    participant PS as Portfolio Service
    participant AS as Accounting Service
    
    Note over CS: Création d'un nouveau customer
    
    CS->>K: CustomerCreatedEvent
    Note over K: { customerId, type: 'SME'/'INSTITUTION', data... }
    
    par Diffusion parallèle
        K->>GC: Event reçu
        K->>PS: Event reçu  
        K->>AS: Event reçu
    end
    
    alt Type = SME
        GC->>GC: ✅ Traite → Company
        PS->>PS: ❌ Ignore (filter)
        AS->>AS: ✅ Traite → Organization
    else Type = INSTITUTION
        GC->>GC: ✅ Traite → Company
        PS->>PS: ✅ Traite → Institution
        AS->>AS: ✅ Traite → Organization
    end
    
    Note over GC,AS: Données synchronisées selon le type
```

## 🔐 Flux d'Authentification Détaillé

```mermaid
graph LR
    subgraph "Phase 1: Authentification"
        A[🔑 JWT Token] --> B[🔍 Validation Token]
        B --> C[👤 Extract userId]
    end
    
    subgraph "Phase 2: Vérification Entité"
        C --> D{Entité locale existe?}
        D -->|Oui| E[✅ Entité trouvée]
        D -->|Non| F[📤 Kafka Sync Request]
        F --> G[⏳ Attente réponse]
        G --> H{Customer Service répond?}
        H -->|Oui| I[🔄 Création entité locale]
        H -->|Non| J[❌ Erreur: Entité non trouvée]
        I --> E
    end
    
    subgraph "Phase 3: Autorisation"
        E --> K[🛡️ Security Guard]
        K --> L{Type entité correct?}
        L -->|SME + Company Service| M[✅ CompanyAuthGuard]
        L -->|Institution + Portfolio| N[✅ InstitutionAuthGuard]
        L -->|Mismatch| O[❌ Accès refusé]
        M --> P[📱 Accès autorisé]
        N --> P
    end
    
    classDef auth fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef entity fill:#f1f8e9,stroke:#388e3c,stroke-width:2px
    classDef guard fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef error fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    
    class A,B,C auth
    class D,E,F,G,H,I entity
    class K,L,M,N guard
    class J,O error
    class P success
```

## 📊 Matrice de Traitement des Événements

| Service | Type SME | Type INSTITUTION | Action |
|---------|----------|------------------|--------|
| **Customer Service** | ✅ Source | ✅ Source | Émet CustomerCreatedEvent |
| **Gestion Commerciale** | ✅ Company | ✅ Company | Écoute OrganizationEvents |
| **Portfolio** | ❌ Ignore | ✅ Institution | Écoute CustomerEvents (filtrés) |
| **Accounting** | ✅ Organization | ✅ Organization | Écoute OrganizationEvents |

## 🎯 Points Clés du Processus

### ✅ Pour SME
1. **Inscription** → Customer Service (type: SME)
2. **Synchronisation** → Gestion Commerciale + Accounting
3. **Connexion** → Via Gestion Commerciale Service
4. **Sécurité** → CompanyAuthGuard
5. **Accès** → Dashboard entreprise

### ✅ Pour Institution
1. **Inscription** → Customer Service (type: INSTITUTION)
2. **Synchronisation** → Portfolio + Accounting + Gestion Commerciale
3. **Connexion** → Via Portfolio Service (filtrage type=INSTITUTION)
4. **Sécurité** → InstitutionAuthGuard
5. **Accès** → Dashboard institution financière

### 🔒 Règles de Sécurité
- **Pas d'accès sans entité** : Guards bloquent si pas d'association
- **Synchronisation obligatoire** : Kafka assure la cohérence
- **Filtrage par type** : Chaque service ne traite que ses types
- **Terminologie cohérente** : Customer → Company/Institution/Organization

---

Ces diagrammes illustrent la robustesse et la flexibilité de l'architecture Wanzo pour gérer différents types de clients avec des workflows adaptés à chaque métier.
