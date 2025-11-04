# Test des URLs - Portfolio Institution Service

## Configuration URL

- **Base URL API Gateway**: http://localhost:8000
- **Préfixe Portfolio**: /portfolio/api/v1  
- **URL Service Portfolio**: http://localhost:3005 (interne)

## Tests des Endpoints Principaux

### 1. Portefeuilles Traditionnels
```bash
# Via API Gateway (URL externe)
curl -X GET "http://localhost:8000/portfolio/api/v1/portfolios/traditional"
curl -X GET "http://localhost:8000/portfolio/api/v1/portfolios/traditional/123"
curl -X POST "http://localhost:8000/portfolio/api/v1/portfolios/traditional"

# Direct au service (test interne)
curl -X GET "http://localhost:3005/portfolios/traditional"
curl -X GET "http://localhost:3005/portfolios/traditional/123"
```

### 2. Produits par Portefeuille  
```bash
# Nouveaux endpoints hiérarchiques
curl -X GET "http://localhost:8000/portfolio/api/v1/portfolios/traditional/123/products"
curl -X GET "http://localhost:8000/portfolio/api/v1/portfolios/traditional/123/products/456"
curl -X POST "http://localhost:8000/portfolio/api/v1/portfolios/traditional/123/products"
```

### 3. Paramètres par Portefeuille
```bash
# Nouveaux endpoints hiérarchiques  
curl -X GET "http://localhost:8000/portfolio/api/v1/portfolios/traditional/123/settings"
curl -X PUT "http://localhost:8000/portfolio/api/v1/portfolios/traditional/123/settings"
curl -X POST "http://localhost:8000/portfolio/api/v1/portfolios/traditional/123/settings/reset"
```

### 4. Demandes de Crédit
```bash
curl -X GET "http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-requests"
curl -X POST "http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-requests"
curl -X PATCH "http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-requests/789/status"
```

### 5. Décaissements (Virements)
```bash
curl -X GET "http://localhost:8000/portfolio/api/v1/portfolios/traditional/disbursements"
curl -X POST "http://localhost:8000/portfolio/api/v1/portfolios/traditional/disbursements"
curl -X POST "http://localhost:8000/portfolio/api/v1/portfolios/traditional/disbursements/123/confirm"
```

### 6. Contrats de Crédit
```bash
curl -X GET "http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-contracts"
curl -X POST "http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-contracts/from-request"
curl -X POST "http://localhost:8000/portfolio/api/v1/portfolios/traditional/credit-contracts/123/generate-document"
```

### 7. Ordres de Paiement Génériques
```bash
curl -X GET "http://localhost:8000/portfolio/api/v1/payments"
curl -X POST "http://localhost:8000/portfolio/api/v1/payments"
curl -X PUT "http://localhost:8000/portfolio/api/v1/payments/123/status"
```

### 8. Utilisateurs
```bash
curl -X GET "http://localhost:8000/portfolio/api/v1/users"
curl -X GET "http://localhost:8000/portfolio/api/v1/users/me"
curl -X GET "http://localhost:8000/portfolio/api/v1/users/roles"
```

### 9. Entreprises  
```bash
curl -X GET "http://localhost:8000/portfolio/api/v1/companies"
curl -X GET "http://localhost:8000/portfolio/api/v1/companies/search?q=test"
curl -X GET "http://localhost:8000/portfolio/api/v1/companies/123/financials"
```

### 10. Dashboard
```bash
curl -X GET "http://localhost:8000/portfolio/api/v1/dashboard"
curl -X GET "http://localhost:8000/portfolio/api/v1/dashboard/traditional"
curl -X GET "http://localhost:8000/portfolio/api/v1/dashboard/metrics/ohada"
```

### 11. Paramètres Système
```bash
curl -X GET "http://localhost:8000/portfolio/api/v1/settings"
curl -X GET "http://localhost:8000/portfolio/api/v1/settings/system"
curl -X GET "http://localhost:8000/portfolio/api/v1/settings/webhooks"
```

### 12. Prospection
```bash
curl -X GET "http://localhost:8000/portfolio/api/v1/prospection"
curl -X GET "http://localhost:8000/portfolio/api/v1/prospection/opportunities"
```

### 13. Institutions
```bash
curl -X GET "http://localhost:8000/portfolio/api/v1/institutions"
curl -X GET "http://localhost:8000/portfolio/api/v1/institutions/123"
```

## Validation du Flow URL

### Étape 1: Frontend → API Gateway
```
Frontend Request: http://localhost:8000/portfolio/api/v1/portfolios/traditional
```

### Étape 2: API Gateway Processing  
```
- Path reçu: /portfolio/api/v1/portfolios/traditional
- Préfixe détecté: portfolio/api/v1
- Service résolu: portfolio-institution  
- Service URL: http://localhost:3005
```

### Étape 3: API Gateway → Portfolio Service
```
- Préfixe retiré: portfolio/api/v1
- Path restant: /portfolios/traditional
- URL finale: http://localhost:3005/portfolios/traditional
```

### Étape 4: Portfolio Service Processing
```
- Controller: PortfolioController  
- Route: @Controller('portfolios/traditional')
- Method: @Get()
- Handler: findAll()
```

## Tests de Validation

### Test 1: Configuration Route Resolver
```javascript
// Vérifier que portfolio/api/v1 est correctement configuré
const route = routeResolver.resolveRoute('/portfolio/api/v1/portfolios/traditional');
console.log(route.service); // Should be 'portfolio-institution'
console.log(route.prefix);  // Should be 'portfolio/api/v1'
```

### Test 2: Strip Prefix  
```javascript
// Vérifier que le préfixe est bien retiré
const path = routeResolver.stripPrefix('/portfolio/api/v1/portfolios/traditional', 'portfolio/api/v1');
console.log(path); // Should be '/portfolios/traditional'
```

### Test 3: Controller Resolution
```bash
# Test direct au service pour vérifier les controllers
curl -X GET "http://localhost:3005/portfolios/traditional" -H "Authorization: Bearer TOKEN"
curl -X GET "http://localhost:3005/payments" -H "Authorization: Bearer TOKEN"  
curl -X GET "http://localhost:3005/users" -H "Authorization: Bearer TOKEN"
```

## Codes d'Erreur Attendus

- **404**: Route non trouvée dans API Gateway ou service
- **401**: Token d'authentification manquant ou invalide  
- **403**: Permissions insuffisantes
- **500**: Erreur interne du service

## Notes de Debug

1. **Logs API Gateway**: Vérifier les logs du RouteResolverService
2. **Logs Portfolio Service**: Vérifier que les requêtes arrivent bien
3. **Network**: Vérifier que les services sont accessibles sur leurs ports
4. **Headers**: Vérifier que l'Authorization header est transmis