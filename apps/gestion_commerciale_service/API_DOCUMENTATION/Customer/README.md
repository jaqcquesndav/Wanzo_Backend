# Documentation de l'API Customer

## Aperçu

Le module Customer de l'application Wanzo gère toutes les opérations liées aux clients. Il fournit des fonctionnalités pour créer, lire, mettre à jour et supprimer des informations client, ainsi que pour rechercher des clients et obtenir des statistiques sur les meilleurs clients et les clients récents.

## Modèle de Données

### Customer

Le modèle `Customer` représente un client dans le système. Il prend en charge à la fois le stockage local via Hive et la sérialisation JSON pour les communications API.

```dart
@HiveType(typeId: 35)
@JsonSerializable(explicitToJson: true)
class Customer {
  String id;               // Identifiant unique du client
  @JsonKey(name: 'fullName') // Pour compatibilité avec l'API
  String name;             // Nom du client
  String phoneNumber;      // Numéro de téléphone du client
  String? email;           // Adresse email du client (optionnel)
  String? address;         // Adresse physique du client (optionnel)
  DateTime createdAt;      // Date de création du client dans le système
  String? notes;           // Notes ou informations supplémentaires (optionnel)
  double totalPurchases;   // Historique d'achat total du client (en FC)
  DateTime? lastPurchaseDate; // Date de dernier achat
  CustomerCategory category; // Catégorie du client
  String? profilePicture;  // URL de la photo de profil du client (optionnel)
```

### CustomerCategory (Enum)

Cette énumération définit les différentes catégories de clients:

```dart
enum CustomerCategory {
  vip,          // Client VIP ou premium
  regular,      // Client régulier
  new_customer, // Nouveau client
  occasional,   // Client occasionnel
  business,     // Client B2B (Business to Business)
}
```

## Repository

Le `CustomerRepository` fournit les méthodes pour interagir avec la base de données des clients.

### Méthodes principales

#### init()
```dart
Future<void> init()
```
Initialise le repository et ouvre la boîte Hive pour stocker les clients.

#### getCustomers()
```dart
Future<List<Customer>> getCustomers()
```
Récupère tous les clients stockés dans la base de données.

#### getCustomer(String id)
```dart
Future<Customer?> getCustomer(String id)
```
Récupère un client spécifique par son identifiant.

#### addCustomer(Customer customer)
```dart
Future<Customer> addCustomer(Customer customer)
```
Ajoute un nouveau client au système et génère automatiquement un ID et une date de création.

#### updateCustomer(Customer customer)
```dart
Future<Customer> updateCustomer(Customer customer)
```
Met à jour les informations d'un client existant.

#### deleteCustomer(String id)
```dart
Future<void> deleteCustomer(String id)
```
Supprime un client par son identifiant.

#### searchCustomers(String searchTerm)
```dart
Future<List<Customer>> searchCustomers(String searchTerm)
```
Recherche des clients dont le nom, l'email ou le numéro de téléphone contiennent le terme de recherche.

#### getTopCustomers({int limit = 5})
```dart
Future<List<Customer>> getTopCustomers({int limit = 5})
```
Récupère les meilleurs clients en fonction du montant total de leurs achats.

#### getRecentCustomers({int limit = 5})
```dart
Future<List<Customer>> getRecentCustomers({int limit = 5})
```
Récupère les clients les plus récents, triés par date de leur dernier achat.

#### updateCustomerPurchaseTotal(String customerId, double amount)
```dart
Future<Customer> updateCustomerPurchaseTotal(String customerId, double amount)
```
Met à jour le total des achats d'un client en ajoutant le montant spécifié et en mettant à jour la date du dernier achat.

#### getUniqueCustomersCountForDateRange(DateTime startDate, DateTime endDate)
```dart
Future<int> getUniqueCustomersCountForDateRange(DateTime startDate, DateTime endDate)
```
Renvoie le nombre de clients uniques qui ont effectué des achats pendant la période spécifiée.

## Bloc Customer

Le module utilise l'architecture BLoC (Business Logic Component) pour gérer l'état et les événements liés aux clients.

### États (CustomerState)

- `CustomerInitial` : État initial
- `CustomerLoading` : En cours de chargement
- `CustomersLoaded` : Liste de clients chargée
- `CustomerLoaded` : Un client spécifique chargé
- `CustomerOperationSuccess` : Opération sur un client réussie
- `CustomerSearchResults` : Résultats de recherche de clients
- `TopCustomersLoaded` : Meilleurs clients chargés
- `RecentCustomersLoaded` : Clients récents chargés
- `CustomerError` : Erreur survenue

### Événements (CustomerEvent)

- `LoadCustomers` : Charger tous les clients
- `LoadCustomer` : Charger un client spécifique
- `AddCustomer` : Ajouter un nouveau client
- `UpdateCustomer` : Mettre à jour un client existant
- `DeleteCustomer` : Supprimer un client
- `SearchCustomers` : Rechercher des clients
- `LoadTopCustomers` : Charger les meilleurs clients
- `LoadRecentCustomers` : Charger les clients récents
- `UpdateCustomerPurchaseTotal` : Mettre à jour le total des achats d'un client

## Intégration avec d'autres modules

Le module Customer s'intègre avec d'autres modules de l'application :

1. **Sales** : Le `CustomerRepository` utilise le `SalesRepository` pour obtenir les ventes associées à un client et calculer des statistiques.

2. **Dashboard** : Le module Dashboard utilise les informations des clients pour afficher des statistiques de vente et d'activité client.

## Note importante sur la consolidation des modules

Auparavant, l'application comportait deux modèles clients distincts:
1. `Customer` dans le dossier `features/customer/models/`
2. `Customer` dans le dossier `features/customers/models/`

Ces deux modèles ont été consolidés en un seul modèle unifié avec les caractéristiques suivantes:
- Le modèle principal est dans `features/customer/models/`
- Il conserve le champ `name` mais ajoute une annotation `@JsonKey(name: 'fullName')` pour la compatibilité API
- Il a été enrichi avec la propriété `profilePicture` qui était précédemment unique au modèle `customers`
- Il intègre les fonctionnalités de sérialisation JSON pour la communication API
- Il garde son `typeId` Hive original (35)

Cette consolidation simplifie le code base et évite la duplication tout en maintenant la compatibilité avec les API existantes.

## Exemple d'utilisation du CustomerRepository

```dart
// Initialiser le repository
final customerRepository = CustomerRepository();
await customerRepository.init();

// Ajouter un nouveau client
final newCustomer = Customer(
  id: '', // Sera remplacé par un UUID généré
  name: 'John Doe',
  phoneNumber: '+243 123 456 789',
  email: 'john.doe@example.com',
  createdAt: DateTime.now(), // Sera remplacé lors de l'ajout
  profilePicture: 'https://example.com/profile.jpg', // Optionnel
);

final createdCustomer = await customerRepository.addCustomer(newCustomer);

// Récupérer tous les clients
final allCustomers = await customerRepository.getCustomers();

// Rechercher des clients
final searchResults = await customerRepository.searchCustomers('John');

// Mettre à jour le total des achats
final updatedCustomer = await customerRepository.updateCustomerPurchaseTotal(
  createdCustomer.id, 
  50000.0
);
```

## Exemple d'utilisation du CustomerBloc

```dart
// Créer une instance du Bloc
final customerBloc = CustomerBloc(customerRepository: customerRepository);

// Charger tous les clients
customerBloc.add(const LoadCustomers());

// Ajouter un nouveau client
customerBloc.add(AddCustomer(customer: newCustomer));

// Supprimer un client
customerBloc.add(DeleteCustomer(customerId: 'customer-id'));

// Rechercher des clients
customerBloc.add(SearchCustomers(searchTerm: 'John'));
```
