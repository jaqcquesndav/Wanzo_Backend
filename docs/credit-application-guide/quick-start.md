# Guide de Démarrage Rapide - API Portfolio

## Configuration Initiale

### 1. Obtenir un Token Auth0

```bash
# Exemple de requête pour obtenir un token
curl -X POST https://your-auth0-domain.auth0.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET", 
    "audience": "https://api.wanzo.com",
    "grant_type": "client_credentials"
  }'
```

### 2. Configuration de Base

```javascript
const API_BASE = 'https://api.wanzo.com'; // Production
// const API_BASE = 'http://localhost:8000'; // Développement

const headers = {
  'Authorization': `Bearer ${access_token}`,
  'Content-Type': 'application/json'
};
```

## Exemples d'Utilisation

### 1. Créer une Demande de Crédit

```javascript
const createFundingRequest = async () => {
  const requestData = {
    portfolio_id: "550e8400-e29b-41d4-a716-446655440000",
    client_id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    company_name: "Entreprise ABC",
    product_type: "credit_commercial", 
    amount: 5000000.00,
    currency: "XOF",
    purpose: "Expansion des activités commerciales",
    duration: 24,
    duration_unit: "months",
    financial_data: {
      annual_revenue: 15000000.00,
      net_profit: 2500000.00,
      existing_debts: 1000000.00,
      cash_flow: 3000000.00,
      assets: 20000000.00,
      liabilities: 5000000.00
    }
  };

  const response = await fetch(`${API_BASE}/portfolio_inst/portfolios/traditional/funding-requests`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestData)
  });

  const result = await response.json();
  console.log('Demande créée:', result.data);
  return result.data;
};
```

### 2. Suivre le Statut d'une Demande

```javascript
const checkRequestStatus = async (requestId) => {
  const response = await fetch(`${API_BASE}/portfolio_inst/portfolios/traditional/funding-requests/${requestId}`, {
    method: 'GET',
    headers: headers
  });

  const result = await response.json();
  console.log('Statut actuel:', result.data.status);
  console.log('Analyse IA:', result.data.ai_analysis);
  return result.data;
};
```

### 3. Lister les Demandes avec Filtres

```javascript
const listRequests = async (status = null, page = 1) => {
  let url = `${API_BASE}/portfolio_inst/portfolios/traditional/funding-requests?page=${page}&limit=20`;
  if (status) {
    url += `&status=${status}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: headers
  });

  const result = await response.json();
  console.log('Demandes trouvées:', result.data.length);
  return result.data;
};
```

## Gestion des Erreurs

```javascript
const handleApiError = (response, result) => {
  if (!response.ok) {
    switch (response.status) {
      case 400:
        console.error('Données invalides:', result.errors);
        break;
      case 401:
        console.error('Token expiré ou invalide');
        // Renouveler le token
        break;
      case 403:
        console.error('Accès refusé');
        break;
      case 422:
        console.error('Erreur de validation:', result.message);
        break;
      default:
        console.error('Erreur serveur:', result.message);
    }
    throw new Error(result.message);
  }
};
```

## Intégration avec les Événements

### Webhook pour les Notifications (Optionnel)

```javascript
// Configuration d'un webhook pour recevoir les notifications de changement de statut
const webhookHandler = (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'funding_request.status_changed':
      console.log(`Demande ${event.data.id} : ${event.data.old_status} → ${event.data.new_status}`);
      // Notifier l'utilisateur
      break;
      
    case 'funding_request.ai_analysis_completed':
      console.log(`Analyse IA terminée pour ${event.data.id} : score ${event.data.risk_score}`);
      // Afficher les résultats de l'analyse
      break;
  }
  
  res.status(200).send('OK');
};
```

## Bonnes Pratiques

### 1. Gestion des Tokens
- Renouveler les tokens avant expiration
- Stocker les tokens de manière sécurisée
- Utiliser des refresh tokens quand disponibles

### 2. Pagination
- Toujours utiliser la pagination pour les listes
- Limiter à 50 éléments maximum par page
- Utiliser les cursors pour de meilleures performances

### 3. Retry Logic
```javascript
const apiCallWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      if (response.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        continue;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
};
```
