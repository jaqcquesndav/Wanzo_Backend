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
            │ Auth Service  │        │ App Mobile  │    │ Admin Service │     │ Autres        │
            │ (port 3000)   │        │ Service     │    │ (port 3001)   │     │ Microservices │
            └───────────────┘        │ (port 3006) │    └───────────────┘     └───────────────┘
                                     └─────────────┘
```

## Configuration Requise pour l'Application Flutter

### 1. Endpoints et Variables d'Environnement

Votre application Flutter doit être configurée avec les endpoints suivants :

```dart
// Fichier env_config.dart pour les variables d'environnement

class EnvConfig {
  // API Gateway comme point d'entrée principal
  static const String apiGatewayUrl = 'http://localhost:8000/api';
  
  // URLs des services directs (à utiliser uniquement si nécessaire)
  static const String authServiceUrl = 'http://localhost:3000/api';
  static const String appMobileServiceUrl = 'http://localhost:3006/api';
  
  // Configuration Auth0
  static const String auth0Domain = 'dev-tezmln0tk0g1gouf.eu.auth0.com';
  static const String auth0ClientId = '43d64kgsVYyCZHEFsax7zlRBVUiraCKL';
  static const String auth0Audience = 'https://api.wanzo.com';
  static const String auth0RedirectUri = 'com.wanzo.app://login-callback';
  static const String auth0LogoutUri = 'com.wanzo.app://logout-callback';
}
```

⚠️ **Important** : Pour le développement sur des appareils physiques, remplacez `localhost` par l'adresse IP de votre machine où sont hébergés les services backend.

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

### 4. Appels API

Pour vos appels API, utilisez toujours l'API Gateway comme point d'entrée principal. Exemple :

```dart
Future<dynamic> get(String endpoint) async {
  try {
    final url = Uri.parse('${EnvConfig.apiGatewayUrl}/${endpoint}');
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ${await getAccessToken()}'
    };
    
    final response = await http.get(url, headers: headers);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      throw Exception('API Error: ${response.statusCode}');
    }
  } catch (e) {
    print('GET Error: $e');
    throw Exception('Failed to perform GET request');
  }
}
```

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

- **Développement** : Utilisation de l'adresse IP locale ou `localhost`
- **Test** : Utilisation des serveurs de test avec leurs DNS ou IPs
- **Production** : Utilisation des domaines de production (e.g., `api.wanzo.com`)

Créez des profils de configuration séparés pour chaque environnement.

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
