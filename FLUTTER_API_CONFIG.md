# 📱 Configuration Frontend Flutter - API Wanzo Commerce

## 🌐 Configuration de Base

### Adresse IP du Serveur de Développement
```dart
// config/api_config.dart
class ApiConfig {
  // 🔥 IMPORTANT: Remplacez par l'IP de votre serveur de développement
  static const String baseUrl = 'http://192.168.1.65:8000';
  static const String apiPrefix = '/commerce';
  static const String fullApiUrl = '$baseUrl$apiPrefix';
  
  // Timeouts
  static const int connectTimeout = 10000; // 10 secondes
  static const int receiveTimeout = 15000; // 15 secondes
}
```

## 🔧 Configuration HTTP Client (Dio recommandé)

### Installation des dépendances
```yaml
# pubspec.yaml
dependencies:
  dio: ^5.3.2
  pretty_dio_logger: ^1.3.1
```

### Configuration Dio
```dart
// services/api_service.dart
import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import '../config/api_config.dart';

class ApiService {
  static Dio? _dio;
  
  static Dio get dio {
    if (_dio == null) {
      _dio = Dio(BaseOptions(
        baseUrl: ApiConfig.fullApiUrl,
        connectTimeout: Duration(milliseconds: ApiConfig.connectTimeout),
        receiveTimeout: Duration(milliseconds: ApiConfig.receiveTimeout),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ));
      
      // Logger pour debug (retirez en production)
      _dio!.interceptors.add(PrettyDioLogger(
        requestHeader: true,
        requestBody: true,
        responseBody: true,
        responseHeader: false,
        compact: false,
      ));
      
      // Intercepteur pour token JWT
      _dio!.interceptors.add(AuthInterceptor());
    }
    return _dio!;
  }
}
```

## 🔐 Gestion de l'Authentification

### Intercepteur JWT
```dart
// services/auth_interceptor.dart
import 'package:dio/dio.dart';

class AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Récupérer le token depuis le storage local
    final token = AuthStorage.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
  
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      // Token expiré, rediriger vers login
      AuthService.logout();
    }
    handler.next(err);
  }
}
```

## 📋 Endpoints Principaux

### Service Commerce API
```dart
// services/commerce_api_service.dart
class CommerceApiService {
  static final Dio _dio = ApiService.dio;
  
  // 🛍️ PRODUITS
  static Future<List<Product>> getProducts({
    int page = 1,
    int limit = 20,
    String? search,
    String? category,
    bool? inStock,
  }) async {
    final response = await _dio.get('/products', queryParameters: {
      'page': page,
      'limit': limit,
      if (search != null) 'search': search,
      if (category != null) 'category': category,
      if (inStock != null) 'inStock': inStock,
    });
    
    return (response.data['data'] as List)
        .map((json) => Product.fromJson(json))
        .toList();
  }
  
  static Future<Product> createProduct(CreateProductDto product) async {
    final response = await _dio.post('/products', data: product.toJson());
    return Product.fromJson(response.data['data']);
  }
  
  // 💰 VENTES
  static Future<List<Sale>> getSales({
    int page = 1,
    int limit = 20,
    String? dateFrom,
    String? dateTo,
    String? status,
    String? customerId,
  }) async {
    final response = await _dio.get('/sales', queryParameters: {
      'page': page,
      'limit': limit,
      if (dateFrom != null) 'dateFrom': dateFrom,
      if (dateTo != null) 'dateTo': dateTo,
      if (status != null) 'status': status,
      if (customerId != null) 'customerId': customerId,
    });
    
    return (response.data['data'] as List)
        .map((json) => Sale.fromJson(json))
        .toList();
  }
  
  static Future<Sale> createSale(CreateSaleDto sale) async {
    final response = await _dio.post('/sales', data: sale.toJson());
    return Sale.fromJson(response.data['data']);
  }
  
  static Future<Sale> completeSale(String saleId) async {
    final response = await _dio.put('/sales/$saleId/complete');
    return Sale.fromJson(response.data['data']);
  }
  
  // 👥 CLIENTS
  static Future<List<Customer>> getCustomers({
    int page = 1,
    int limit = 20,
    String? search,
  }) async {
    final response = await _dio.get('/customers', queryParameters: {
      'page': page,
      'limit': limit,
      if (search != null) 'search': search,
    });
    
    return (response.data['data'] as List)
        .map((json) => Customer.fromJson(json))
        .toList();
  }
  
  // 📊 DASHBOARD
  static Future<DashboardData> getDashboardData({
    String period = 'month',
    String? startDate,
    String? endDate,
  }) async {
    final response = await _dio.get('/dashboard/data', queryParameters: {
      'period': period,
      if (startDate != null) 'startDate': startDate,
      if (endDate != null) 'endDate': endDate,
    });
    
    return DashboardData.fromJson(response.data['data']);
  }
}
```

## 🔐 Service d'Authentification

```dart
// services/auth_service.dart
class AuthService {
  static final Dio _dio = ApiService.dio;
  
  static Future<AuthResponse> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    
    final authResponse = AuthResponse.fromJson(response.data);
    
    // Sauvegarder le token
    await AuthStorage.saveToken(authResponse.accessToken);
    await AuthStorage.saveRefreshToken(authResponse.refreshToken);
    
    return authResponse;
  }
  
  static Future<void> logout() async {
    await AuthStorage.clearTokens();
    // Rediriger vers écran de login
  }
  
  static Future<User> getProfile() async {
    final response = await _dio.get('/auth/me');
    return User.fromJson(response.data['data']);
  }
}
```

## 💾 Storage Local

```dart
// services/auth_storage.dart
import 'package:shared_preferences/shared_preferences.dart';

class AuthStorage {
  static const String _tokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }
  
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }
  
  static Future<void> saveRefreshToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_refreshTokenKey, token);
  }
  
  static Future<void> clearTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_refreshTokenKey);
  }
}
```

## 🔧 Configuration Android (Permissions réseau)

### android/app/src/main/AndroidManifest.xml
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permissions réseau -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Permettre le trafic HTTP en développement -->
    <application
        android:usesCleartextTraffic="true"
        android:networkSecurityConfig="@xml/network_security_config">
        
        <!-- Reste de votre configuration -->
    </application>
</manifest>
```

### android/app/src/main/res/xml/network_security_config.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.1.65</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

## 🧪 Test de Connectivité

### Test simple
```dart
// utils/connectivity_test.dart
class ConnectivityTest {
  static Future<bool> testApiConnection() async {
    try {
      final response = await Dio().get('${ApiConfig.baseUrl}/health');
      return response.statusCode == 200;
    } catch (e) {
      print('❌ Erreur de connexion API: $e');
      return false;
    }
  }
}
```

## 📝 Format des Réponses API

Toutes les réponses suivent ce format :
```dart
class ApiResponse<T> {
  final bool success;
  final String message;
  final int statusCode;
  final T? data;
  final String? error;
  
  ApiResponse({
    required this.success,
    required this.message,
    required this.statusCode,
    this.data,
    this.error,
  });
}
```

## ⚠️ Points Importants

1. **Adresse IP** : Changez `192.168.1.65` par l'IP de votre serveur
2. **HTTPS** : En production, utilisez HTTPS uniquement
3. **Timeouts** : Ajustez selon votre réseau
4. **Gestion d'erreurs** : Implémentez une gestion robuste des erreurs réseau
5. **Cache** : Considérez l'ajout de cache pour les données statiques

## 🚀 URLs de Test

- **Health Check** : `http://192.168.1.65:8000/health`
- **API Commerce** : `http://192.168.1.65:8000/commerce`
- **Documentation** : `http://192.168.1.65:8000/api/docs` (si disponible)

---
**📞 Support** : Contactez l'équipe backend en cas de problème de connectivité
