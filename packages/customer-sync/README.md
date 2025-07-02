# Customer Sync Package

Ce package permet aux microservices de communiquer facilement avec le `customer-service` centralisé.

## Installation

Dans votre service, ajoutez le package comme dépendance:

```bash
# Pour un workspace Turbo/Lerna
cd apps/votre-service
yarn add @wanzobe/customer-sync

# OU pour npm
npm install @wanzobe/customer-sync
```

## Configuration

Dans votre module principal:

```typescript
import { Module } from '@nestjs/common';
import { CustomerSyncModule } from '@wanzobe/customer-sync';

@Module({
  imports: [
    CustomerSyncModule.register({
      kafkaClientId: 'votre-service-client',
      kafkaBrokers: ['kafka:9092'], // Ajustez selon votre environnement
      serviceIdentifier: 'votre-service-name',
    }),
  ],
  // ...
})
export class AppModule {}
```

## Utilisation

```typescript
import { Injectable } from '@nestjs/common';
import { CustomerSyncService } from '@wanzobe/customer-sync';

@Injectable()
export class VotreService {
  constructor(private readonly customerSyncService: CustomerSyncService) {}

  async getCustomerData(customerId: string) {
    return this.customerSyncService.getCustomerById(customerId);
  }

  async requestCustomerUpdate(customerId: string, updates: any) {
    return this.customerSyncService.requestCustomerUpdate(customerId, updates);
  }
}
```

## Compilation du package

Pour compiler le package après des modifications:

```bash
cd packages/customer-sync
yarn build
```

## Intégration dans le workspace

Assurez-vous que le package est correctement référencé dans le fichier `package.json` de votre service:

```json
{
  "dependencies": {
    "@wanzobe/customer-sync": "^1.0.0"
    // ...
  }
}
```

## Troubleshooting

Si vous rencontrez des erreurs de type "Cannot find module '@wanzobe/customer-sync'":

1. Vérifiez que le package a été compilé (`yarn build` dans le dossier du package)
2. Vérifiez que la dépendance est bien ajoutée dans votre `package.json`
3. Exécutez `yarn install` ou `npm install` à la racine du workspace
4. Redémarrez votre IDE pour rafraîchir le cache TypeScript
