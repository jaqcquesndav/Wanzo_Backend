# Intégration de l'API de Paiement

Ce document explique comment utiliser l'API de paiement dans l'application Wanzo Portfolio.

## Importation du service API

Pour utiliser l'API de paiement dans un composant React, importez le service depuis son emplacement :

```typescript
import { paymentApi } from '../../../services/api/shared/payment.api';
```

## Fonctions disponibles

Le service `paymentApi` offre les méthodes suivantes :

### 1. Récupérer tous les ordres de paiement

```typescript
const getAllPayments = async () => {
  try {
    const filters = {
      portfolioId: 'port-123',   // Optionnel : filtrer par portefeuille
      status: 'pending',         // Optionnel : filtrer par statut
      fromDate: '2023-01-01',    // Optionnel : date de début
      toDate: '2023-01-31'       // Optionnel : date de fin
    };
    
    const response = await paymentApi.getAllPaymentOrders(filters);
    
    if (response.data) {
      const payments = response.data;
      // Traiter les données...
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements', error);
    // Gérer l'erreur
  }
};
```

### 2. Récupérer un ordre de paiement par ID

```typescript
const getPaymentDetails = async (paymentId) => {
  try {
    const response = await paymentApi.getPaymentOrderById(paymentId);
    
    if (response.data) {
      const payment = response.data;
      // Traiter les données...
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du paiement', error);
    // Gérer l'erreur
  }
};
```

### 3. Créer un nouvel ordre de paiement

```typescript
const createNewPayment = async () => {
  try {
    const newPayment = {
      orderNumber: 'OP-2023-002',
      date: new Date().toISOString().split('T')[0],
      amount: 3500000,
      currency: 'XAF',
      beneficiary: {
        name: 'Entreprise XYZ',
        accountNumber: '987654321',
        bankName: 'Banque Nationale',
        swiftCode: 'BNTNCD01'
      },
      reference: 'Paiement du matériel',
      description: 'Paiement pour achat de matériel informatique',
      portfolioId: 'port-456',
      portfolioName: 'Portefeuille Tech',
      status: 'draft',
      createdBy: 'user-123'
    };
    
    const response = await paymentApi.createPaymentOrder(newPayment);
    
    if (response.data) {
      const createdPayment = response.data;
      // Traiter les données...
    }
  } catch (error) {
    console.error('Erreur lors de la création du paiement', error);
    // Gérer l'erreur
  }
};
```

### 4. Mettre à jour un ordre de paiement

```typescript
const updatePayment = async (paymentId) => {
  try {
    const updates = {
      amount: 4000000,
      description: 'Paiement pour achat de matériel informatique (montant révisé)'
    };
    
    const response = await paymentApi.updatePaymentOrder(paymentId, updates);
    
    if (response.data) {
      const updatedPayment = response.data;
      // Traiter les données...
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du paiement', error);
    // Gérer l'erreur
  }
};
```

### 5. Mettre à jour le statut d'un ordre de paiement

```typescript
const approvePayment = async (paymentId) => {
  try {
    const response = await paymentApi.updatePaymentStatus(
      paymentId, 
      'approved', 
      'Validé après vérification des documents'
    );
    
    if (response.data) {
      const approvedPayment = response.data;
      // Traiter les données...
    }
  } catch (error) {
    console.error('Erreur lors de l\'approbation du paiement', error);
    // Gérer l'erreur
  }
};
```

### 6. Annuler un ordre de paiement

```typescript
const cancelPayment = async (paymentId) => {
  try {
    const response = await paymentApi.cancelPayment(
      paymentId, 
      'Annulé suite à l\'annulation du contrat'
    );
    
    if (response.data) {
      const cancelledPayment = response.data;
      // Traiter les données...
    }
  } catch (error) {
    console.error('Erreur lors de l\'annulation du paiement', error);
    // Gérer l'erreur
  }
};
```

### 7. Récupérer l'historique d'un ordre de paiement

```typescript
const getPaymentHistory = async (paymentId) => {
  try {
    const response = await paymentApi.getPaymentHistory(paymentId);
    
    if (response.data) {
      const history = response.data;
      // Traiter les données...
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique', error);
    // Gérer l'erreur
  }
};
```

### 8. Générer un rapport de paiement

```typescript
const generateReport = async () => {
  try {
    const filters = {
      portfolioId: 'port-123',
      fromDate: '2023-01-01',
      toDate: '2023-01-31',
      groupBy: 'week'
    };
    
    const response = await paymentApi.generatePaymentReport(filters);
    
    if (response.data) {
      const report = response.data;
      window.open(report.reportUrl, '_blank');
      // Traiter les données...
    }
  } catch (error) {
    console.error('Erreur lors de la génération du rapport', error);
    // Gérer l'erreur
  }
};
```

### 9. Récupérer les ordres de paiement par bénéficiaire

```typescript
const getPaymentsByBeneficiary = async (beneficiaryName) => {
  try {
    const response = await paymentApi.getPaymentOrdersByBeneficiary(beneficiaryName);
    
    if (response.data) {
      const payments = response.data;
      // Traiter les données...
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements par bénéficiaire', error);
    // Gérer l'erreur
  }
};
```

## Utilisation avec React Hooks

Voici un exemple d'utilisation de l'API de paiement avec React Hooks dans un composant :

```tsx
import React, { useState, useEffect } from 'react';
import { paymentApi } from '../../../services/api/shared/payment.api';
import type { PaymentOrderData } from '../../../components/payment/PaymentOrderModal';

const PaymentList: React.FC = () => {
  const [payments, setPayments] = useState<PaymentOrderData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const response = await paymentApi.getAllPaymentOrders();
        setPayments(response.data || []);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des paiements');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const handleApprovePayment = async (id: string) => {
    try {
      await paymentApi.updatePaymentStatus(id, 'approved', 'Approuvé');
      // Rafraîchir la liste après l'approbation
      const response = await paymentApi.getAllPaymentOrders();
      setPayments(response.data || []);
    } catch (err) {
      setError('Erreur lors de l\'approbation du paiement');
      console.error(err);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      <h2>Ordres de paiement</h2>
      <ul>
        {payments.map(payment => (
          <li key={payment.id}>
            {payment.orderNumber} - {payment.beneficiary.name} - {payment.amount} {payment.currency}
            {payment.status === 'pending' && (
              <button onClick={() => handleApprovePayment(payment.id)}>
                Approuver
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PaymentList;
```

## Gestion des erreurs

Toutes les méthodes de l'API peuvent lancer des exceptions. Il est recommandé d'utiliser des blocs try/catch pour gérer ces erreurs :

```typescript
try {
  const response = await paymentApi.getPaymentOrderById('non-existent-id');
} catch (error) {
  if (error.response) {
    // La requête a été effectuée et le serveur a répondu avec un code d'erreur
    if (error.response.status === 404) {
      console.error('Paiement non trouvé');
    } else if (error.response.status === 403) {
      console.error('Accès non autorisé');
    } else {
      console.error('Erreur serveur:', error.response.data);
    }
  } else if (error.request) {
    // La requête a été effectuée mais aucune réponse n'a été reçue
    console.error('Aucune réponse du serveur');
  } else {
    // Une erreur s'est produite lors de la configuration de la requête
    console.error('Erreur de requête:', error.message);
  }
}
```
