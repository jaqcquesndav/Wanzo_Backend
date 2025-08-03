# Erreurs et Dépannage

## Format des erreurs standardisé

Basé sur l'interface `ApiServiceError` (`src/services/api.ts`) et `ApiError` (`src/types/api.ts`) :

### Structure d'erreur API

```typescript
interface ApiServiceError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}
```

### Gestion des erreurs dans le code

**Service** : `ApiService.handleResponse()`

```typescript
private async handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiServiceError;
    try {
      const res = await response.json();
      errorData = {
        status: response.status,
        message: res.message || 'An unknown error occurred.',
        errors: res.errors,
      };
    } catch (e) {
      errorData = { 
        status: response.status, 
        message: response.statusText 
      };
    }
    throw errorData;
  }
  // ...
}
```

## Codes d'erreur HTTP

| Code | Description | Gestion dans l'app |
|------|-------------|-------------------|
| 200 | OK | Succès |
| 201 | Created | Ressource créée |
| 204 | No Content | Retourne objet vide `{}` |
| 400 | Bad Request | Données invalides/manquantes |
| 401 | Unauthorized | Redirection Auth0 |
| 403 | Forbidden | Permissions insuffisantes |
| 404 | Not Found | Ressource inexistante |
| 422 | Unprocessable Entity | Erreurs de validation |
| 429 | Too Many Requests | Rate limiting |
| 500 | Internal Server Error | Erreur serveur |

## Stratégies de récupération

### 1. Gestion des timeouts

**UserService** : Timeout 10s pour éviter de bloquer l'UI

```typescript
const API_TIMEOUT = 10000;

// Timeout avec Promise.race
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error('Timeout')), API_TIMEOUT);
});

const backendUser = await Promise.race([
  api.get<User>('/users/me'), 
  timeoutPromise
]);
```

### 2. Fallback Auth0

En cas d'échec API, utilisation des données Auth0 :

```typescript
try {
  const backendUser = await api.get<User>('/users/me');
  return { ...baseUser, ...backendUser };
} catch (error) {
  console.warn('Backend unavailable, using Auth0 data only');
  return baseUser; // Données Auth0 du localStorage
}
```

### 3. Gestion des uploads

**Upload de fichiers** : Gestion spéciale Content-Type

```typescript
// Automatic Content-Type pour multipart/form-data
private getAuthHeaders(isFormData = false): HeadersInit {
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  // ...
}
```

## Messages d'erreur courants

### Authentification

- **"Pas de token disponible"** : Token manquant → Connexion Auth0 requise
- **"Backend user profile fetch failed"** : API indisponible → Utilisation données Auth0
- **"Timeout"** : Délai dépassé → Fallback sur données locales

### API

- **"An unknown error occurred"** : Erreur non spécifiée du serveur
- **"Erreur de l'API IA"** : Service IA indisponible
- **"Erreur de transcription audio"** : Échec transcription audio

### Upload de fichiers

- **Échec upload logo** : Vérifier format et taille du fichier
- **Échec upload CV** : Vérifier que le fichier est un PDF

## Debugging

### Logs de développement

```typescript
console.log('Profil enrichi depuis le backend:', backendUser);
console.warn('Backend user profile fetch failed. Using Auth0 data only.', error);
console.warn('URL de profil invalide dans les données backend', e);
```

### Vérification des tokens

```typescript
// Vérification centralisée des tokens
const token = getToken();
if (!token) {
  console.log('Pas de token disponible, utilisation des données Auth0 uniquement');
  return baseUser;
}
```

### Détection des erreurs de stockage

```typescript
// Wrapper sécurisé avec gestion d'erreurs
setItem(key: keyof typeof STORAGE_KEYS, value: string) {
  try {
    localStorage.setItem(STORAGE_KEYS[key], value);
  } catch (error) {
    console.error(`Error storing ${key}:`, error);
  }
}
```

### Validation des données

| Code | Description | Solution |
|------|-------------|----------|
| `VALIDATION_REQUIRED_FIELD` | Champ obligatoire manquant | Assurez-vous que tous les champs obligatoires sont fournis |
| `VALIDATION_INVALID_FORMAT` | Format de données invalide | Vérifiez le format des données (email, téléphone, etc.) |
| `VALIDATION_UNIQUE_CONSTRAINT` | Contrainte d'unicité violée | Une valeur unique est déjà utilisée |
| `VALIDATION_BUSINESS_RULE` | Règle métier violée | Une règle métier spécifique n'est pas respectée |

### Ressources

| Code | Description | Solution |
|------|-------------|----------|
| `RESOURCE_NOT_FOUND` | Ressource introuvable | Vérifiez l'identifiant de la ressource |
| `RESOURCE_ALREADY_EXISTS` | Ressource déjà existante | Une ressource avec cet identifiant existe déjà |
| `RESOURCE_CONFLICT` | Conflit de ressource | La ressource est dans un état incompatible avec l'opération |
| `RESOURCE_LOCKED` | Ressource verrouillée | La ressource est temporairement verrouillée pour modification |

### Paiements

| Code | Description | Solution |
|------|-------------|----------|
| `PAYMENT_DECLINED` | Paiement refusé | La transaction a été refusée par l'émetteur de la carte |
| `PAYMENT_INSUFFICIENT_FUNDS` | Fonds insuffisants | Le compte du client ne dispose pas des fonds nécessaires |
| `PAYMENT_INVALID_DETAILS` | Détails de paiement invalides | Vérifiez les informations de la carte ou du compte |
| `PAYMENT_EXPIRED` | Paiement expiré | Le délai de paiement a expiré |

### Serveur

| Code | Description | Solution |
|------|-------------|----------|
| `SERVER_INTERNAL_ERROR` | Erreur interne du serveur | Une erreur inattendue s'est produite sur le serveur |
| `SERVER_MAINTENANCE` | Maintenance du serveur | Le serveur est en maintenance, réessayez plus tard |
| `SERVER_RATE_LIMIT` | Limite de taux dépassée | Trop de requêtes ont été effectuées, attendez avant de réessayer |
| `SERVER_QUOTA_EXCEEDED` | Quota dépassé | Vous avez atteint votre quota de requêtes pour cette période |

## Exemples d'erreurs courantes

### Authentification échouée

```json
{
  "success": false,
  "error": {
    "code": "AUTH_EXPIRED_TOKEN",
    "message": "Le token d'authentification a expiré",
    "details": {
      "expiredAt": "2023-10-15T14:30:00Z"
    }
  }
}
```

### Validation échouée

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_INVALID_FORMAT",
    "message": "Le format de certains champs est invalide",
    "details": {
      "fields": {
        "email": "L'email fourni n'est pas valide",
        "phone": "Le numéro de téléphone doit commencer par +243"
      }
    }
  }
}
```

### Ressource non trouvée

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "L'entreprise demandée n'existe pas",
    "details": {
      "resourceType": "company",
      "resourceId": "comp-999"
    }
  }
}
```

### Paiement refusé

```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_DECLINED",
    "message": "Le paiement a été refusé par l'émetteur de la carte",
    "details": {
      "declineCode": "insufficient_funds",
      "paymentMethod": "card",
      "lastFour": "4242"
    }
  }
}
```

## Bonnes pratiques pour gérer les erreurs

### Côté client

1. **Vérifiez toujours le champ `success`** pour déterminer si la requête a réussi.
2. **Affichez des messages d'erreur conviviaux** en fonction du code d'erreur reçu.
3. **Implémentez une logique de nouvelle tentative** pour les erreurs temporaires (429, 503).
4. **Rafraîchissez automatiquement le token** lorsque vous recevez une erreur `AUTH_EXPIRED_TOKEN`.
5. **Validez les données côté client** avant de les envoyer au serveur.

### Côté serveur

1. **Utilisez des codes d'erreur cohérents** dans toute l'API.
2. **Fournissez des messages d'erreur clairs** qui indiquent comment résoudre le problème.
3. **Incluez des détails spécifiques** pour aider au débogage.
4. **Journalisez les erreurs** pour analyse ultérieure.
5. **Implémentez des limites de taux** pour prévenir les abus.

## Dépannage

### Problèmes d'authentification

Si vous rencontrez des problèmes d'authentification :

1. Vérifiez que le token est inclus dans l'en-tête `Authorization: Bearer <token>`.
2. Vérifiez que le token n'est pas expiré.
3. Essayez de vous déconnecter et de vous reconnecter.
4. Vérifiez que l'utilisateur a les permissions nécessaires.

### Problèmes de validation

Si vous rencontrez des problèmes de validation :

1. Vérifiez que tous les champs obligatoires sont renseignés.
2. Vérifiez le format des données (email, téléphone, etc.).
3. Assurez-vous que les valeurs uniques ne sont pas déjà utilisées.
4. Consultez les détails de l'erreur pour identifier les champs problématiques.

### Problèmes de paiement

Si vous rencontrez des problèmes de paiement :

1. Vérifiez que les informations de paiement sont correctes.
2. Assurez-vous que le compte dispose des fonds nécessaires.
3. Essayez une autre méthode de paiement.
4. Contactez le support client si le problème persiste.

### Problèmes de performance

Si vous rencontrez des problèmes de performance :

1. Réduisez le nombre de requêtes en utilisant la pagination et le filtrage.
2. Évitez de faire trop de requêtes en parallèle.
3. Implémentez une logique de mise en cache.
4. Utilisez des requêtes groupées lorsque c'est possible.

## Support

Si vous ne parvenez pas à résoudre un problème, vous pouvez contacter le support de KIOTA TECH :

- Email : support@kiota.tech
- Téléphone : +243 810 987 654
- Heures d'ouverture : Lun-Ven, 9h-17h (UTC+1)
