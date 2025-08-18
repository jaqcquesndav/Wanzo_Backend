# @wanzobe/types

Package centralisant les définitions de types pour l'écosystème Wanzobe.

## Description

Ce package contient les déclarations de types TypeScript pour les dépendances externes qui ne fournissent pas leurs propres types ou dont les types officiels sont incompatibles avec notre configuration.

## Modules couverts

### Date manipulation
- `date-fns` - Fonctions utilitaires pour la manipulation de dates

### Hapi.js ecosystem
- `@hapi/catbox` - Client de cache pour Hapi.js
- `@hapi/shot` - Injection de requêtes HTTP pour les tests

### Global augmentations
- Variables d'environnement Node.js typées

## Utilisation

Les types sont automatiquement disponibles dans tous les microservices grâce à la configuration TypeScript centralisée.

```typescript
import { format, addDays } from 'date-fns';
import { inject } from '@hapi/shot';
import { Client } from '@hapi/catbox';

// Les types sont automatiquement reconnus
const formattedDate = format(new Date(), 'yyyy-MM-dd');
```

## Maintenance

- Ajouter de nouveaux types dans `index.d.ts`
- Maintenir la cohérence avec les versions des packages utilisés
- Documenter les types ajoutés dans ce README

## Architecture

Ce package fait partie de la stratégie TypeScript centralisée du monorepo Wanzobe :

```
packages/
├── types/           # Types partagés (ce package)
├── tsconfig/        # Configurations TypeScript partagées
└── shared/          # Code partagé
```
