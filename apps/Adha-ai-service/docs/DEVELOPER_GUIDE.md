# Guide Développeur pour l'Intégration avec Adha AI

Ce guide explique comment intégrer les différents services de Wanzo avec le service Adha AI, en se concentrant particulièrement sur l'intégration du service Portfolio Institution.

## 1. Configuration de l'environnement

### 1.1 Prérequis

- Node.js 16+ (pour les services TypeScript)
- Python 3.9+ (pour le service Adha AI)
- Kafka 3.0+
- Docker et Docker Compose

### 1.2 Variables d'environnement

Assurez-vous que les variables d'environnement suivantes sont définies :

```
KAFKA_BROKER_URL=localhost:9092
ADHA_AI_SERVICE_URL=http://localhost:8050
PORTFOLIO_SERVICE_URL=http://localhost:8030
```

## 2. Intégration avec le service Portfolio Institution

### 2.1 Installation des dépendances

Ajoutez les packages partagés à votre service :

```bash
npm install @app/shared --save
```

### 2.2 Configuration de Kafka

Assurez-vous que le service Kafka est configuré dans votre module :

```typescript
import { KafkaModule } from '@app/shared';

@Module({
  imports: [
    KafkaModule.forRoot({
      clientId: 'portfolio-institution',
      brokers: [process.env.KAFKA_BROKER_URL || 'localhost:9092'],
      groupId: 'portfolio-institution-group'
    }),
    // ...
  ],
  // ...
})
export class AppModule {}
```

### 2.3 Intégration du service AdhaAIIntegrationService

1. Importez le service dans votre module :

```typescript
import { AdhaAIIntegrationService } from './modules/integration/adha-ai-integration.service';

@Module({
  providers: [
    AdhaAIIntegrationService,
    // ...
  ],
  exports: [
    AdhaAIIntegrationService
  ]
})
export class IntegrationModule {}
```

2. Injectez et utilisez le service dans vos contrôleurs ou services :

```typescript
import { AdhaAIIntegrationService } from '../../integration/adha-ai-integration.service';
import { PortfolioAnalysisType } from '@app/shared/events/portfolio-ai-events';

@Injectable()
export class PortfolioAnalysisService {
  constructor(private adhaAIService: AdhaAIIntegrationService) {
    // Configurer les consommateurs pour recevoir les réponses
    this.setupConsumers();
  }
  
  async requestAnalysis(portfolioId: string, institutionId: string, userId: string, userRole: string) {
    // Demander une analyse à Adha AI
    return this.adhaAIService.requestPortfolioAnalysis(
      portfolioId,
      institutionId,
      userId,
      userRole,
      'credit',
      [PortfolioAnalysisType.FINANCIAL, PortfolioAnalysisType.RISK]
    );
  }
  
  private setupConsumers() {
    this.adhaAIService.setupConsumers(
      // Gestionnaire des réponses d'analyse
      async (analysisResponse) => {
        // Traitement des réponses d'analyse
        console.log(`Received analysis for portfolio ${analysisResponse.portfolioId}`);
        // Sauvegarder l'analyse, notifier l'utilisateur, etc.
      },
      
      // Gestionnaire des réponses de chat (peut être vide si non utilisé)
      async () => {}
    );
  }
}
```

### 2.4 Intégration avec le module de chat

Voir l'implémentation mise à jour du `ChatService` qui intègre le service AdhaAI pour le traitement des messages de chat.

## 3. Format des messages

### 3.1 Demandes d'analyse de portefeuille

Exemple de demande d'analyse :

```typescript
const analysisRequest = {
  id: 'analysis-123',  // ID unique
  portfolioId: 'portfolio-456',
  institutionId: 'institution-789',
  userId: 'user-101112',
  userRole: 'INSTITUTION_USER',
  timestamp: new Date().toISOString(),
  analysisTypes: [
    PortfolioAnalysisType.FINANCIAL, 
    PortfolioAnalysisType.RISK
  ],
  contextInfo: {
    source: 'portfolio_institution',
    mode: 'analysis',
    portfolioType: 'credit',
    // Données contextuelles additionnelles
    portfolio: {
      id: 'portfolio-456',
      name: 'Portefeuille PME',
      type: 'credit',
      // ...autres données du portefeuille
    }
  }
};
```

### 3.2 Messages de chat

Exemple de message de chat :

```typescript
const chatMessage = {
  id: 'msg-123',  // ID unique
  chatId: 'chat-456',
  userId: 'user-101112',
  userRole: 'INSTITUTION_USER',
  content: "Quelle est la santé financière de mon portefeuille de crédit ?",
  timestamp: new Date().toISOString(),
  contextInfo: {
    source: 'portfolio_institution',
    mode: 'chat',
    institutionId: 'institution-789',
    portfolioId: 'portfolio-456',
    // Données contextuelles additionnelles
    portfolio: {
      id: 'portfolio-456',
      name: 'Portefeuille PME',
      type: 'credit'
    }
  }
};
```

## 4. Déboggage et dépannage

### 4.1 Vérification des logs Kafka

Pour vérifier les messages Kafka :

```bash
docker exec -it kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic portfolio.analysis.request --from-beginning
```

### 4.2 Problèmes courants

- **Erreur de connexion Kafka** : Vérifiez que les brokers Kafka sont accessibles et que les configs sont correctes
- **Messages non traités** : Vérifiez que les consommateurs sont bien démarrés et que les topics existent
- **Format de message incorrect** : Validez le format des messages avec les interfaces TypeScript

### 4.3 Outils de diagnostic

- **Kafdrop** : Interface web pour explorer les topics Kafka et leur contenu
  ```bash
  docker run -d --rm -p 9000:9000 -e KAFKA_BROKERCONNECT=kafka:9092 obsidiandynamics/kafdrop
  ```

- **Logging d'Adha AI** : Consultez les logs du service pour voir les erreurs de traitement
  ```bash
  docker logs adha-ai-service -f
  ```

## 5. Tests et validation

### 5.1 Tests d'intégration

Exemple de test d'intégration :

```typescript
describe('AdhaAI Integration', () => {
  it('should send and receive portfolio analysis', async () => {
    const analysisId = await adhaAIService.requestPortfolioAnalysis(
      'test-portfolio',
      'test-institution',
      'test-user',
      'INSTITUTION_USER',
      'credit',
      [PortfolioAnalysisType.FINANCIAL]
    );
    
    expect(analysisId).toBeDefined();
    
    // Attendre la réponse (avec timeout)
    // ...
  });
});
```

### 5.2 Tests manuels

1. Démarrez les services avec `docker-compose up`
2. Envoyez une demande d'analyse via l'API REST du service Portfolio Institution
3. Vérifiez les logs du service Adha AI pour confirmer la réception et le traitement
4. Vérifiez la base de données du service Portfolio Institution pour confirmer la réception de la réponse

## 6. Ressources additionnelles

- [Documentation Kafka](https://kafka.apache.org/documentation/)
- [Documentation NestJS](https://docs.nestjs.com/)
- [Architecture de Communication](./COMMUNICATION_ARCHITECTURE.md)
- [Documentation API](../API%20DOCUMENTATION/)
