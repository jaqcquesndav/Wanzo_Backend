# 🤖 Configuration du Serveur XGBoost Externe pour le Calcul de Cote Crédit

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 ACCOUNTING SERVICE                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              CREDIT SCORING MODULE                          │ │
│  │  1. ✅ Collecte données comptables (journals)              │ │
│  │  2. ✅ Transforme en features XGBoost                      │ │
│  │  3. ✅ POST /predict-credit-score                          │ │
│  │  4. ✅ Reçoit prédiction 0.0-1.0                          │ │
│  │  5. ✅ Expose résultats via endpoints                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP Call
                              ▼ Features + Request
┌─────────────────────────────────────────────────────────────────┐
│                  SERVEUR XGBOOST EXTERNE                       │
│                  Container: xgboost-service                    │
│                     Port: 5000                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │     Endpoint: POST /predict-credit-score                   │ │
│  │     Input: Features → XGBoost Model → Score 0.0-1.0        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration Docker

### Variables d'Environnement Ajoutées

**Accounting Service Production:**
```yaml
kiota-accounting-service:
  environment:
    # ML Service Configuration for XGBoost Credit Scoring
    - ML_SERVICE_URL=http://xgboost-service:5000
    - ML_SERVICE_API_KEY=${ML_SERVICE_API_KEY}
```

**Accounting Service Development:**
```yaml
kiota-accounting-service-dev:
  environment:
    # ML Service Configuration for XGBoost Credit Scoring
    - ML_SERVICE_URL=http://xgboost-service:5000
    - ML_SERVICE_API_KEY=${ML_SERVICE_API_KEY}
```

### Fichier .env à Créer

Créer un fichier `.env` à la racine du projet avec :
```bash
# XGBoost Service Configuration
ML_SERVICE_API_KEY=your-secure-api-key-here
```

## 📡 API Contract - Serveur XGBoost

### Endpoint: POST /predict-credit-score

**URL:** `http://xgboost-service:5000/predict-credit-score`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer ${ML_SERVICE_API_KEY}  # Optionnel
```

**Request Body:**
```json
{
  "companyId": "company-123",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z",
  "features": {
    "monthlyTransactionVolumes": [1000, 1200, 1100, 1300],
    "averageBalance": 25000.50,
    "transactionFrequency": 150,
    "cashFlowPattern": "stable",
    "seasonalityIndex": 0.2,
    "businessActivityScore": 75,
    "cashInflows": {
      "sales": [...],
      "bankTransfers": [...],
      "investments": [...],
      "financing": [...]
    },
    "cashOutflows": {
      "costOfGoods": [...],
      "variableCosts": [...],
      "fixedCosts": [...],
      "investmentFinancing": [...]
    },
    "financialMetrics": {
      "revenue": 500000,
      "totalAssets": 750000,
      "outstandingLoans": 150000,
      "currentRatio": 1.5,
      "quickRatio": 1.2,
      "debtToEquity": 0.3,
      "operatingMargin": 0.15
    }
  }
}
```

**Response Body:**
```json
{
  "success": true,
  "prediction": 0.75,              // Score 0.0-1.0
  "confidence": 0.85,              // Niveau de confiance
  "modelVersion": "xgboost-v1.2",  // Version du modèle
  "processingTime": 150,           // Temps en ms
  "metadata": {
    "featuresUsed": 47,
    "modelAccuracy": 0.92,
    "lastTrainingDate": "2024-10-01T00:00:00.000Z"
  }
}
```

## 🚀 Déploiement du Serveur XGBoost

### Option 1: Service Docker Séparé

Créer un fichier `docker-compose.xgboost.yml` :

```yaml
version: '3.8'
services:
  xgboost-service:
    image: your-registry/xgboost-credit-service:latest
    container_name: xgboost-service
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - MODEL_PATH=/app/models/credit_score_model.pkl
      - API_KEY=${ML_SERVICE_API_KEY}
    volumes:
      - ./xgboost-models:/app/models
    networks:
      - wanzo
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  wanzo:
    external: true
```

**Démarrage:**
```bash
docker-compose -f docker-compose.xgboost.yml up -d
```

### Option 2: Intégration dans le Docker Compose Principal

Ajouter au `docker-compose.yml` principal :

```yaml
  xgboost-service:
    image: your-registry/xgboost-credit-service:latest
    container_name: xgboost-service
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - MODEL_PATH=/app/models/credit_score_model.pkl
      - API_KEY=${ML_SERVICE_API_KEY}
    volumes:
      - ./xgboost-models:/app/models
    networks:
      - wanzo
    restart: unless-stopped
    profiles:
      - prod
      - dev
```

## 🧪 Tests de Communication

### Test 1: Health Check du Service XGBoost
```bash
curl -X GET http://localhost:5000/health
```

### Test 2: Test de Prédiction
```bash
curl -X POST http://localhost:5000/predict-credit-score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "companyId": "test-123",
    "features": {
      "averageBalance": 25000,
      "transactionFrequency": 100,
      "financialMetrics": {
        "revenue": 500000,
        "totalAssets": 750000
      }
    }
  }'
```

### Test 3: Test depuis Accounting Service
```bash
curl -X POST http://localhost:3003/credit-score/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "companyId": "company-123",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.999Z"
  }'
```

## 📊 Endpoints Exposés par Accounting Service

### 1. Calcul Principal XGBoost
- **URL:** `POST /credit-score/calculate`
- **Description:** Calcule la cote crédit officielle via XGBoost
- **Usage:** Interface principale pour les applications client

### 2. Distribution pour Services
- **URL:** `POST /credit-score/get`
- **Description:** Endpoint pour les autres microservices
- **Usage:** Communication inter-services

### 3. Historique des Scores 
- **URL:** `GET /credit-score/history?companyId=xxx`
- **Description:** Historique des calculs de cotes crédit
- **Usage:** Analytics et audit

### 4. Documentation Swagger
- **URL:** `GET /api`
- **Description:** Documentation complète des APIs
- **Usage:** Documentation développeur

## 🔒 Sécurité

### Authentication
- JWT Token requis pour tous les endpoints Accounting
- API Key optionnelle pour le service XGBoost

### Data Protection
- Chiffrement des communications (HTTPS en production)
- Validation des données d'entrée
- Audit trail des calculs

## 📈 Monitoring

### Métriques Accounting Service
- Nombre de calculs de scores par jour
- Temps de réponse moyen
- Taux d'erreur des appels XGBoost

### Métriques XGBoost Service
- Précision du modèle
- Temps de prédiction
- Utilisation CPU/Mémoire

## 🎯 Points de Validation

### ✅ Configuration Complétée
- [x] Variables d'environnement ajoutées au docker-compose.yml
- [x] Configuration ML_SERVICE_URL pointant vers xgboost-service:5000
- [x] API Key configuration prête

### 🔧 À Implémenter
- [ ] Serveur XGBoost externe
- [ ] Modèle XGBoost entraîné
- [ ] Tests de communication end-to-end
- [ ] Monitoring et alertes

### 📋 Étapes Suivantes
1. **Développer le serveur XGBoost** (Python/Flask)
2. **Entraîner le modèle** avec les données existantes  
3. **Déployer et tester** la communication
4. **Intégrer dans le workflow** de production

Le système Accounting Service est maintenant **prêt à communiquer** avec un serveur XGBoost externe ! 🚀