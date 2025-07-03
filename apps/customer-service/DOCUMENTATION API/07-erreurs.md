# Erreurs et Dépannage

## Codes d'erreur HTTP

L'API KIOTA TECH utilise les codes d'erreur HTTP standard pour indiquer le statut des requêtes :

| Code | Description | Utilisation |
|------|-------------|------------|
| 200 | OK | La requête a réussi |
| 201 | Created | Une ressource a été créée avec succès |
| 400 | Bad Request | La requête contient des données invalides ou manquantes |
| 401 | Unauthorized | Authentification nécessaire ou échouée |
| 403 | Forbidden | L'utilisateur n'a pas les permissions nécessaires |
| 404 | Not Found | La ressource demandée n'existe pas |
| 409 | Conflict | La requête ne peut être traitée en raison d'un conflit |
| 422 | Unprocessable Entity | La requête est syntaxiquement correcte mais ne peut être traitée |
| 429 | Too Many Requests | Limite de rate dépassée |
| 500 | Internal Server Error | Erreur interne du serveur |
| 503 | Service Unavailable | Service temporairement indisponible |

## Format des erreurs

Toutes les erreurs de l'API suivent le même format JSON :

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description de l'erreur",
    "details": {
      // Détails spécifiques de l'erreur (facultatif)
    }
  }
}
```

## Codes d'erreur spécifiques

L'API utilise des codes d'erreur spécifiques pour indiquer plus précisément la nature du problème :

### Authentification et autorisation

| Code | Description | Solution |
|------|-------------|----------|
| `AUTH_INVALID_TOKEN` | Token d'authentification invalide | Vérifiez que le token est valide et non expiré |
| `AUTH_EXPIRED_TOKEN` | Token d'authentification expiré | Rafraîchissez le token ou reconnectez-vous |
| `AUTH_MISSING_TOKEN` | Token d'authentification manquant | Incluez le token dans l'en-tête Authorization |
| `AUTH_INSUFFICIENT_PERMISSIONS` | Permissions insuffisantes | L'utilisateur n'a pas les droits nécessaires pour cette action |

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
