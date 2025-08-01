# Architecture de Communication entre Adha AI et le Service Comptable

## Vue d'ensemble

Ce document décrit l'architecture de communication entre le service Adha AI et le service de comptabilité. La communication est basée sur un système d'événements asynchrones utilisant Apache Kafka comme broker de messages.

## Flux de Communication

### 1. Génération d'écritures comptables

**Service Adha AI** → **Service Comptable**

1. Adha AI génère une écriture comptable à partir d'une opération commerciale
2. L'écriture est envoyée sur le topic Kafka `accounting.journal.entry`
3. Le service comptable consomme ce message et tente de créer l'écriture

### 2. Confirmation de traitement

**Service Comptable** → **Service Adha AI**

1. Après traitement de l'écriture (succès ou échec), le service comptable envoie un statut
2. Le statut est publié sur le topic Kafka `accounting.journal.status`
3. Adha AI consomme ce message pour mettre à jour son état interne

## Structure des messages

### Format d'une écriture comptable

```json
{
  "id": "string",
  "sourceId": "string",
  "sourceType": "string",
  "clientId": "string",
  "companyId": "string",
  "date": "string (ISO 8601)",
  "description": "string",
  "amount": "number",
  "currency": "string",
  "createdAt": "string (ISO 8601)",
  "createdBy": "string",
  "status": "string",
  "journalType": "string",
  "lines": [
    {
      "accountCode": "string",
      "label": "string",
      "debit": "number",
      "credit": "number"
    }
  ],
  "metadata": {
    "key": "value"
  }
}
```

### Format d'un message de statut

```json
{
  "journalEntryId": "string",
  "sourceId": "string",
  "success": "boolean",
  "message": "string",
  "timestamp": "string (ISO 8601)",
  "processedBy": "string"
}
```

## Gestion des erreurs

- En cas d'échec de traitement, le service comptable envoie un statut avec `success: false`
- Adha AI peut implémenter un mécanisme de retry pour les écritures non traitées
- Les erreurs sont journalisées dans les logs des deux services

## Convention de nommage des topics

Pour améliorer la lisibilité et la maintenabilité, tous les topics Kafka suivent la convention de nommage suivante:

```
<domaine>.<type_entite>.<action>
```

Exemples:
- `accounting.journal.entry` - Une écriture comptable à traiter
- `accounting.journal.status` - Le statut de traitement d'une écriture
- `commerce.operation.created` - Une opération commerciale créée

Cette convention permet une meilleure organisation des topics et facilite leur compréhension.
