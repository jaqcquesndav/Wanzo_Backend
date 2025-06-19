# Guide d'intégration de l'Application Mobile avec le Backend Wanzo

Ce document explique comment configurer l'application mobile Flutter pour qu'elle communique correctement avec l'architecture microservices de Wanzo, en utilisant l'API Gateway, Auth0 pour l'authentification, et l'accès aux services spécifiques comme app_mobile_service.

## Architecture de Communication

L'application mobile doit suivre le flux suivant pour communiquer avec le backend :

1. **Authentication** : Utilisation d'Auth0 pour l'authentification des utilisateurs
2. **API Gateway** : Point d'entrée principal pour toutes les requêtes
3. **Microservices** : Accès aux fonctionnalités spécifiques via les différents microservices

```
┌─────────────┐       ┌────────────┐       ┌───────────────┐
│ App Mobile  │──────▶│  Auth0     │──────▶│ JWT Token     │
└─────────────┘       └────────────┘       └───────────────┘
       │                                            │
       │                                            ▼
       │                                    ┌───────────────┐
       └───────────────────────────────────▶│  API Gateway  │
                                            └───────────────┘
                                                    │
                    ┌────────────────────────┬─────┴─────┬─────────────────────┐
                    ▼                        ▼           ▼                     ▼
            ┌───────────────┐        ┌─────────────┐    ┌───────────────┐     ┌───────────────┐
            │ Admin Service │        │ App Mobile  │    │ Accounting    │     │ Autres        │
            │ (port 3001)   │        │ Service     │    │ Service       │     │ Microservices │
            └───────────────┘        │ (port 3006) │    └───────────────┘     └───────────────┘
                                     └─────────────┘
```

## Structure des URL et Endpoints

### Format des URL

Toutes les requêtes de l'application mobile doivent suivre ce format :

```
[BASE_URL]/mobile/[ENDPOINT]
```

Où :
- **BASE_URL** : L'URL de base de l'API Gateway
  - Production : `https://api.wanzo.com`
  - Développement : `http://localhost:8000` (API Gateway tourne sur le port 8000)
- **mobile** : Le préfixe qui identifie le service app_mobile dans l'API Gateway
- **ENDPOINT** : Le chemin spécifique vers la ressource

Exemples d'URL complètes :
- `http://localhost:8000/mobile/auth/login` - Pour se connecter (développement)
- `http://localhost:8000/mobile/products` - Pour accéder aux produits (développement)
- `https://api.wanzo.com/mobile/sales` - Pour accéder aux ventes (production)

### Principaux Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/mobile/auth/register` | POST | Inscription d'un nouvel utilisateur |
| `/mobile/auth/login` | POST | Connexion utilisateur |
| `/mobile/auth/refresh-token` | POST | Rafraîchissement du token d'accès |
| `/mobile/auth/me` | GET | Récupération du profil utilisateur |
| `/mobile/products` | GET | Liste des produits |
| `/mobile/sales` | GET/POST | Gestion des ventes |
| `/mobile/customers` | GET/POST | Gestion des clients |

## Configuration Requise pour l'Application Flutter

### 1. Endpoints et Variables d'Environnement

Votre application Flutter doit être configurée avec les endpoints suivants :

```dart
// Fichier env_config.dart pour les variables d'environnement

class EnvConfig {
  // API Gateway comme point d'entrée principal
  static const String apiGatewayUrl = 'http://localhost:8000'; // Port 8000 pour l'API Gateway
  
  // Préfixe pour le service mobile
  static const String mobilePrefix = 'mobile';
  
  // Configuration Auth0
  static const String auth0Domain = 'dev-tezmln0tk0g1gouf.eu.auth0.com';
  static const String auth0ClientId = '43d64kgsVYyCZHEFsax7zlRBVUiraCKL';
  static const String auth0Audience = 'https://api.wanzo.com';
  static const String auth0RedirectUri = 'com.wanzo.app://login-callback';
  static const String auth0LogoutUri = 'com.wanzo.app://logout-callback';
}
```

⚠️ **Important** : Pour le développement sur des appareils physiques, remplacez l'URL par l'adresse IP de votre machine où est hébergé l'API Gateway.

### 2. Configuration Auth0

Assurez-vous que votre application est correctement configurée pour utiliser Auth0 :

1. **Dépendances Flutter requises** :
   - `flutter_appauth`: Pour gérer le flux d'authentification OAuth2
   - `flutter_secure_storage`: Pour stocker en toute sécurité les tokens
   - `http`: Pour les appels API
   - `jwt_decoder`: Pour décoder et analyser les JWT tokens

2. **Redirection URIs** :
   - Dans le tableau de bord Auth0, configurez les URI de redirection suivants :
     - Login Callback: `com.wanzo.app://login-callback`
     - Logout Callback: `com.wanzo.app://logout-callback`

3. **Types de Grant** :
   - Activez les types "Authorization Code" et "Refresh Token"
   - Vérifiez que l'audience `https://api.wanzo.com` est configurée correctement

4. **Configuration Android** :
   Ajoutez les configurations suivantes dans `android/app/src/main/AndroidManifest.xml` :

   ```xml
   <intent-filter>
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data
         android:scheme="com.wanzo.app"
         android:host="login-callback" />
   </intent-filter>
   
   <intent-filter>
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data
         android:scheme="com.wanzo.app"
         android:host="logout-callback" />
   </intent-filter>
   ```

5. **Configuration iOS** :
   Ajoutez les configurations suivantes dans `ios/Runner/Info.plist` :

   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleTypeRole</key>
       <string>Editor</string>
       <key>CFBundleURLName</key>
       <string>com.wanzo.app</string>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>com.wanzo.app</string>
       </array>
     </dict>
   </array>
   ```

### 3. Gestion des Tokens JWT

L'application doit gérer correctement les tokens JWT :

1. **Stockage sécurisé** : Utilisez `flutter_secure_storage` pour stocker les tokens
2. **Rafraîchissement automatique** : Implémentez la logique pour rafraîchir les tokens expirés
3. **Envoi dans les en-têtes** : Incluez le token dans l'en-tête `Authorization: Bearer <token>` pour toutes les requêtes API

Voici un exemple de gestionnaire de tokens :

```dart
Future<String?> getAccessToken() async {
  // Vérifier si le token a expiré
  final bool isValid = await isAuthenticated();
  if (!isValid) {
    // Essayer de rafraîchir le token s'il a expiré
    final refreshed = await refreshToken();
    if (!refreshed) return null;
  }
  
  return await secureStorage.read(key: accessTokenKey);
}
```

### 4. Structure des En-têtes de Requête

Pour toutes les requêtes API, incluez les en-têtes suivants :

```dart
Future<Map<String, String>> getHeaders() async {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer ${await getAccessToken()}',
    'User-Agent': 'Wanzo-Mobile-App/${appVersion} (${platform}; ${deviceInfo})'
  };
}
```

### 5. Exemple d'Appel API

Utilisez toujours l'API Gateway comme point d'entrée principal :

```dart
Future<dynamic> get(String endpoint) async {
  try {
    // Construire l'URL complète avec le préfixe du service mobile
    final url = Uri.parse('${EnvConfig.apiGatewayUrl}/${EnvConfig.mobilePrefix}/${endpoint}');
    final headers = await getHeaders();
    
    final response = await http.get(url, headers: headers);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else if (response.statusCode == 401) {
      // Token invalide ou expiré
      // Essayer de rafraîchir le token ou rediriger vers la page de connexion
      throw Exception('Unauthorized: Token invalid or expired');
    } else {
      throw Exception('API Error: ${response.statusCode}');
    }
  } catch (e) {
    print('GET Error: $e');
    throw Exception('Failed to perform GET request');
  }
}
```

## Processus d'Authentification et Flux de Token

### 1. Flux d'Authentification

1. **Inscription** : 
   - URL : `POST /mobile/auth/register`
   - Corps de la requête : Contient les données d'inscription (email, mot de passe, informations utilisateur)
   - Réponse : Renvoie des tokens d'accès et de rafraîchissement

2. **Connexion** :
   - URL : `POST /mobile/auth/login`
   - Corps de la requête : Contient les identifiants (email, mot de passe)
   - Réponse : Renvoie des tokens d'accès et de rafraîchissement

3. **Rafraîchissement du token** :
   - URL : `POST /mobile/auth/refresh-token`
   - Corps de la requête : Contient le token de rafraîchissement
   - Réponse : Renvoie un nouveau token d'accès

4. **Obtention du profil** :
   - URL : `GET /mobile/auth/me`
   - En-tête : Contient le token JWT dans l'en-tête Authorization
   - Réponse : Renvoie les informations du profil utilisateur

### 2. Traitement du Token par l'API Gateway et les Microservices

1. L'API Gateway (port 8000) reçoit la requête (ex: `/mobile/products`).
2. Il identifie le service cible (`app_mobile_service`) en fonction du préfixe (`mobile`).
3. Il retire le préfixe de l'URL (transforme `/mobile/products` en `/products`).
4. Il transmet la requête au service app_mobile_service (port 3006).
5. Le service app_mobile_service valide le token JWT :
   - Vérification qu'il n'est pas dans la liste noire (TokenBlacklist)
   - Validation avec Auth0 via la stratégie JWT configurée (signature, émetteur, audience, expiration)
6. Si le token est valide, la requête est traitée et la réponse est renvoyée à l'API Gateway.
7. L'API Gateway renvoie cette réponse au client (application mobile).

### 3. Gestion des Erreurs d'Authentification

| Code | Description | Action à prendre |
|------|-------------|------------------|
| 401 | Token invalide ou expiré | Rafraîchir le token ou rediriger vers la page de connexion |
| 403 | Permissions insuffisantes | Vérifier les rôles et les permissions de l'utilisateur |
| 422 | Données de requête invalides | Vérifier le format des données envoyées |
| 500 | Erreur serveur | Contacter l'équipe support ou réessayer plus tard |

## Fonctionnement du Routage dans l'API Gateway

### Mécanisme de Routage

L'API Gateway (port 8000) sert de point d'entrée unique pour toutes les requêtes et les route vers les services appropriés en fonction du préfixe d'URL.

1. **Identification du service**:
   ```
   https://api.wanzo.com/mobile/products
                     ^^^^^^^
                    Préfixe qui identifie le service mobile
   ```

2. **Transformation de l'URL**:
   - URL reçue par l'API Gateway: `/mobile/products`
   - URL transmise au service: `/products`

3. **Circuit Breaker**:
   L'API Gateway implémente un pattern Circuit Breaker qui empêche les requêtes d'être envoyées à un service indisponible.

4. **Load Balancing**:
   Si plusieurs instances d'un service sont disponibles, l'API Gateway répartit les requêtes entre elles.

### Exemple concret de flux de requête

Prenons l'exemple d'une requête pour récupérer la liste des produits:

1. Le client envoie: `GET http://localhost:8000/mobile/products?category=food`
2. L'API Gateway:
   - Identifie le préfixe `mobile`
   - Détermine que la requête doit être envoyée au service `app_mobile_service`
   - Transforme l'URL en retirant le préfixe: `/products?category=food`
   - Transfère la requête à: `http://localhost:3006/products?category=food`
3. Le service app_mobile_service:
   - Reçoit la requête comme si elle était adressée directement à lui
   - Vérifie l'authentification via le token JWT
   - Traite la requête et renvoie la réponse
4. L'API Gateway renvoie la réponse au client

### Gestion des erreurs

Si un service est indisponible ou répond avec une erreur:
- **Circuit ouvert**: L'API Gateway peut bloquer temporairement les requêtes vers un service défaillant
- **Timeout**: Une requête peut expirer si le service prend trop de temps à répondre
- **Retry**: Dans certains cas, l'API Gateway peut réessayer une requête ayant échoué

Cette architecture permet une grande flexibilité et scalabilité tout en simplifiant l'accès pour les clients qui n'ont besoin de connaître qu'un seul point d'entrée.

## Points à vérifier pour assurer une connexion correcte

1. **Vérifiez les tokens** :
   - Assurez-vous que les tokens JWT sont correctement reçus d'Auth0
   - Vérifiez que les tokens contiennent bien l'audience `https://api.wanzo.com`
   - Confirmez que le token est envoyé avec chaque requête API

2. **Dépannage de l'API Gateway** :
   - Si vous recevez des erreurs 401, vérifiez que le token est valide et non expiré
   - Si vous recevez des erreurs 403, vérifiez les permissions de l'utilisateur
   - Si vous rencontrez des problèmes de CORS, assurez-vous que les en-têtes appropriés sont configurés côté serveur

3. **Tests de bout en bout** :
   - Testez le flux complet : authentification → obtention du token → appel API
   - Vérifiez le rafraîchissement du token : laissez le token expirer et confirmez qu'il est automatiquement rafraîchi
   - Testez la déconnexion : assurez-vous que les tokens sont correctement supprimés

## Environnements de déploiement

Adaptez vos configurations selon l'environnement :

| Environnement | API Gateway URL | Configuration |
|---------------|-----------------|---------------|
| Développement | `http://localhost:8000` | Utilisez des variables d'environnement locales |
| Test | `https://api-test.wanzo.com` | Configuration spécifique aux tests |
| Production | `https://api.wanzo.com` | Configuration de production sécurisée |

Pour le développement sur un appareil physique (téléphone/tablette), remplacez `localhost` par l'adresse IP de votre machine sur le réseau local (ex: `http://192.168.1.100:8000`).

Créez des profils de configuration séparés pour chaque environnement.

## Bonnes Pratiques de Sécurité

1. **Ne stockez jamais les tokens dans le stockage local non sécurisé** - Utilisez toujours `flutter_secure_storage`.
2. **Implémentez l'expiration des sessions inactives** - Déconnectez l'utilisateur après une période d'inactivité.
3. **Validez toutes les entrées utilisateur côté client** avant de les envoyer au serveur.
4. **Implémentez le verrouillage par PIN ou biométrique** pour l'accès à l'application.
5. **Ne stockez pas d'informations sensibles en cache** sans chiffrement.

## Assistance et dépannage

Si vous rencontrez des problèmes de connexion :

1. **Logs et débogage** :
   - Activez les logs détaillés dans l'application mobile
   - Vérifiez les logs du serveur pour les erreurs d'authentification ou d'autorisation

2. **Outils de débogage** :
   - Utilisez Postman ou Insomnia pour tester les API indépendamment de l'application
   - Vérifiez les tokens JWT sur [jwt.io](https://jwt.io) pour confirmer leur validité

3. **Support** :
   - Pour les problèmes d'authentification : contactez l'équipe Auth0 ou l'administrateur Auth0
   - Pour les problèmes d'API : contactez l'équipe backend

---

En suivant ces instructions, votre application mobile Flutter devrait pouvoir se connecter correctement au backend Wanzo, en utilisant Auth0 pour l'authentification et l'API Gateway pour accéder aux différents microservices.
