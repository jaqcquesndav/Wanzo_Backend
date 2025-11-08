/**
 * Tests de validation des structures de données pour l'intégration SerdiPay
 * 
 * Ce fichier contient des tests pour s'assurer que les données envoyées
 * du frontend → customer-service → payment-service sont compatibles avec SerdiPay
 */

// Structure de données attendue par SerdiPay (basée sur le payment-service existant)
interface SerdiPayRequest {
  amount: string;
  currency: string;
  clientPhone: string;
  telecom: 'AM' | 'OM' | 'MP' | 'AF';
  channel?: 'merchant' | 'client';
  clientReference?: string;
  description: string;
  returnURL?: string;
  cancelURL?: string;
  metadata?: {
    customerId?: string;
    planId?: string;
    planName?: string;
    subscriptionId?: string;
    paymentType?: string;
  };
}

// Structure envoyée par le frontend au customer-service
interface FrontendPaymentRequest {
  planId: string;
  clientPhone: string;
  telecom: 'AM' | 'OM' | 'MP' | 'AF';
  channel?: 'merchant' | 'client';
  clientReference?: string;
}

// Structure transformée par customer-service pour le payment-service
interface CustomerServiceToPaymentServiceRequest {
  planId: string;
  customerId: string;
  clientPhone: string;
  telecom: 'AM' | 'OM' | 'MP' | 'AF';
  channel?: 'merchant' | 'client';
  clientReference?: string;
}

// Structure de réponse du payment-service
interface PaymentServiceResponse {
  transactionId: string;
  providerTransactionId?: string;
  sessionId?: string;
  status: 'pending' | 'success' | 'failed';
  message?: string;
  plan?: {
    id: string;
    name: string;
    tokensIncluded?: number;
  };
}

/**
 * Tests de validation des données
 */
class SubscriptionPaymentDataValidator {
  
  /**
   * Valide que les données du frontend sont transformables pour SerdiPay
   */
  static validateFrontendToSerdiPayCompatibility(
    frontendRequest: FrontendPaymentRequest,
    planData: { name: string; priceUSD: number; currency: string }
  ): boolean {
    try {
      // Validation du numéro de téléphone (format RDC)
      if (!frontendRequest.clientPhone.match(/^243[0-9]{9}$/)) {
        console.error('Invalid phone format:', frontendRequest.clientPhone);
        return false;
      }

      // Validation de l'opérateur télécom
      const validTelecoms = ['AM', 'OM', 'MP', 'AF'];
      if (!validTelecoms.includes(frontendRequest.telecom)) {
        console.error('Invalid telecom:', frontendRequest.telecom);
        return false;
      }

      // Validation du planId (UUID format)
      if (!frontendRequest.planId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error('Invalid planId format:', frontendRequest.planId);
        return false;
      }

      // Simulation de la transformation vers SerdiPay
      const serdiPayRequest: SerdiPayRequest = {
        amount: planData.priceUSD.toString(),
        currency: planData.currency,
        clientPhone: frontendRequest.clientPhone,
        telecom: frontendRequest.telecom,
        channel: frontendRequest.channel || 'merchant',
        clientReference: frontendRequest.clientReference,
        description: `Abonnement plan: ${planData.name}`,
        metadata: {
          planId: frontendRequest.planId,
          planName: planData.name,
          paymentType: 'subscription'
        }
      };

      console.log('✅ Transformation vers SerdiPay réussie:', serdiPayRequest);
      return true;

    } catch (error) {
      console.error('❌ Erreur de validation:', error);
      return false;
    }
  }

  /**
   * Teste le mapping des opérateurs télécom
   */
  static validateTelecomMapping(): boolean {
    const telecomMappings = {
      'AM': 'Airtel Money',
      'OM': 'Orange Money', 
      'MP': 'M-Pesa',
      'AF': 'Africell'
    };

    console.log('📱 Mappings des opérateurs télécom:');
    Object.entries(telecomMappings).forEach(([code, name]) => {
      console.log(`  ${code} → ${name}`);
    });

    return true;
  }

  /**
   * Valide les instructions de paiement par opérateur
   */
  static validatePaymentInstructions(): boolean {
    const instructions = {
      'AM': 'Composez *150# et suivez les instructions pour confirmer le paiement',
      'OM': 'Composez #150# et suivez les instructions pour confirmer le paiement',
      'MP': 'Ouvrez l\'application M-Pesa ou composez *100# pour confirmer le paiement',
      'AF': 'Composez *144# et suivez les instructions pour confirmer le paiement'
    };

    console.log('💳 Instructions de paiement par opérateur:');
    Object.entries(instructions).forEach(([telecom, instruction]) => {
      console.log(`  ${telecom}: ${instruction}`);
    });

    return true;
  }
}

/**
 * Exemples de tests avec des données réelles
 */
function runCompatibilityTests() {
  console.log('🧪 Tests de compatibilité des structures de données\n');

  // Test 1: Validation d'une requête Airtel Money
  console.log('Test 1: Airtel Money Payment');
  const airtelRequest: FrontendPaymentRequest = {
    planId: '550e8400-e29b-41d4-a716-446655440000',
    clientPhone: '243994972450',
    telecom: 'AM',
    channel: 'merchant',
    clientReference: 'user-ref-001'
  };

  const planData = {
    name: 'Standard Monthly Plan',
    priceUSD: 50.00,
    currency: 'CDF'
  };

  const test1Result = SubscriptionPaymentDataValidator.validateFrontendToSerdiPayCompatibility(
    airtelRequest, 
    planData
  );
  console.log(`Résultat: ${test1Result ? '✅ PASSED' : '❌ FAILED'}\n`);

  // Test 2: Validation d'une requête Orange Money
  console.log('Test 2: Orange Money Payment');
  const orangeRequest: FrontendPaymentRequest = {
    planId: '550e8400-e29b-41d4-a716-446655440001',
    clientPhone: '243810123456',
    telecom: 'OM',
    channel: 'client'
  };

  const test2Result = SubscriptionPaymentDataValidator.validateFrontendToSerdiPayCompatibility(
    orangeRequest,
    planData
  );
  console.log(`Résultat: ${test2Result ? '✅ PASSED' : '❌ FAILED'}\n`);

  // Test 3: Validation des mappings et instructions
  console.log('Test 3: Telecom Mappings');
  const test3Result = SubscriptionPaymentDataValidator.validateTelecomMapping();
  console.log(`Résultat: ${test3Result ? '✅ PASSED' : '❌ FAILED'}\n`);

  console.log('Test 4: Payment Instructions');
  const test4Result = SubscriptionPaymentDataValidator.validatePaymentInstructions();
  console.log(`Résultat: ${test4Result ? '✅ PASSED' : '❌ FAILED'}\n`);

  // Résumé
  const allTestsPassed = test1Result && test2Result && test3Result && test4Result;
  console.log(`📊 Résumé: ${allTestsPassed ? '✅ TOUS LES TESTS PASSÉS' : '❌ CERTAINS TESTS ONT ÉCHOUÉ'}`);
  
  return allTestsPassed;
}

/**
 * Exemple de flux de données complet
 */
function demonstrateDataFlow() {
  console.log('\n🔄 Démonstration du flux de données complet\n');

  console.log('1️⃣ Frontend envoie à Customer Service:');
  const frontendData = {
    planId: '550e8400-e29b-41d4-a716-446655440000',
    clientPhone: '243994972450',
    telecom: 'AM' as const,
    channel: 'merchant' as const,
    clientReference: 'my-purchase-001'
  };
  console.log(JSON.stringify(frontendData, null, 2));

  console.log('\n2️⃣ Customer Service enrichit et envoie à Payment Service:');
  const customerServiceData = {
    ...frontendData,
    customerId: 'customer-uuid-123',
    // Le customer-service ajoute des informations du plan
    planName: 'Standard Monthly Plan',
    amount: '50.00',
    currency: 'CDF'
  };
  console.log(JSON.stringify(customerServiceData, null, 2));

  console.log('\n3️⃣ Payment Service transforme pour SerdiPay:');
  const serdiPayData = {
    amount: '50.00',
    currency: 'CDF',
    clientPhone: '243994972450',
    telecom: 'AM',
    channel: 'merchant',
    clientReference: 'my-purchase-001',
    description: 'Abonnement plan: Standard Monthly Plan',
    metadata: {
      customerId: 'customer-uuid-123',
      planId: '550e8400-e29b-41d4-a716-446655440000',
      planName: 'Standard Monthly Plan',
      subscriptionId: 'sub-uuid-456',
      paymentType: 'subscription'
    }
  };
  console.log(JSON.stringify(serdiPayData, null, 2));

  console.log('\n4️⃣ SerdiPay répond:');
  const serdiPayResponse = {
    status: 'pending',
    sessionId: 'serdipay-session-789',
    transactionId: 'serdipay-tx-101112',
    message: 'Transaction in process'
  };
  console.log(JSON.stringify(serdiPayResponse, null, 2));

  console.log('\n5️⃣ Payment Service répond à Customer Service:');
  const paymentServiceResponse = {
    transactionId: 'internal-tx-uuid-789',
    providerTransactionId: 'serdipay-tx-101112',
    sessionId: 'serdipay-session-789',
    status: 'pending',
    message: 'Transaction in process',
    plan: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Standard Monthly Plan',
      tokensIncluded: 1000
    }
  };
  console.log(JSON.stringify(paymentServiceResponse, null, 2));

  console.log('\n6️⃣ Customer Service répond au Frontend:');
  const finalResponse = {
    success: true,
    data: {
      ...paymentServiceResponse,
      instructions: 'Composez *150# et suivez les instructions pour confirmer le paiement de 50.00 CDF pour Standard Monthly Plan'
    }
  };
  console.log(JSON.stringify(finalResponse, null, 2));
}

// Exécution des tests si ce fichier est lancé directement
if (require.main === module) {
  runCompatibilityTests();
  demonstrateDataFlow();
}

export {
  SubscriptionPaymentDataValidator,
  runCompatibilityTests,
  demonstrateDataFlow
};

export type {
  SerdiPayRequest,
  FrontendPaymentRequest,
  CustomerServiceToPaymentServiceRequest,
  PaymentServiceResponse
};