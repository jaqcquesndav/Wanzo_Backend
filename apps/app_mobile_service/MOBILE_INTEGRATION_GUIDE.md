# Guide d'Intégration pour l'Application Mobile Wanzo

Ce guide explique comment configurer votre application mobile Flutter pour qu'elle se connecte correctement au backend Wanzo, en particulier au microservice `app_mobile_service`.

## Architecture du Système

Le backend Wanzo est composé de plusieurs microservices, dont :
- `auth-service` : Gestion des utilisateurs et authentification avec Auth0
- `app_mobile_service` : Services spécifiques pour l'application mobile
- `portfolio-sme-service` : Gestion des portefeuilles pour les PME
- `portfolio-institution-service` : Gestion des portefeuilles pour les institutions
- `accounting-service` : Services comptables

**Note importante** : L'application mobile communique principalement avec le microservice `app_mobile_service`.

## Configuration de l'URL du Backend

### URL de Base pour le Développement

Pour le développement local, vous devez utiliser l'adresse IP de votre machine de développement :

```
http://192.168.1.65:3000/api
```

**Note** : Cette adresse IP (192.168.1.65) correspond à l'adresse IP de votre machine de développement actuelle. Si cette adresse change (changement de réseau, redémarrage du routeur), vous devrez mettre à jour la configuration de votre application Flutter.

### URL de Production (À utiliser lorsque le service sera déployé)

```
https://api.wanzo.be/mobile
```

## Implémentation dans Flutter

### Configuration de l'Environnement

Créez un fichier de configuration qui gère les différents environnements :

```dart
// lib/config/environment.dart
class Environment {
  static const String DEV = 'dev';
  static const String STAGING = 'staging';
  static const String PROD = 'prod';
  
  static const String currentEnvironment = DEV;
  
  static String get baseUrl {
    switch (currentEnvironment) {
      case DEV:
        return "http://192.168.1.65:3000/api"; // Adresse IP actuelle
      case STAGING:
        return "https://api-staging.wanzo.be/mobile";
      case PROD:
        return "https://api.wanzo.be/mobile";
      default:
        return "http://192.168.1.65:3000/api";
    }
  }
}
```

### Service API de Base

```dart
// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/environment.dart';

class ApiService {
  final String baseUrl = Environment.baseUrl;
  String? _token;
  
  // Setter pour le token après authentification Auth0
  set token(String value) {
    _token = value;
  }
  
  // Headers avec authentification
  Map<String, String> get _authHeaders {
    return {
      'Content-Type': 'application/json',
      if (_token != null) 'Authorization': 'Bearer $_token',
    };
  }
  
  // Exemple de méthode pour récupérer le profil utilisateur
  Future<Map<String, dynamic>> getUserProfile() async {
    final response = await http.get(
      Uri.parse('$baseUrl/users/profile'),
      headers: _authHeaders,
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load profile: ${response.statusCode}');
    }
  }
  
  // Autres méthodes API...
}
```

## Configuration d'Auth0 dans Flutter

Notre backend utilise Auth0 pour l'authentification. Voici comment configurer Auth0 dans votre application Flutter :

1. **Installer le package Auth0 Flutter** :
   ```
   flutter pub add auth0_flutter
   ```

2. **Configurer Auth0** :
   ```dart
   // lib/services/auth_service.dart
   import 'package:auth0_flutter/auth0_flutter.dart';
   import '../config/environment.dart';
   
   class AuthService {
     // Utilisez les vraies valeurs de vos variables d'environnement Auth0
     final Auth0 auth0 = Auth0(
       'wanzo.eu.auth0.com', // Domaine Auth0 de Wanzo
       'GDX5Wqib0J5A3jzKLLwYr1lQEqT6aBHl' // Client ID pour l'application mobile
     );
     
     Future<Credentials> login() async {
       final credentials = await auth0.webAuthentication().login(
         audience: 'https://api.wanzo.be', // L'audience configurée dans Auth0
         scopes: {'openid', 'profile', 'email', 'offline_access'},
       );
       
       return credentials;
     }
     
     Future<void> logout() async {
       await auth0.webAuthentication().logout();
     }
   }
   ```

## Configuration Android

1. **Ajouter les permissions Internet** dans `android/app/src/main/AndroidManifest.xml` :
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   ```

2. **Autoriser le trafic HTTP non sécurisé** pour le développement :
   ```xml
   <application
       android:usesCleartextTraffic="true"
       ...>
   ```

3. **Configurer les schémas d'URL pour Auth0** dans `android/app/src/main/AndroidManifest.xml` :
   ```xml
   <activity
       ...>
       <intent-filter>
           <action android:name="android.intent.action.VIEW" />
           <category android:name="android.intent.category.DEFAULT" />
           <category android:name="android.intent.category.BROWSABLE" />
           <data
               android:host="wanzo.eu.auth0.com"
               android:pathPrefix="/android/com.wanzo.mobile/callback"
               android:scheme="com.wanzo.mobile" />
       </intent-filter>
   </activity>
   ```

## Vérification de la Connexion

Avant de développer les fonctionnalités complètes :

1. Assurez-vous que le microservice `app_mobile_service` est en cours d'exécution sur votre ordinateur avec :
   ```powershell
   cd C:\Users\DevSpace\Wanzobe\Wanzo_Backend\apps\app_mobile_service
   npm run start:dev
   ```

2. Vérifiez que votre appareil Android et votre ordinateur sont sur le même réseau Wi-Fi

3. Testez la connexion en accédant à `http://192.168.1.65:3000/api/health` depuis le navigateur de votre appareil mobile

## Points d'API Principaux

Le microservice `app_mobile_service` expose les endpoints suivants :

- `POST /api/auth/login` - Authentification (via Auth0)
- `POST /api/auth/register` - Inscription d'un nouvel utilisateur
- `GET /api/users/profile` - Récupération du profil utilisateur
- `GET /api/portfolios` - Liste des portefeuilles disponibles
- `GET /api/company/details` - Détails de l'entreprise de l'utilisateur

Pour plus de détails sur les endpoints, consultez le fichier `API_DOCUMENTATION.md` dans le dossier `app_mobile_service`.

## Remarques Importantes

1. **Changements d'adresse IP** : Si vous changez de réseau ou si votre routeur redémarre, votre adresse IP locale peut changer. Utilisez `ipconfig` dans PowerShell pour obtenir votre nouvelle adresse IP.

2. **Production** : Pour la production, nous utiliserons l'URL stable avec HTTPS mentionnée plus haut.

3. **Compatibilité réseau** : Assurez-vous que votre réseau Wi-Fi n'a pas de restrictions qui empêchent la communication entre appareils.

4. **Événements Kafka** : Le backend utilise Kafka pour la communication entre microservices. Les événements importants comme `UserCreatedEvent` sont publiés lorsqu'un utilisateur s'inscrit via l'application mobile.

## Support

Pour toute question ou problème concernant la connexion au backend, contactez l'équipe backend à l'adresse dev@wanzo.be.

---

*Dernière mise à jour : 14 juin 2025*
