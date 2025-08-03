# ARCHITECTURE DU SYSTÈME DE SURVEILLANCE DES RISQUES FINANCIERS - WANZO

## 🏗️ VUE D'ENSEMBLE DE L'ARCHITECTURE

```mermaid
graph TB
    subgraph "MICROSERVICES WANZO"
        CS[Customer Service<br/>PME + Institutions]
        AS[Accounting Service<br/>Comptabilité PME]
        GCS[Gestion Commerciale<br/>ERP PME]
        PIS[Portfolio Institution<br/>Crédits + Portefeuilles]
        ADS[Admin Service<br/>Administration]
    end

    subgraph "ANALYTICS SERVICE - CENTRE DE RISQUES"
        subgraph "Data Ingestion Layer"
            KC[Kafka Consumers]
            ETL[ETL Processors]
            API[API Collectors]
        end
        
        subgraph "Data Storage Layer"
            NEO[(Neo4j<br/>Graph DB)]
            TS[(TimescaleDB<br/>Time Series)]
            PG[(PostgreSQL<br/>Data Lake)]
        end
        
        subgraph "Risk Analysis Engine"
            RA[Risk Analyzer]
            FD[Fraud Detector]
            SR[Systemic Risk Monitor]
            GA[Geographic Analyzer]
            SA[Sector Analyzer]
        end
        
        subgraph "API Layer"
            REST[REST APIs]
            GQL[GraphQL APIs]
            WS[WebSocket Alerts]
        end
    end

    subgraph "EXTERNAL CONSUMERS"
        DASH[Risk Dashboards]
        REG[Regulatory Reports]
        ALERT[Alert Systems]
        BI[Business Intelligence]
    end

    %% Data Flow
    CS --> KC
    AS --> KC
    GCS --> KC
    PIS --> KC
    ADS --> KC

    KC --> ETL
    API --> ETL
    
    ETL --> NEO
    ETL --> TS
    ETL --> PG

    NEO --> RA
    TS --> FD
    PG --> SR
    NEO --> GA
    TS --> SA

    RA --> REST
    FD --> WS
    SR --> REST
    GA --> GQL
    SA --> REST

    REST --> DASH
    REST --> REG
    WS --> ALERT
    GQL --> BI

    classDef service fill:#e1f5fe
    classDef storage fill:#f3e5f5
    classDef engine fill:#fff3e0
    classDef api fill:#e8f5e8
    classDef external fill:#fce4ec

    class CS,AS,GCS,PIS,ADS service
    class NEO,TS,PG storage
    class RA,FD,SR,GA,SA engine
    class REST,GQL,WS api
    class DASH,REG,ALERT,BI external
```

## 🌍 MODÈLE GÉOGRAPHIQUE RDC

```mermaid
graph TD
    RDC[République Démocratique du Congo]
    
    RDC --> KIN[Kinshasa]
    RDC --> BC[Bas-Congo]
    RDC --> BU[Bandundu]
    RDC --> EQ[Équateur]
    RDC --> PO[Province Orientale]
    RDC --> NK[Nord-Kivu]
    RDC --> SK[Sud-Kivu]
    RDC --> MA[Maniema]
    RDC --> KA[Katanga]
    RDC --> KO[Kasaï Oriental]
    RDC --> KC[Kasaï Occidental]
    
    KIN --> GOMBE[Gombe]
    KIN --> KINSH[Kinshasa]
    KIN --> LEMBA[Lemba]
    KIN --> LIMETE[Limete]
    
    BC --> MATADI[Matadi]
    BC --> BOMA[Boma]
    
    KA --> LUBUM[Lubumbashi]
    KA --> LIKASI[Likasi]
    
    %% Ajout des métriques de risque
    GOMBE -.->|"Risque: FAIBLE"| R1[Score: 2.1/10]
    MATADI -.->|"Risque: MOYEN"| R2[Score: 5.3/10]
    LUBUM -.->|"Risque: ÉLEVÉ"| R3[Score: 7.8/10]

    classDef country fill:#1976d2,color:#fff
    classDef province fill:#1e88e5,color:#fff
    classDef city fill:#42a5f5,color:#fff
    classDef commune fill:#64b5f6,color:#fff
    classDef risk fill:#ff5722,color:#fff

    class RDC country
    class KIN,BC,BU,EQ,PO,NK,SK,MA,KA,KO,KC province
    class MATADI,BOMA,LUBUM,LIKASI city
    class GOMBE,KINSH,LEMBA,LIMETE commune
    class R1,R2,R3 risk
```

## 🏭 MODÈLE SECTORIEL

```mermaid
graph LR
    subgraph "SECTEURS ÉCONOMIQUES RDC"
        AGR[Agriculture<br/>Risque: MOYEN]
        MIN[Mines<br/>Risque: ÉLEVÉ]
        COM[Commerce<br/>Risque: FAIBLE]
        SER[Services<br/>Risque: FAIBLE]
        IND[Industrie<br/>Risque: MOYEN]
        CON[Construction<br/>Risque: ÉLEVÉ]
        TRA[Transport<br/>Risque: MOYEN]
        TEC[Technologie<br/>Risque: FAIBLE]
    end

    subgraph "MÉTRIQUES PAR SECTEUR"
        AGR --> AGR_M[Défaut: 12%<br/>Croissance: +8%<br/>PME: 2,450]
        MIN --> MIN_M[Défaut: 18%<br/>Croissance: +15%<br/>PME: 890]
        COM --> COM_M[Défaut: 7%<br/>Croissance: +5%<br/>PME: 5,670]
        SER --> SER_M[Défaut: 6%<br/>Croissance: +12%<br/>PME: 3,210]
        IND --> IND_M[Défaut: 14%<br/>Croissance: +3%<br/>PME: 1,340]
        CON --> CON_M[Défaut: 22%<br/>Croissance: +25%<br/>PME: 780]
        TRA --> TRA_M[Défaut: 11%<br/>Croissance: +7%<br/>PME: 1,560]
        TEC --> TEC_M[Défaut: 4%<br/>Croissance: +35%<br/>PME: 320]
    end

    classDef high fill:#f44336,color:#fff
    classDef medium fill:#ff9800,color:#fff
    classDef low fill:#4caf50,color:#fff

    class MIN,CON high
    class AGR,IND,TRA medium
    class COM,SER,TEC low
```

## 🔗 MODÈLE DE RELATIONS NEO4J

```cypher
// SCHÉMA COMPLET DES RELATIONS DANS NEO4J

// Nœuds Géographiques
CREATE (rdc:Country {name: "RDC", code: "CD", riskScore: 6.2})
CREATE (kinshasa:Province {name: "Kinshasa", code: "KIN", riskScore: 4.1})
CREATE (gombe:Commune {name: "Gombe", riskScore: 2.1})

// Nœuds Sectoriels  
CREATE (agriculture:Sector {name: "Agriculture", code: "AGR", riskLevel: "MEDIUM", defaultRate: 0.12})
CREATE (tech:Sector {name: "Technologie", code: "TEC", riskLevel: "LOW", defaultRate: 0.04})

// Nœuds Entités Financières
CREATE (bcc:Institution {name: "Banque Centrale Congo", type: "CENTRAL_BANK", riskScore: 1.0})
CREATE (rawbank:Institution {name: "Rawbank", type: "COMMERCIAL_BANK", riskScore: 2.5})

// Nœuds PME
CREATE (pme1:SME {
    id: "SME-001", 
    name: "Agro-Business Kinshasa", 
    sector: "AGR",
    riskScore: 5.2,
    revenue: 850000,
    employees: 15
})

// Nœuds Financiers
CREATE (portfolio1:Portfolio {
    id: "PORT-001",
    name: "Portfolio PME Agriculture",
    targetAmount: 50000000,
    riskProfile: "MODERATE"
})

CREATE (credit1:Credit {
    id: "CRED-001",
    amount: 2500000,
    interestRate: 0.15,
    status: "ACTIVE",
    disbursementDate: "2024-06-15"
})

// Relations Géographiques
CREATE (gombe)-[:PART_OF]->(kinshasa)
CREATE (kinshasa)-[:PART_OF]->(rdc)

// Relations Business
CREATE (pme1)-[:LOCATED_IN]->(gombe)
CREATE (pme1)-[:OPERATES_IN]->(agriculture)
CREATE (pme1)-[:HAS_CREDIT]->(credit1)
CREATE (credit1)-[:MANAGED_BY]->(portfolio1)
CREATE (portfolio1)-[:OWNED_BY]->(rawbank)

// Relations de Risque
CREATE (pme1)-[:HAS_RISK_PROFILE]->(:RiskProfile {score: 5.2, level: "MEDIUM"})
CREATE (credit1)-[:HAS_PAYMENT_HISTORY]->(:PaymentHistory {onTimeRate: 0.85, avgDelay: 12})
```

## 📊 TIMESCALEDB - SCHÉMA TEMPOREL

```sql
-- Table principale des métriques de risque
CREATE TABLE risk_metrics (
    time TIMESTAMPTZ NOT NULL,
    entity_type VARCHAR(20) NOT NULL, -- SME, INSTITUTION, PORTFOLIO, CREDIT
    entity_id UUID NOT NULL,
    metric_name VARCHAR(50) NOT NULL, -- risk_score, default_probability, etc.
    metric_value DOUBLE PRECISION NOT NULL,
    
    -- Dimensions géographiques
    country VARCHAR(10) DEFAULT 'RDC',
    province VARCHAR(50),
    city VARCHAR(100),
    commune VARCHAR(100),
    
    -- Dimensions sectorielles
    sector_code VARCHAR(10),
    sector_name VARCHAR(100),
    
    -- Dimensions institutionnelles
    institution_id UUID,
    institution_type VARCHAR(50),
    
    -- Métadonnées
    calculation_model VARCHAR(50),
    confidence_level DOUBLE PRECISION,
    metadata JSONB
);

-- Hypertable pour performance
SELECT create_hypertable('risk_metrics', 'time');

-- Index pour requêtes fréquentes
CREATE INDEX idx_risk_metrics_entity ON risk_metrics (entity_type, entity_id, time DESC);
CREATE INDEX idx_risk_metrics_geo ON risk_metrics (province, city, time DESC);
CREATE INDEX idx_risk_metrics_sector ON risk_metrics (sector_code, time DESC);

-- Table des alertes en temps réel
CREATE TABLE risk_alerts (
    time TIMESTAMPTZ NOT NULL,
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL, -- FRAUD, DEFAULT_RISK, SYSTEMIC, etc.
    severity VARCHAR(10) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    
    entity_type VARCHAR(20) NOT NULL,
    entity_id UUID NOT NULL,
    entity_name VARCHAR(200),
    
    score DOUBLE PRECISION NOT NULL,
    threshold DOUBLE PRECISION NOT NULL,
    
    -- Contexte géographique
    province VARCHAR(50),
    city VARCHAR(100),
    sector_code VARCHAR(10),
    
    -- Détails de l'alerte
    description TEXT,
    recommended_actions JSONB,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, RESOLVED
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- Métadonnées
    detection_model VARCHAR(50),
    related_alerts UUID[],
    metadata JSONB
);

SELECT create_hypertable('risk_alerts', 'time');

-- Vues matérialisées pour analytics
CREATE MATERIALIZED VIEW risk_summary_by_province AS
SELECT 
    province,
    date_trunc('day', time) as day,
    entity_type,
    avg(metric_value) as avg_risk_score,
    count(*) as total_entities,
    sum(case when metric_value > 7.0 then 1 else 0 end) as high_risk_count
FROM risk_metrics 
WHERE metric_name = 'risk_score'
GROUP BY province, day, entity_type;

-- Politique de rétention (garder 2 ans de données détaillées)
SELECT add_retention_policy('risk_metrics', INTERVAL '2 years');
SELECT add_retention_policy('risk_alerts', INTERVAL '5 years'); -- Alertes gardées plus longtemps
```

## 🚀 APIS ET ENDPOINTS

### 1. APIs Géographiques
```typescript
// Geographic Risk Analysis
GET /api/v1/analytics/geographic/provinces
GET /api/v1/analytics/geographic/provinces/{province}/overview
GET /api/v1/analytics/geographic/cities/{city}/risk-profile
GET /api/v1/analytics/geographic/heatmap

// Réponse exemple
{
  "province": "Kinshasa",
  "riskScore": 4.1,
  "totalSMEs": 8945,
  "highRiskSMEs": 234,
  "defaultRate": 0.086,
  "growthRate": 0.12,
  "sectors": [
    {"name": "Commerce", "smeCount": 3456, "riskScore": 3.2},
    {"name": "Services", "smeCount": 2134, "riskScore": 3.8}
  ]
}
```

### 2. APIs Sectorielles
```typescript
// Sector Risk Analysis
GET /api/v1/analytics/sectors
GET /api/v1/analytics/sectors/{sector}/performance
GET /api/v1/analytics/sectors/{sector}/institutions
GET /api/v1/analytics/sectors/comparison

// Réponse exemple
{
  "sector": "Agriculture",
  "riskLevel": "MEDIUM",
  "defaultRate": 0.12,
  "totalCredits": 125600000,
  "avgCreditSize": 2840000,
  "institutions": 12,
  "trends": {
    "6months": "IMPROVING",
    "12months": "STABLE"
  }
}
```

### 3. APIs de Surveillance des Risques
```typescript
// Real-time Risk Monitoring
GET /api/v1/analytics/risk/dashboard
GET /api/v1/analytics/risk/alerts
GET /api/v1/analytics/risk/systemic
POST /api/v1/analytics/risk/calculate

// WebSocket pour alertes temps réel
WS /api/v1/analytics/risk/alerts/stream

// Réponse alerte
{
  "alertId": "alert-uuid",
  "type": "HIGH_DEFAULT_RISK",
  "severity": "HIGH",
  "entity": {
    "type": "SME",
    "id": "sme-uuid",
    "name": "Entreprise ABC"
  },
  "score": 8.7,
  "threshold": 7.0,
  "location": {
    "province": "Katanga",
    "city": "Lubumbashi"
  },
  "recommendedActions": [
    "Increase monitoring frequency",
    "Request additional guarantees",
    "Review credit terms"
  ]
}
```

Cette architecture transforme le microservice analytics en véritable **observatoire des risques financiers** pour le marché congolais, capable de fournir une surveillance en temps réel et des analyses prédictives sophistiquées.
