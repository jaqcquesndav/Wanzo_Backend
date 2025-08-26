# Schémas d'architecture Adha AI Service

## 1. Architecture générale

```mermaid
flowchart TB
    subgraph External
        Client[Client Applications]
        Docs[Documents/PDFs]
        Users[End Users]
    end
    
    subgraph "Adha AI Service (Django/DRF)"
        direction TB
        API[REST API Gateway]
        Router[Agent Router]
        
        subgraph "Specialized Agents"
            direction LR
            DDE[Document Detection<br/>& Extraction Agent]
            AA[Accounting Analysis<br/>Agent]
            FC[Financial Calculator<br/>Agent]
        end
        
        subgraph "Core Components"
            direction TB
            KnowledgeBase[Knowledge Base<br/>9 Specialized Domains]
            Calculator[Financial Calculator<br/>Engine]
            ConfigMgr[Country Configuration<br/>Manager]
        end
        
        subgraph "AI Components"
            direction LR
            GPT4[OpenAI GPT-4]
            Embeddings[SentenceTransformers]
            VectorDB[ChromaDB<br/>(Optional)]
        end
    end
    
    Client -->|HTTP/REST| API
    Docs -->|Upload| API
    Users -->|Requests| API
    
    API --> Router
    Router -->|Document Processing| DDE
    Router -->|Financial Analysis| AA
    Router -->|Calculations| FC
    
    DDE --> GPT4
    AA --> GPT4
    FC --> Calculator
    
    AA --> KnowledgeBase
    FC --> ConfigMgr
    
    KnowledgeBase -.->|Retrieval| Embeddings
    KnowledgeBase -.->|Vector Search| VectorDB
    
    Calculator -->|Results| API
    AA -->|Analysis| API
    DDE -->|Extracted Data| API
```

## 2. Architecture des Bases de Connaissances

```mermaid
flowchart TD
    subgraph "Knowledge Base System"
        direction TB
        
        subgraph "Financial Domains"
            Fiscal[Fiscal RDC<br/>TVA, IPP, IPR]
            Accounting[SYSCOHADA<br/>Accounting Standards]
            FinMath[Financial Math<br/>Formulas & Calculations]
            Econometrics[Econometrics<br/>Statistical Models]
        end
        
        subgraph "Valuation & Audit"
            Valuation[Enterprise Valuation<br/>DCF, Multiples, Asset-based]
            DueDiligence[Due Diligence<br/>Audit Processes]
        end
        
        subgraph "Credit & Portfolio"
            Credit[Credit Analysis<br/>Micro/SME/ME Segments]
            PortfolioAudit[Portfolio Audit<br/>Quality Controls]
            PortfolioPerf[Portfolio Performance<br/>KPIs & Benchmarking]
        end
        
        subgraph "Knowledge Retrieval Engine"
            Retriever[Knowledge Retriever]
            Mapper[Domain Mapper]
            Extractor[Section Extractor]
        end
    end
    
    Retriever --> Mapper
    Mapper --> Fiscal
    Mapper --> Accounting
    Mapper --> FinMath
    Mapper --> Econometrics
    Mapper --> Valuation
    Mapper --> DueDiligence
    Mapper --> Credit
    Mapper --> PortfolioAudit
    Mapper --> PortfolioPerf
    
    Retriever --> Extractor
    Extractor -->|Markdown Parsing| Retriever
```
## 3. Flux de traitement des calculs financiers

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant API as Adha AI API
    participant Router as Agent Router
    participant Config as Country Config
    participant Calculator as Financial Calculator
    participant Knowledge as Knowledge Base
    participant GPT4 as OpenAI GPT-4
    
    Client->>API: POST /api/v1/calculations/
    Note over Client,API: Request: {type: "tva", country: "CD", data: {...}}
    
    API->>Router: Route calculation request
    Router->>Config: Get country configuration (CD)
    Config-->>Router: Return RDC tax rates & rules
    
    Router->>Calculator: Execute calculation with config
    Calculator->>Knowledge: Retrieve fiscal knowledge
    Knowledge-->>Calculator: Return relevant tax formulas
    
    Calculator->>Calculator: Apply calculation logic
    Note over Calculator: Calculate TVA: 1,000,000 * 0.16 = 160,000
    
    Calculator->>GPT4: Generate explanation (optional)
    GPT4-->>Calculator: Return human-readable explanation
    
    Calculator-->>Router: Calculation results
    Router-->>API: Structured response
    API-->>Client: JSON result with calculations
    
    Note over Client,API: Response: {tva_amount: 160000, explanation: "..."}
```

## 4. Architecture des agents spécialisés

```mermaid
flowchart LR
    subgraph "Document Detection & Extraction (DDE) Agent"
        direction TB
        DocInput[Document Input<br/>PDF/Image/Scan]
        OCR[OCR Processing<br/>GPT-4 Vision]
        Extraction[Data Extraction<br/>Structured Output]
        
        DocInput --> OCR
        OCR --> Extraction
    end
    
    subgraph "Accounting Analysis (AA) Agent"
        direction TB
        FinData[Financial Data<br/>Input]
        Analysis[Financial Analysis<br/>GPT-4 + Rules]
        Reporting[Report Generation<br/>Recommendations]
        
        FinData --> Analysis
        Analysis --> Reporting
    end
    
    subgraph "Financial Calculator (FC) Agent"
        direction TB
        CalcRequest[Calculation Request<br/>Type + Parameters]
        CountryRules[Apply Country Rules<br/>RDC/OHADA]
        Execute[Execute Formulas<br/>Math Engine]
        
        CalcRequest --> CountryRules
        CountryRules --> Execute
    end
    
    subgraph "Knowledge Base"
        KB[(9 Specialized<br/>Domains)]
    end
    
    Extraction -.->|Feeds| FinData
    Analysis --> KB
    CountryRules --> KB
```

---

**Diagrammes mis à jour le 26 août 2025** - Architecture alignée sur l'implémentation Django/REST actuelle
