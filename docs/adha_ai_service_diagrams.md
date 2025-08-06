# Schémas d'architecture Adha AI Service

## 1. Architecture générale

```mermaid
flowchart TB
    subgraph Microservices
        GC[Gestion Commerciale]
        PI[Portfolio Institution]
        AS[Accounting Service]
    end
    
    subgraph "Adha AI Service"
        direction TB
        Kafka[Kafka Consumer]
        Router[Task Router]
        subgraph "Services AI"
            direction LR
            ChatP[Chat Processor]
            AccP[Accounting Processor] 
            PortP[Portfolio Analyzer]
        end
        subgraph "AI Components"
            direction TB
            LLM[LLM Connectors]
            VDB[Vector Databases]
        end
    end
    
    GC -->|Opérations| Kafka
    PI -->|Demandes d'analyse| Kafka
    Kafka --> Router
    Router -->|Chat Request| ChatP
    Router -->|Commerce Operation| AccP
    Router -->|Portfolio Analysis| PortP
    
    ChatP --> LLM
    AccP --> LLM
    PortP --> LLM
    
    ChatP -.-> VDB
    PortP -.-> VDB
    
    AccP -->|Journal Entry| AS
    PortP -->|Analysis Results| PI
    
    AS -->|Status Update| Kafka
```

## 2. Flux de données

```mermaid
sequenceDiagram
    participant GC as Gestion Commerciale
    participant KF as Kafka
    participant Adha as Adha AI Service
    participant ACC as Accounting Service
    participant PI as Portfolio Institution
    
    GC->>KF: Publier opération commerciale
    KF->>Adha: Transmettre message (Topic: commerce.operation)
    Note over Adha: Task Router identifie le type d'opération
    Note over Adha: Transformation en écriture comptable
    Adha->>ACC: Envoyer écriture comptable
    ACC->>KF: Publier statut traitement
    KF->>Adha: Transmettre statut
    
    PI->>KF: Publier demande d'analyse
    KF->>Adha: Transmettre demande (Topic: portfolio.analysis)
    Note over Adha: Analyse du portefeuille
    Adha->>PI: Envoyer résultats d'analyse
```

## 3. Architecture des modèles AI

```mermaid
flowchart TD
    Input[Données entrantes]
    
    subgraph "Preprocessing"
        Extract[Extraction du contexte]
        Normalize[Normalisation]
        Prepare[Préparation des prompts]
    end
    
    subgraph "AI Processing"
        direction LR
        OpenAI[OpenAI API]
        HF[HuggingFace Models]
        Embedding[Embedding Generation]
        VectorSearch[Vector Search]
    end
    
    subgraph "PostProcessing"
        Format[Formatage réponse]
        Validate[Validation métier]
        Enrich[Enrichissement]
    end
    
    Input --> Extract
    Extract --> Normalize
    Normalize --> Prepare
    
    Prepare --> OpenAI
    Prepare --> HF
    Prepare --> Embedding
    
    Embedding --> VectorSearch
    
    OpenAI --> Format
    HF --> Format
    VectorSearch --> Format
    
    Format --> Validate
    Validate --> Enrich
    
    Enrich --> Output[Données sortantes]
    
    ChromaDB[(ChromaDB)] --- VectorSearch
```

## 4. Modes de fonctionnement

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    state "Adha AI Service" as Adha {
        state Idle
        
        Idle --> ChatMode : Message utilisateur
        Idle --> AccountingMode : Opération commerciale
        Idle --> AnalysisMode : Demande d'analyse
        
        state ChatMode {
            ProcessChat --> GenerateResponse
            GenerateResponse --> SendResponse
        }
        
        state AccountingMode {
            ProcessOperation --> GenerateEntry
            GenerateEntry --> ValidateEntry
            ValidateEntry --> SendEntry
        }
        
        state AnalysisMode {
            ExtractPortfolio --> PerformAnalysis
            PerformAnalysis --> GenerateRecommendations
            GenerateRecommendations --> SendAnalysis
        }
        
        ChatMode --> Idle : Réponse envoyée
        AccountingMode --> Idle : Écriture envoyée
        AnalysisMode --> Idle : Analyse envoyée
    }
```

## 5. Interactions entre microservices

```mermaid
flowchart LR
    subgraph "Core Services"
        GC[Gestion Commerciale]
        ACC[Accounting Service]
        PI[Portfolio Institution]
    end
    
    subgraph "Adha AI Service"
        Chat[Chat Module]
        AccProc[Accounting Processor]
        PortAnal[Portfolio Analyzer]
    end
    
    GC <-->|Opérations commerciales| AccProc
    AccProc <-->|Écritures comptables| ACC
    PI <-->|Données portefeuille| PortAnal
    PortAnal -->|Analyses & Recommandations| PI
    
    Chat -.->|Contexte comptable| ACC
    Chat -.->|Contexte portefeuille| PI
```
